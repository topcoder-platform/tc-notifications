/**
 * Dummy handler returns basic notification.
 */
const co = require('co');

/**
 * Handle Kafka JSON message of challenge created.
 *
 * @param {Object} message the Kafka JSON message
 * @param {Object} ruleSets
 *
 * @return {Promise} promise resolved to notifications
 */
const handle = (message) => co(function* () {
  return [{ userId: message.payload.initiatorUserId || 123, notification: message }];
});

module.exports = {
  handle,
};
