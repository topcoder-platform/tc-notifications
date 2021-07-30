/**
 * Universal notification handler service.
 */

'use strict';

const joi = require('joi');
const logger = require('../common/logger');
const tcApiHelper = require('../common/tcApiHelper');
const constants = require('../../constants');

const emailSchema = joi.object().keys({
  serviceId: joi.string().valid(constants.SETTINGS_EMAIL_SERVICE_ID).required(),
  type: joi.string().required(),
  details: joi.object().keys({
    from: joi.string().email().required(),
    recipients: joi.array().items(
      joi.object().keys({
        userId: joi.number().integer().required(),
        email: joi.string().email().required(),
      }).required()
    ).min(1).required(),
    cc: joi.array().items(
      joi.object().keys({
        userId: joi.number().integer(),
        email: joi.string().email().required(),
      }).required()
    ),
    data: joi.object().keys({
      subject: joi.string(),
      body: joi.string(),
    }).unknown(),
    sendgridTemplateId: joi.string().required(),
    version: joi.string().required(),
  }).required(),
}).required();

const slackSchema = joi.object().keys({
  serviceId: joi.string().valid(constants.SETTINGS_SLACK_SERVICE_ID).required(),
  type: joi.string().required(),
  details: joi.object().keys({
    channel: joi.string().required(),
    text: joi.string().required(),
  }).required(),
}).required();

const webSchema = joi.object().keys({
  serviceId: joi.string().valid(constants.SETTINGS_WEB_SERVICE_ID).required(),
  type: joi.string().required(),
  details: joi.object().keys({
    userId: joi.number().integer().required(),
    contents: joi.object(),
    version: joi.number().integer().required(),
  }).required(),
}).required();

function validator(data, schema) {
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    logger.error(validationResult.error.message);
    return false;
  }
  return true;
}

/**
 * Handle notification message
 * @param {Object} message the Kafka message
 * @returns {Array} the notifications
 */
function* handle(message) {
  const notifications = [];
  for (const data of message.payload) {
    try {
      switch (data.serviceId) {
        case constants.SETTINGS_EMAIL_SERVICE_ID:
          if (validator(data, emailSchema)) {
            yield tcApiHelper.notifyUserViaEmail(data);
          }
          break;
        case constants.SETTINGS_SLACK_SERVICE_ID:
          if (validator(data, slackSchema)) {
            yield tcApiHelper.notifySlackChannel(data.details.channel, data.details.text);
          }
          break;
        case constants.SETTINGS_WEB_SERVICE_ID:
          if (validator(data, webSchema)) {
            const notification = yield tcApiHelper.notifyUserViaWeb(data);
            if (notification) {
              notifications.push(notification);
            }
          }
          break;
        default:
          break;
      }
    } catch (err) {
      logger.logFullError(err);
    }
  }
  return notifications;
}

handle.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.array().items(
      joi.object().keys({
        serviceId: joi.string().valid(
          constants.SETTINGS_EMAIL_SERVICE_ID,
          constants.SETTINGS_SLACK_SERVICE_ID,
          constants.SETTINGS_WEB_SERVICE_ID).required(),
      }).unknown()
    ).min(1).required(),
  }).required(),
};

// Exports
module.exports = {
  handle,
};

logger.buildService(module.exports);
