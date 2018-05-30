/**
 * This is entry point of the TopCoder notification server module.
 */
'use strict';

const config = require('config');
const _ = require('lodash');
const errors = require('./src/common/errors');
// some useful components to exposure
const logger = require('./src/common/logger');
const busService = require('./src/services/BusAPI');
const eventScheduler = require('./src/services/EventScheduler');
const notificationService = require('./src/services/NotificationService');

// key is topic name, e.g. 'notifications.connect.project.created';
// value is handler for the topic to find user ids that should receive notifications for a message,
// it is defined as: function(topic, message, callback),
// the topic is topic name,
// the message is JSON event message,
// the callback is function(error, userIds), where userIds is an array of user ids to receive notifications
const handlers = {};

/**
 * List of notification service handlers which will process notifications
 *
 * Each item is the function of the next signature
 * function(topicName, messageJSON, notification)
 * - {String} topicName    topic name (event type)
 * - {Object} messageJSON  message raw JSON
 * - {Object} notification pre-processed notification object
 */
const notificationServiceHandlers = [];

/**
 * Set configuration, the default config will be overridden by the given config,
 * unspecified config parameters will not be changed, i.e. still using default values.
 *
 * Note that setConfig should be called before the initDatabase and start functions.
 *
 * @param {Object} cfg the configuration to set
 */
function setConfig(cfg) {
  if (!cfg) {
    throw new errors.ValidationError('Missing configuration.');
  }
  _.extend(config, cfg);
}

/**
 * Add topic handler for topic, override existing one if any.
 * @param {String} topic the topic name
 * @param {Function} handler the handler
 */
function addTopicHandler(topic, handler) {
  if (!topic) {
    throw new errors.ValidationError('Missing topic.');
  }
  if (!handler) {
    throw new errors.ValidationError('Missing handler.');
  }
  handlers[topic] = handler;
}

/**
 * Adds notification service handler
 *
 * @param {Function} handler notification service handler
 */
function addNotificationServiceHandler(handler) {
  if (!handler) {
    throw new errors.ValidationError('Missing notification service handler.');
  }
  notificationServiceHandlers.push(handler);
}

/**
 * Remove topic handler for topic.
 * @param {String} topic the topic name
 */
function removeTopicHandler(topic) {
  if (!topic) {
    throw new errors.ValidationError('Missing topic.');
  }
  delete handlers[topic];
}

/**
 * Get all topic handlers.
 * @returns {Object} all topic handlers, key is topic name, value is handler
 */
function getAllHandlers() {
  return handlers;
}

/**
 * Start the notification server.
 */
function start() {
  if (_.isEmpty(handlers)) {
    throw new errors.ValidationError('Missing handler(s).');
  }
  // load app only after config is set
  const app = require('./src/app');
  app.start(handlers, notificationServiceHandlers);
}

/**
 * Initialize database. All tables are cleared and re-created.
 * @returns {Promise} promise to init db
 */
function initDatabase() {
  // load models only after config is set
  const models = require('./src/models');
  return models.init(true);
}

// Exports
module.exports = {
  setConfig,
  addTopicHandler,
  removeTopicHandler,
  getAllHandlers,
  start,
  initDatabase,
  addNotificationServiceHandler,

  // exposure some useful components
  logger,
  busService,
  eventScheduler,
  notificationService,
};
