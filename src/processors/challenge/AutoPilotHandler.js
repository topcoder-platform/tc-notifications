/**
 * Challenge Autopilot general handler.
 */
const co = require('co');
const service = require('../../services/AutoPilotService');

/**
 * Handle Kafka JSON message of autopilot.
 *
 * @param {Object} message the Kafka JSON message
 * @param {Object} ruleSets
 *
 * @return {Promise} promise resolved to notifications
 */
const handle = (message, ruleSets) => co(function* () {
  return yield service.handle(message, ruleSets);
});

module.exports = {
  handle,
};
