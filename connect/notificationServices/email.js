/**
 * Email notification service
 */
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const co = require('co');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const {
  logger, busService, eventScheduler, notificationService,
} = require('../../index');

const { createEventScheduler, SCHEDULED_EVENT_STATUS } = eventScheduler;

const config = require('../config');
const { BUS_API_EVENT, SCHEDULED_EVENT_PERIOD, SETTINGS_EMAIL_SERVICE_ID } = require('../constants');
const { EVENTS, EVENT_BUNDLES } = require('../events-config');
const helpers = require('../helpers');
const service = require('../service');

// compile all partials and register them
EVENTS.forEach(event => handlebars.registerPartial(
  event.type,
  handlebars.compile(fs.readFileSync(path.join(process.cwd(), 'dist', 'emails', 'partials', event.template), 'utf8'))
));

// template used for all notification types (whether bundled or individual)
const template = handlebars.compile(
  fs.readFileSync(path.join(process.cwd(), 'dist', 'emails', 'template.html'), 'utf8')
);

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
    const bundleData = {
      projects: _.chain(userEvents)
        .groupBy('data.data.projectId')
        .mapValues(projectUserEvents => ({
          id: _.get(projectUserEvents, '[0].data.data.projectId'),
          name: _.get(projectUserEvents, '[0].data.data.projectName'),
          sections: _.chain(projectUserEvents)
            .groupBy(value => _.chain(EVENT_BUNDLES)
              .keys()
              .filter(key => _.includes(_.get(EVENT_BUNDLES, `${key}.types`), _.get(value, 'data.data.type')))
              .map(key => _.get(EVENT_BUNDLES, `${key}.title`))
              .first()
              .value())
            .mapValues((groupedEvents, key) => ({
              title: key,
              notifications: _.map(groupedEvents, 'data.data'),
            }))
            .values()
            .value(),
        }))
        .values()
        .value(),
    };

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

    eventMessage.data = { notificationsHTML: template(bundleData) };

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
 * Prepares data to be provided to the template to render a single notification.
 *
 * @param {Object} data the notification data
 * @returns {Object}
 */
function wrapIndividualNotification(data) {
  return {
    projects: {
      id: data.projectId,
      name: data.projectName,
      sections: {
        notifications: data,
      },
    },
  };
}

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
        date: (new Date()).toISOString(),
        projectName: notification.contents.projectName,
        projectId: messageJSON.projectId,
        authorHandle: notification.contents.userHandle,
        authorFullName: notification.contents.userFullName,
        type: notificationType,
      },
      recipients,
      from: {
        name: notification.contents.userHandle,
        email: config.DEFAULT_REPLY_EMAIL,
      },
      categories,
    };

    // default values that get overridden when the notification is about topics/posts updates
    let reference = 'project';
    let referenceId = eventMessage.data.projectId;

    if (_.includes(EVENT_BUNDLES.TOPICS_AND_POSTS.types, notificationType)) {
      eventMessage.data.topicId = parseInt(messageJSON.topicId, 10);
      eventMessage.data.postId = messageJSON.postId ? parseInt(messageJSON.postId, 10) : null;
      eventMessage.data.post = helpers.markdownToHTML(messageJSON.postContent);

      reference = 'topic';
      referenceId = eventMessage.data.topicId;

      const connectTopic = yield service.getTopic(eventMessage.data.topicId, logger);
      logger.debug(`got topic ${JSON.stringify(connectTopic)}`);

      eventMessage.data.topicTitle = connectTopic.title || '';

      if (notificationType === BUS_API_EVENT.CONNECT.POST.MENTION) {
        eventMessage.cc = [config.MENTION_EMAIL];
      }

      // get jwt token then encode it with base64
      const body = {
        userId: parseInt(notification.userId, 10),
        topicId: eventMessage.data.topicId,
        userEmail: helpers.sanitizeEmail(user.email),
      };
      logger.debug('body', body);
      logger.debug(`body for generating token: ${JSON.stringify(body)}`);
      logger.debug(`AUTH_SECRET: ${config.AUTH_SECRET.substring(-5)}`);
      const token = jwt.sign(body, config.AUTH_SECRET, { noTimestamp: true }).split('.')[2];
      logger.debug(`token: ${token}`);

      eventMessage.replyTo = `${config.REPLY_EMAIL_PREFIX}+${eventMessage.data.topicId}/${token}@`
        + config.REPLY_EMAIL_DOMAIN;
    }

    if (messageJSON.fileName) {
      eventMessage.data.fileName = messageJSON.fileName;
    }

    // if notifications has to be bundled
    const bundlePeriod = settings.services[SETTINGS_EMAIL_SERVICE_ID]
      && settings.services[SETTINGS_EMAIL_SERVICE_ID].bundlePeriod;

    if (bundlePeriod) {
      if (!SCHEDULED_EVENT_PERIOD[bundlePeriod]) {
        throw new Error(`User's '${notification.userId}' setting for service`
          + ` '${SETTINGS_EMAIL_SERVICE_ID}' option 'bundlePeriod' has unsupported value '${bundlePeriod}'.`);
      }

      // schedule event to be sent later
      scheduler.addEvent({
        data: eventMessage,
        period: bundlePeriod,
        userId: notification.userId,
        eventType,
        reference,
        referenceId,
      });
    } else {
      // send single field "notificationsHTML" with the rendered template
      eventMessage.data = { notificationsHTML: template(wrapIndividualNotification(eventMessage.data)) };

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
