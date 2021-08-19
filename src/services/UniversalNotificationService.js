/**
 * Universal notification handler service.
 */

'use strict';
const _ = require('lodash');
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
        userId: joi.number().integer(),
        userUUID: joi.string().uuid(),
        email: joi.string().email(),
        handle: joi.string(),
      }).min(1).required()
    ).min(1).required(),
    cc: joi.array().items(
      joi.object().keys({
        userId: joi.number().integer(),
        userUUID: joi.string().uuid(),
        email: joi.string().email(),
        handle: joi.string(),
      }).min(1)
    ),
    data: joi.object().keys({
      subject: joi.string().allow(''),
      body: joi.string().allow(''),
      // any other fields are allowed inside `data` too
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
    blocks: joi.array().items(joi.object()),
  }).required(),
}).required();

const webSchema = joi.object().keys({
  serviceId: joi.string().valid(constants.SETTINGS_WEB_SERVICE_ID).required(),
  type: joi.string().required(),
  details: joi.object().keys({
    recipients: joi.array().items(
      joi.object().keys({
        userId: joi.number().integer(),
        userUUID: joi.string().uuid(),
        email: joi.string().email(),
        handle: joi.string(),
      }).min(1).required()
    ).min(1).required(),
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
 * Complete missing user fields of given payload details
 * This function mutates the given details object.
 * @param {Object} details the object which has recipients array
 * @param {Boolean} findEmail true if emails are needed
 * @param {Boolean} findUserId true if userIds are needed
 * @returns {undefined}
 */
function* completeMissingFields(details, findEmail, findUserId) {
  const getFieldsByUserId = [];
  const getFieldsByHandle = [];
  const getFieldsByUserUUID = [];
  const getFieldsByEmail = [];
  function findMissingFields(data, email, userId) {
    for (const recipient of data) {
      if (_.isUndefined(recipient.email) && email) {
        if (!_.isUndefined(recipient.userId)) {
          getFieldsByUserId.push(recipient);
        } else if (!_.isUndefined(recipient.handle)) {
          getFieldsByHandle.push(recipient);
        } else {
          getFieldsByUserUUID.push(recipient);
        }
      } else if (_.isUndefined(recipient.userId) && userId) {
        if (!_.isUndefined(recipient.handle)) {
          getFieldsByHandle.push(recipient);
        } else if (!_.isUndefined(recipient.email)) {
          getFieldsByEmail.push(recipient);
        } else {
          getFieldsByUserUUID.push(recipient);
        }
      }
    }
  }

  findMissingFields(details.recipients, findEmail, findUserId);
  if (_.isArray(details.cc) && !_.isEmpty(details.cc)) {
    findMissingFields(details.cc, findEmail, false);
  }
  const foundUsersByHandleOrId = yield tcApiHelper.getUsersByHandlesAndUserIds(getFieldsByHandle, getFieldsByUserId);
  if (!_.isEmpty(foundUsersByHandleOrId)) {
    for (const user of [...getFieldsByUserId, ...getFieldsByHandle]) {
      const found = _.find(foundUsersByHandleOrId, !_.isUndefined(user.handle)
        ? ['handle', user.handle] : ['userId', user.userId]) || {};
      if (!_.isUndefined(found.email) && _.isUndefined(user.email)) {
        _.assign(user, { email: found.email });
      }
      if (!_.isUndefined(found.userId) && _.isUndefined(user.userId)) {
        _.assign(user, { userId: found.userId });
      }
    }
  }
  const foundUsersByEmail = yield tcApiHelper.getUsersByEmails(getFieldsByEmail);
  if (!_.isEmpty(foundUsersByEmail)) {
    for (const user of getFieldsByEmail) {
      const found = _.find(foundUsersByEmail, ['email', user.email]) || {};
      if (!_.isUndefined(found.id)) {
        _.assign(user, { userId: found.id });
      }
    }
  }
  const foundUsersByUUID = yield tcApiHelper.getUsersByUserUUIDs(getFieldsByUserUUID, true);
  if (!_.isEmpty(foundUsersByUUID)) {
    for (const user of getFieldsByUserUUID) {
      const found = _.find(foundUsersByUUID, ['id', user.userUUID]) || {};
      if (!_.isUndefined(found.externalProfiles) && !_.isEmpty(found.externalProfiles)) {
        _.assign(user, { userId: _.toInteger(_.get(found.externalProfiles[0], 'externalId')) });
      }
      if (!_.isUndefined(found.handle) && _.isUndefined(user.handle)) {
        _.assign(user, { handle: found.handle });
      }
    }

    if (findEmail) {
      const usersHaveId = _.filter(getFieldsByUserUUID, u => !_.isUndefined(u.userId));
      const usersHaveHandle = _.filter(getFieldsByUserUUID, u => _.isUndefined(u.userId) && !_.isUndefined(u.handle));
      const foundUser = yield tcApiHelper.getUsersByHandlesAndUserIds(usersHaveHandle, usersHaveId);
      if (!_.isEmpty(foundUser)) {
        for (const user of getFieldsByUserUUID) {
          const found = _.find(foundUser, !_.isUndefined(user.handle)
            ? ['handle', user.handle] : ['userId', user.userId]) || {};
          if (!_.isUndefined(found.email)) {
            _.assign(user, { email: found.email });
          }
        }
      }
    }
  }
}

/**
 * Handle notification message
 * @param {Object} message the Kafka message
 * @returns {Array} the notifications
 */
function* handle(message) {
  const notifications = [];
  for (const data of message.payload.notifications) {
    try {
      switch (data.serviceId) {
        case constants.SETTINGS_EMAIL_SERVICE_ID:
          if (validator(data, emailSchema)) {
            // find missing emails and userIds
            // temporary disable email notification on PROD until we get good working for email templates
            // yield completeMissingFields(data.details, true, true);
            // yield tcApiHelper.notifyUserViaEmail(data);
          }
          break;
        case constants.SETTINGS_SLACK_SERVICE_ID:
          if (validator(data, slackSchema)) {
            yield tcApiHelper.notifySlackChannel(data.details.channel, data.details.text, data.details.blocks);
          }
          break;
        case constants.SETTINGS_WEB_SERVICE_ID:
          if (validator(data, webSchema)) {
            // find missing userIds
            yield completeMissingFields(data.details, false, true);
            const _notifications = yield tcApiHelper.notifyUserViaWeb(data);
            if (_notifications) {
              notifications.push(..._notifications);
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
    payload: joi.object().keys({
      notifications: joi.array().items(
        joi.object().keys({
          serviceId: joi.string().valid(
            constants.SETTINGS_EMAIL_SERVICE_ID,
            constants.SETTINGS_SLACK_SERVICE_ID,
            constants.SETTINGS_WEB_SERVICE_ID).required(),
        }).unknown()
      ).min(1).required(),
    }).required(),
  }).required(),
};

// Exports
module.exports = {
  handle,
};

logger.buildService(module.exports);
