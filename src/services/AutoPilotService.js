/**
 * Autopilot general handler service.
 */

'use strict';

const joi = require('joi');
const _ = require('lodash');
const logger = require('../common/logger');
const tcApiHelper = require('../common/tcApiHelper');

/**
 * Handle autopilot message
 * @param {Object} message the Kafka message
 * @param {Object} ruleSets
 * @returns {Array} the notifications
 */
function* handle(message, ruleSets) {
  if ((message.payload.phaseTypeName === _.get(ruleSets, 'phaseTypeName'))
    && (message.payload.state === _.get(ruleSets, 'state'))) {
    const challengeId = message.payload.projectId;
    const filerOnRoles = _.get(ruleSets, 'roles');

    const notification = yield tcApiHelper.modifyNotificationNode(ruleSets, { id: challengeId });
    const usersInfo = yield tcApiHelper.getUsersInfoFromChallenge(challengeId);
    const users = tcApiHelper.filterChallengeUsers(usersInfo, filerOnRoles);

    logger.info(`Successfully filetered ${users.length} users on rulesets ${JSON.stringify(filerOnRoles)} `);
    // notify users of message
    return yield tcApiHelper.notifyUsersOfMessage(users, notification);
  }
  return {};
}

handle.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      phaseTypeName: joi.string().required(),
      state: joi.string().required(),
      projectId: joi.number().integer().min(1),
    }).unknown(true).required(),
  }).required(),
  ruleSets: joi.object(),
};

// Exports
module.exports = {
  handle,
};

logger.buildService(module.exports);
