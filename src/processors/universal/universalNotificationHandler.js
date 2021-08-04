/**
 * Universal notification handler.
 */
 const co = require('co');
 const service = require('../../services/UniversalNotificationService');

 /**
  * Handle Kafka JSON message of notifications requested.
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
