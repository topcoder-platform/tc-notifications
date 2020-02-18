/**
 * Hook to insert broadcast notification into database for a user.
 */

'use strict'

const _ = require('lodash')
//const Joi = require('joi')
//const errors = require('../common/errors')
const logger = require('../common/logger')
const models = require('../models')
const api = require('../common/broadcastAPIHelper')

const logPrefix = "BulkNotificationHook: "

/**
 * CREATE NEW TABLES IF NOT EXISTS
 */
models.BulkMessages.sync().then((t) => {
    models.BulkMessageUserRefs.sync()
})

/**
 * Main function 
 * @param {Integer} userId 
 */
async function checkBulkMessageForUser(userId) {
    return new Promise(function (resolve, reject) {
        models.BulkMessages.count().then(function (tBulkMessages) {
            if (tBulkMessages > 0) {
                // the condition can help to optimize the execution
                models.BulkMessageUserRefs.count({
                    where: {
                        user_id: userId
                    }
                }).then(async function (tUserRefs) {
                    if (tUserRefs < tBulkMessages) {
                        logger.info(`${logPrefix} Need to sync broadcast message for current user ${userId}`)
                        syncBulkMessageForUser(userId).catch((e) => {
                            reject(e)
                        })
                    }
                    resolve(true)  // resolve here
                }).catch((e) => {
                    logger.error(`${logPrefix} Failed to check total userRefs condition. Error: `, e)
                    reject(e)
                })
            } else {
                resolve(true)
            }
        }).catch((e) => {
            logger.error(`${logPrefix} Failed to check total broadcast message condition. Error: `, e)
            reject(e)
        })
    })
}

/**
 * Helper function 
 * @param {Integer} userId 
 */
async function syncBulkMessageForUser(userId) {

    return new Promise(function (resolve, reject) {
        /**
         * Check if all bulk mesaages processed for current user or not
         */
        let q = "SELECT a.* FROM bulk_messages AS a " +
            " LEFT OUTER JOIN (SELECT id as refid, bulk_message_id " +
            " FROM bulk_message_user_refs AS bmur WHERE bmur.user_id=$1)" +
            " AS b ON a.id=b.bulk_message_id WHERE b.refid IS NULL"
        models.sequelize.query(q, { bind: [userId] })
            .then(function (res) {
                _.map(res[0], (r) => {
                    logger.info(`${logPrefix} need to process for bulk message id: `, r.id)
                    isBroadCastMessageForUser(userId, r).then((result) => {
                        if (result) {
                            createNotificationForUser(userId, r)
                        } else {
                            insertUserRefs(userId, r.id, null)
                        }
                    }).catch((err) => {
                        logger.error("failed in checking recipient group condition, Error:", err)
                    })
                })
                resolve(true)
            }).catch((e) => {
                logger.error(`${logPrefix} Failed to check bulk message condition: `, e)
                reject(e)
            })
    })
}

/**
 * Helper function 
 * Check if current user in broadcast recipent group 
 * @param {Integer} userId 
 * @param {Object} bulkMessage 
 */
async function isBroadCastMessageForUser(userId, bulkMessage) {
    return api.checkBroadcastMessageForUser(userId, bulkMessage)
}

/**
 * Helper function 
 * @param {Integer} userId 
 * @param {Integer} bulkMessageId 
 * @param {Integer} notificationId 
 */
async function insertUserRefs(userId, bulkMessageId, notificationId) {
    await models.BulkMessageUserRefs.create({
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
async function createNotificationForUser(userId, bulkMessage) {
    await models.Notification.create({
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
    }).then(async (n) => {
        logger.info(`${logPrefix} Inserted notification record ${n.id} for current user ${userId}`)
        await insertUserRefs(userId, bulkMessage.id, n.id)
    }).catch((err) => {
        logger.error(`${logPrefix} Error in inserting broadcast message `, err)
    })
}


// Exports
module.exports = {
    checkBulkMessageForUser,
};