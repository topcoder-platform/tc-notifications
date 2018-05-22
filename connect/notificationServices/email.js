/**
 * Email notification service
 */
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const co = require('co');
const { logger, busService, eventScheduler, notificationService } = require('../../index');
const { createEventScheduler, SCHEDULED_EVENT_STATUS } = eventScheduler;

const config = require('../config');
const { BUS_API_EVENT, SCHEDULED_EVENT_PERIOD, SETTINGS_EMAIL_SERVICE_ID } = require('../constants');
const helpers = require('../helpers');
const service = require('../service');

/**
 * Handles due events which are passed by scheduler
 *
 * Groups events by users, bundles them and sends using Bus API
 *
 * @param {Array}    events          due events
 * @param {Function} setEventsStatus function which sets statuses of processed events
 */
function handleScheduledEvents(events, setEventsStatus) {
  // do nothing if there are no due events
  if (events.length === 0) {
    return;
  }

  const eventsByUsers = _.groupBy(events, 'userId');

  _.values(eventsByUsers).forEach((userEvents) => {
    // clone data to avoid circular object
    // we use common data from the first event
    const eventMessage = _.clone(userEvents[0].data);

    // update common values for bundled email
    eventMessage.replyTo = config.DEFAULT_REPLY_EMAIL;
    eventMessage.cc = [];
    eventMessage.from = {
      name: config.DEFAULT_REPLY_EMAIL,
      email: config.DEFAULT_REPLY_EMAIL,
    };

    // TODO: consider using templating engine to format the bundle email
    // until there is Sendgrid support for loops in email templates
    let emailBody = '<h3>Your recent updates on Topcoder Connect</h3>';
    const eventsByTopics = _.groupBy(userEvents, 'data.data.topicId');
    emailBody += '<ul>';
    _.values(eventsByTopics).forEach((topicEvents) => {
      emailBody += '<li>';
      emailBody += `<a href="http://connect.topcoder.com/projects/${topicEvents[0].data.data.projectId}#feed-${topicEvents[0].data.data.topicId}"> ${topicEvents[0].data.data.topicTitle} </a>`;
      emailBody += `<span style="color:#777777"> - ${topicEvents.length} updates</span>`;
      emailBody += '</li>';
    });
    emailBody += '</ul>';

    // data property we define as an array of data from each individual event
    eventMessage.data = { notificationsHTML: emailBody };

    busService.postEvent({
      topic: BUS_API_EVENT.EMAIL.BUNDLED,
      originator: 'tc-notifications',
      timestamp: (new Date()).toISOString(),
      'mime-type': 'application/json',
      payload: eventMessage,
    }).then(() => {
      logger.info(`Successfully sent ${BUS_API_EVENT.EMAIL.BUNDLED} event`
        + ` with body ${JSON.stringify(eventMessage)} to bus api`);

      setEventsStatus(userEvents, SCHEDULED_EVENT_STATUS.COMPLETED);
    }).catch(() => {
      logger.error(`Failed to send ${BUS_API_EVENT.EMAIL.BUNDLED} event`
        + ` with body ${JSON.stringify(eventMessage)} to bus api`);

      setEventsStatus(userEvents, SCHEDULED_EVENT_STATUS.FAILED);
    });
  });
}

// create and initialize scheduler
const scheduler = createEventScheduler(
  BUS_API_EVENT.EMAIL.BUNDLED,
  SCHEDULED_EVENT_PERIOD,
  handleScheduledEvents
);

/**
 * Handler function which sends notification using email
 *
 * Depend on user settings it sends email immediately
 * or bundles notifications for some period and send them together
 *
 * @param {String} topicName    topic name (event type)
 * @param {Object} messageJSON  message raw JSON
 * @param {Object} notification pre-processed notification object
 */
