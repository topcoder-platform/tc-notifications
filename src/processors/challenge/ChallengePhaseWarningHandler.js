/**
 * Challenge phase warning handler.
 */
const co = require('co');
const service = require('../../services/ChallengePhaseWarningHandlerService');

/**
 * Handle Kafka JSON message of challenge phase warning.
 *
 * @param {Object} message the Kafka JSON message
 *
 * @return {Promise} promise resolved to notifications
 */
const handle = (message) => co(function* () {
  return yield service.handle(message);
});

module.exports = {
  handle,
};
