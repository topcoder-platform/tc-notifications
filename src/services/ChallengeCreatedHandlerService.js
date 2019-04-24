/**
 * Challenge created handler service.
 */

'use strict';

const joi = require('joi');
const logger = require('../common/logger');
const tcApiHelper = require('../common/tcApiHelper');

/**
 * Handle challenge created message
 * @param {Object} message the Kafka message
 * @returns {Array} the notifications
 */
function* handle(message) {
  // get users by skills
  const users = yield tcApiHelper.getUsersBySkills(message.payload.skills);
  // notify users of message
  return yield tcApiHelper.notifyUsersOfMessage(users, message);
}

handle.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      challengeId: joi.number().integer().min(1).required(),
      challengeTitle: joi.string().required(),
      challengeUrl: joi.string().uri().required(),
      userId: joi.number().integer().min(1),
      initiatorUserId: joi.number().integer().min(1),
      skills: joi.array().items(joi.string()),
    }).unknown(true).required(),
  }).required(),
};

// Exports
module.exports = {
  handle,
};

logger.buildService(module.exports);
