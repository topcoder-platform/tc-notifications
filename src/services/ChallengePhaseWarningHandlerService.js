/**
 * Challenge phase warning handler service.
 */

'use strict';

const _ = require('lodash');
const joi = require('joi');
const logger = require('../common/logger');
const tcApiHelper = require('../common/tcApiHelper');

/**
 * Handle challenge phase warning message
 * @param {Object} message the Kafka message
 * @returns {Array} the notifications
 */
function* handle(message) {
  // get challenge details
  const challenge = yield tcApiHelper.getChallenge(message.payload.challengeId);
  // get registrants handles
  const handles = _.map(challenge.registrants || [], (r) => r.handle);
  // get users by handles
  const users = yield tcApiHelper.getUsersByHandles(handles);
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
      phase: joi.string().required(),
      remainingTime: joi.number(),
      userId: joi.number().integer().min(1),
      initiatorUserId: joi.number().integer().min(1),
    }).unknown(true).required(),
  }).required(),
};

// Exports
module.exports = {
  handle,
};

logger.buildService(module.exports);
