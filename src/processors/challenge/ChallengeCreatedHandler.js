/**
 * Challenge created handler.
 */
const co = require('co');
const service = require('../../services/ChallengeCreatedHandlerService');

/**
 * Handle Kafka JSON message of challenge created.
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
