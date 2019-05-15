/**
 * Submission general handler service.
 */

'use strict';

const joi = require('joi');
const _ = require('lodash');
const logger = require('../common/logger');
const tcApiHelper = require('../common/tcApiHelper');

/**
 * Handle submission message
 * @param {Object} message the Kafka message
 * @param {Object} ruleSets
 * @returns {Array} the notifications
 */
function* handle(message, ruleSets) {
  if (message.payload.resource === _.get(ruleSets, 'resource')) {
    const challengeId = message.payload.challengeId;
    const filterOnRoles = _.get(ruleSets, 'roles');

    const filterOnUsers = [];
    if (_.get(ruleSets, 'selfOnly')) {
      const memberId = _.get(message.payload, 'memberId');
      filterOnUsers.push(memberId);
    }

    const usersInfo = yield tcApiHelper.getUsersInfoFromChallenge(challengeId);
    const users = tcApiHelper.filterChallengeUsers(usersInfo, filterOnRoles, filterOnUsers);
    const notification = yield tcApiHelper.modifyNotificationNode(ruleSets, { id: challengeId });
    logger.info(`Successfully filetered ${users.length} users on rulesets ${JSON.stringify(filterOnRoles)} `);
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
      resource: joi.string().required(),
    }).unknown(true).required(),
  }).required(),
  ruleSets: joi.object(),
};

// Exports
module.exports = {
  handle,
};

logger.buildService(module.exports);
