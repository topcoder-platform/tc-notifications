/**
 * Bulk notification handler.
 */
const co = require('co');
const models = require('../../models');
const logger = require('../../common/logger')

/**
 * Handle Kafka JSON message of broadcast.
 *
 * @param {Object} message the Kafka JSON message
 * @param {Object} ruleSets
 *
 * @return {Promise} promise resolved to notifications
 */
const handle = (message, ruleSets) => co(function* () {
  return new Promise(function(resolve, reject){
     models.BulkMessages.create({
          type: message.topic,
          message: message.payload.message,
          recipients: message.payload.recipients,
          rules: message.payload.rules || null,
      }).then((bm) => {
        logger.info("Broadcast message recieved and inserted in db with id:", bm.id)
        resolve([]) // no notification need to insert at this point 
     }).catch((e) => {
         logger.error("Broadcast processor failed in db operation. Error: ", e)
         reject(e)
     }) 
  })
});

module.exports = {
  handle,
};