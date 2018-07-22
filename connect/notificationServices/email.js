/**
 * Email notification service
 */
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const co = require('co');
const {
  logger, busService, eventScheduler, notificationService,
} = require('../../index');

const { createEventScheduler, SCHEDULED_EVENT_STATUS } = eventScheduler;

const config = require('../config');
const { BUS_API_EVENT, SCHEDULED_EVENT_PERIOD, SETTINGS_EMAIL_SERVICE_ID } = require('../constants');
const { EVENT_BUNDLES } = require('../events-config');
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
      name: config.REPLY_EMAIL_FROM,
      email: config.DEFAULT_REPLY_EMAIL,
    };

    // TODO: consider using templating engine to format the bundle email
    // until there is Sendgrid support for loops in email templates
    let emailBody = '<h3>Your recent updates on Topcoder Connect</h3>';
    const eventsByTopics = _.groupBy(userEvents, 'data.data.topicId');
    emailBody += '<ul>';
    _.values(eventsByTopics).forEach((topicEvents) => {
      emailBody += '<li>';
      emailBody += `<a href="http://connect.topcoder.com/projects/${topicEvents[0].data.data.projectId}#feed-`
        + `${topicEvents[0].data.data.topicId}"> ${topicEvents[0].data.data.topicTitle} </a>`;
      emailBody += `<span style="color:#777777"> - ${topicEvents.length} updates</span>`;
      emailBody += '</li>';
    });
    emailBody += '</ul>';

    // data property we define as an array of data from each individual event
    eventMessage.data = { notificationsHTML: emailBody };

    busService.postEvent({
      topic: BUS_API_EVENT.EMAIL.GENERAL,
      originator: 'tc-notifications',
      timestamp: (new Date()).toISOString(),
      'mime-type': 'application/json',
      payload: eventMessage,
    }).then(() => {
      logger.info(`Successfully sent ${BUS_API_EVENT.EMAIL.GENERAL} event`
        + ` with body ${JSON.stringify(eventMessage)} to bus api`);

      setEventsStatus(userEvents, SCHEDULED_EVENT_STATUS.COMPLETED);
    }).catch(() => {
      logger.error(`Failed to send ${BUS_API_EVENT.EMAIL.GENERAL} event`
        + ` with body ${JSON.stringify(eventMessage)} to bus api`);

      setEventsStatus(userEvents, SCHEDULED_EVENT_STATUS.FAILED);
    });
  });
}

// create and initialize scheduler
const scheduler = createEventScheduler(
  BUS_API_EVENT.EMAIL.BUNDLED,
  SCHEDULED_EVENT_PERIOD,
  handleScheduledEvents,
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
  const eventType = BUS_API_EVENT.EMAIL.GENERAL;

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

    // TODO: use this to pass data to local templates
    const templateData = {};

    const users = yield service.getUsersById([notification.userId]);
    logger.debug(`got users ${JSON.stringify(users)}`);

    const user = users[0];
    let userEmail = user.email;
    if (config.ENABLE_DEV_MODE === 'true') {
      userEmail = config.DEV_MODE_EMAIL;
    }
    const recipients = [userEmail];

    const categories = [`${config.ENV}:${eventType}`.toLowerCase()];

    const eventMessage = {
      data: {
        name: user.firstName + ' ' + user.lastName,
        handle: user.handle,
        post: helpers.markdownToHTML(messageJSON.postContent),
        date: (new Date()).toISOString(),
        projectName: notification.contents.projectName,
        projectId: messageJSON.projectId,
        authorHandle: notification.contents.userHandle,
      },
      recipients,
      from: {
        name: notification.contents.userHandle,
        email: config.DEFAULT_REPLY_EMAIL,
      },
      categories,
    };

    let reference;
    let referenceId;

    if (_.includes(EVENT_BUNDLES.TOPICS_AND_POSTS.types, notificationType)) {
      templateData.topicId = parseInt(messageJSON.topicId, 10);
      templateData.postId = messageJSON.postId ? parseInt(messageJSON.postId, 10) : null;

      eventMessage.data.topicId = templateData.topicId;
      eventMessage.data.postId = templateData.postId;

      reference = 'topic';
      referenceId = templateData.topicId;

      const connectTopic = yield service.getTopic(templateData.topicId, logger);
      logger.debug(`got topic ${JSON.stringify(connectTopic)}`);

      eventMessage.data.topicTitle = connectTopic.title || '';

      if (notificationType === BUS_API_EVENT.CONNECT.POST.MENTION) {
        eventMessage.cc = [config.MENTION_EMAIL];
      }

      // get jwt token then encode it with base64
      const body = {
        userId: parseInt(notification.userId, 10),
        topicId: templateData.topicId,
        userEmail: helpers.sanitizeEmail(user.email),
      };
      logger.debug('body', body);
      logger.debug(`body for generating token: ${JSON.stringify(body)}`);
      logger.debug(`AUTH_SECRET: ${config.AUTH_SECRET.substring(-5)}`);
      const token = jwt.sign(body, config.AUTH_SECRET, { noTimestamp: true }).split('.')[2];
      logger.debug(`token: ${token}`);

      eventMessage.replyTo = `${config.REPLY_EMAIL_PREFIX}+${templateData.topicId}/${token}@`
        + config.REPLY_EMAIL_DOMAIN;
    }

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
        reference,
        referenceId,
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

module.exports = {
  handler,
};
