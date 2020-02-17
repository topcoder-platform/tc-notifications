/**
 * Hook to insert broadcast notification into database for a user.
 */

'use strict'

const _ = require('lodash')
//const Joi = require('joi')
//const errors = require('../common/errors')
const logger = require('../common/logger')
const models = require('../models')
const logPrefix = "BulkNotificationHook: "

/**
 * CREATE NEW TABLES IF NOT EXISTS
 */
models.BulkMessages.sync().then((t)=> {
    models.BulkMessageUserRefs.sync()
})

/**
 * Main function 
 * @param {Integer} userId 
 */
function checkBulkMessageForUser(userId) {
    models.BulkMessages.count().then(function (tBulkMessages) {
        if (tBulkMessages > 0) {
            // the condition can help to optimize the execution 
            models.BulkMessageUserRefs.count({
                where: {
                    user_id: userId
                }
            }).then(function (tUserRefs) {
                if (tUserRefs < tBulkMessages) {
                    logger.info(`${logPrefix} Need to sync broadcast message for current user ${userId}`)
                    syncBulkMessageForUser(userId)
                }
            }).catch((e) => {
                logger.error(`${logPrefix} Failed to check total userRefs condition. Error: `, e)
            })
        }
    }).catch((e) => {
        logger.error(`${logPrefix} Failed to check total broadcast message condition. Error: `, e)
    })
}

/**
 * Helper function 
 * @param {Integer} userId 
 */
function syncBulkMessageForUser(userId) {

    /**
     * Check if all bulk mesaages processed for current user or not 
     */
    let q = "SELECT a.* FROM bulk_messages AS a " +
        " LEFT OUTER JOIN (SELECT id as refid, bulk_message_id " +
        " FROM bulk_message_user_refs AS bmur WHERE bmur.user_id=$1)" +
        " AS b ON a.id=b.bulk_message_id WHERE b.refid IS NULL"
    models.sequelize.query(q, { bind: [userId] })
        .then(function (res) {
            _.map(res[0], async (r) => {
                logger.info(`${logPrefix} need to process for bulk message id: `, r.id)
                // call function to check if current user in reciepent group
                // insert row in userRef table 
                if (isBroadCastMessageForUser(userId, r)) {
                    // current user in reciepent group
                    createNotificationForUser(userId, r)
                } else {
                    /**
                     * Insert row in userRef with notification-id null value 
                     * It means - broadcast message in not for current user
                     */
                    insertUserRefs(userId, r.id, null)
                }
            })
        }).catch((e) => {
            logger.error(`${logPrefix} Failed to check bulk message condition: `, err)
        })
}

/**
 * Helper function 
 * Check if current user in broadcast recipent group 
 * @param {Integer} userId 
 * @param {Object} bulkMessage 
 */
function isBroadCastMessageForUser(userId, bulkMessage) {
    // TODO  
    return true;
}

/**
 * Helper function 
 * @param {Integer} userId 
 * @param {Integer} bulkMessageId 
 * @param {Integer} notificationId 
 */
function insertUserRefs(userId, bulkMessageId, notificationId) {
    models.BulkMessageUserRefs.create({
        bulk_message_id: bulkMessageId,
        user_id: userId,
        notification_id: notificationId,
    }).then((b) => {
        logger.info(`${logPrefix} Inserted userRef record ${b.id} for current user ${userId}`)
    }).catch((e) => {
        logger.error(`${logPrefix} Failed to insert userRef record for user: ${userId}, error: `, e)
    })
}

/**
 * Helper function 
 * @param {Integer} userId 
 * @param {Object} bulkMessage 
 */
function createNotificationForUser(userId, bulkMessage) {
    models.Notification.create({
        userId: userId,
        type: bulkMessage.type,
        contents: {
            id: bulkMessage.id, /** broadcast message id  */
            message: bulkMessage.message, /** broadcast message */
            group: 'broadcast',
            title: 'Broadcast Message',
        },
        read: false,
        seen: false,
        version: null,
    }).then((n) => {
        logger.info(`${logPrefix} Inserted notification record ${n.id} for current user ${userId}`)
        insertUserRefs(userId, bulkMessage.id, n.id)
    }).catch((err) => {
        logger.error(`${logPrefix} Error in inserting broadcast message `, err)
    })
}


// Exports
module.exports = {
    checkBulkMessageForUser,
};