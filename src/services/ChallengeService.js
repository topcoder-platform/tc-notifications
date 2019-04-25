/**
 * Challenge general handler service.
 */

'use strict';

const joi = require('joi');
const _ = require('lodash')
const logger = require('../common/logger');
const tcApiHelper = require('../common/tcApiHelper');

/**
 * Handle challenge message
 * @param {Object} message the Kafka message
 * @param {Object} ruleSets 
 * @returns {Array} the notifications
 */
function* handle(message, ruleSets) {

  if (message.payload.type === _.get(ruleSets, "type")) {
    const challengeId = message.payload.data.id
    const usersInfo = yield tcApiHelper.getUsersInfoFromChallenge(challengeId)
    const filerOnRoles = _.get(ruleSets, "roles")
    const users = tcApiHelper.filterChallengeUsers(usersInfo, filerOnRoles)
    logger.info(`Successfully filetered ${users.length} users on rulesets ${JSON.stringify(filerOnRoles)} `)
    // notify users of message
    return yield tcApiHelper.notifyUsersOfMessage(users, message);
  }
  return {}
}

handle.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      type: joi.string().required(),
      userId: joi.number().integer().min(1)
    }).unknown(true).required(),
  }).required(),
  ruleSets: joi.object()
}

// Exports
module.exports = {
  handle,
}

logger.buildService(module.exports);