function handler(topicName, messageJSON, notification) {
  // if it's interesting event, create email event and send to bus api
  const notificationType = notification.newType || topicName;
  logger.debug(`checking ${notificationType} notification ${JSON.stringify(notification)}`);
  let eventType;

  if (notificationType === BUS_API_EVENT.CONNECT.TOPIC_CREATED) {
    eventType = BUS_API_EVENT.EMAIL.TOPIC_CREATED;
  } else if (notificationType === BUS_API_EVENT.CONNECT.POST_CREATED) {
    eventType = BUS_API_EVENT.EMAIL.POST_CREATED;
  } else if (notificationType === BUS_API_EVENT.CONNECT.MENTIONED_IN_POST) {
    eventType = BUS_API_EVENT.EMAIL.MENTIONED_IN_POST;
  }

  if (!!eventType) {
    return co(function* () {
      const settings = yield notificationService.getSettings(notification.userId);

      // if email notification is explicitly disabled for current notification type do nothing
      // by default we treat all notification types enabled
      if (settings.notifications[notificationType]
        && settings.notifications[notificationType][SETTINGS_EMAIL_SERVICE_ID]
        && settings.notifications[notificationType][SETTINGS_EMAIL_SERVICE_ID].enabled === 'no'
      ) {
        logger.verbose(`Notification '${notificationType}' won't be sent by '${SETTINGS_EMAIL_SERVICE_ID}'`
          + ` service to the userId '${notification.userId}' due to his notification settings.`);
        return;
      }

      const topicId = parseInt(messageJSON.topicId, 10);
      const postId = messageJSON.postId ? parseInt(messageJSON.postId, 10) : null;

      const users = yield service.getUsersById([notification.userId]);
      logger.debug(`got users ${JSON.stringify(users)}`);

      const connectTopic = yield service.getTopic(topicId, logger);
      logger.debug(`got topic ${JSON.stringify(connectTopic)}`);

      const user = users[0];
      let userEmail = user.email;
      if (config.ENABLE_DEV_MODE === 'true') {
        userEmail = config.DEV_MODE_EMAIL;
      }
      const recipients = [userEmail];
      const cc = [];
      if (eventType === BUS_API_EVENT.EMAIL.MENTIONED_IN_POST) {
        cc.push(config.MENTION_EMAIL);
      }
      const categories = [`${config.ENV}:${eventType}`.toLowerCase()];

      // get jwt token then encode it with base64
      const body = {
        userId: parseInt(notification.userId, 10),
        topicId,
        userEmail: helpers.sanitizeEmail(user.email),
      };
      logger.debug('body', body);
      logger.debug(`body for generating token: ${JSON.stringify(body)}`);
      logger.debug(`AUTH_SECRET: ${config.AUTH_SECRET.substring(-5)}`);
      const token = jwt.sign(body, config.AUTH_SECRET, { noTimestamp: true }).split('.')[2];
      logger.debug(`token: ${token}`);

      const replyTo = `${config.REPLY_EMAIL_PREFIX}+${topicId}/${token}@${config.REPLY_EMAIL_DOMAIN}`;

      const eventMessage = {
        data: {
          name: user.firstName + ' ' + user.lastName,
          handle: user.handle,
          topicTitle: connectTopic.title || '',
          post: helpers.markdownToHTML(messageJSON.postContent),
          date: (new Date()).toISOString(),
          projectName: notification.contents.projectName,
          projectId: messageJSON.projectId,
          topicId,
          postId,
          authorHandle: notification.contents.userHandle,
        },
        recipients,
        replyTo,
        cc,
        from: {
          name: notification.contents.userHandle,
          email: config.REPLY_EMAIL_FROM,
        },
        categories,
      };

      // if notifications has to be bundled
      const bundlePeriod = settings.services[SETTINGS_EMAIL_SERVICE_ID]
        && settings.services[SETTINGS_EMAIL_SERVICE_ID].bundlePeriod;

      if (bundlePeriod) {
        if (!SCHEDULED_EVENT_PERIOD[bundlePeriod]) {
          throw new Error(`User's '${notification.userId}' setting for service`
            + ` '${SETTINGS_EMAIL_SERVICE_ID}' option 'bundlePeriod' has unsupported value '${bundlePeriod}'.`);
        }

        // schedule event to be send later
        scheduler.addEvent({
          data: eventMessage,
          period: bundlePeriod,
          userId: notification.userId,
          eventType,
          reference: 'topic',
          referenceId: topicId,
        });
      } else {
        // send event to bus api
        return busService.postEvent({
          topic: eventType,
          originator: 'tc-notifications',
          timestamp: (new Date()).toISOString(),
          'mime-type': 'application/json',
          payload: eventMessage,
        }).then(() => {
          logger.info(`Successfully sent ${eventType} event with body ${JSON.stringify(eventMessage)} to bus api`);
        });
      }
    });
  }

  // if no need to send emails, return resolved promise for consistency
  return Promise.resolve();
}

module.exports = {
  handler,
};
