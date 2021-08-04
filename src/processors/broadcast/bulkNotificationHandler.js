/**
 * Bulk notification handler.
 */
const joi = require('joi');
const co = require('co');
const models = require('../../models');
const logger = require('../../common/logger');

/**
 * Handle Kafka JSON message of broadcast.
 *
 * @param {Object} message the Kafka JSON message
 * @param {Object} ruleSets
 *
 * @return {Promise} promise resolved to notifications
 */
// eslint-disable-next-line no-unused-vars
const handle = (message, ruleSets) => co(function* () {
  try {
    const bm = yield models.BulkMessages.create({
      type: message.topic,
      message: message.payload.message,
      recipients: message.payload.recipients,
    });
    logger.info('Broadcast message recieved and inserted in db with id:', bm.id);
  } catch (e) {
    logger.error(`Broadcast processor failed in db operation. Error: ${e}`);
  }
  return []; // this point of time, send empty notification object
});

/**
 * validate kafka payload
 */
handle.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      message: joi.string().required(),
      recipients: joi.object().required(),
    }),
  }).required(),
  ruleSets: joi.object(),
};

module.exports = {
  handle,
};

logger.buildService(module.exports);
