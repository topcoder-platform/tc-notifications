/**
 * Hook to insert broadcast notification into database for a user.
 */

'use strict'

const _ = require('lodash')
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
                    let result = true
                    if (tUserRefs < tBulkMessages) {
                        logger.info(`${logPrefix} Need to sync broadcast message for current user ${userId}`)
                        result = await syncBulkMessageForUser(userId)
                    }
                    resolve(result)  // resolve here
                }).catch((e) => {
                    reject(`${logPrefix} Failed to check total userRefs condition. Error: ${e}`)
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
                Promise.all(res[0].map((r) => isBroadCastMessageForUser(userId, r)))
                    .then((results) => {
                        Promise.all(results.map((o) => {
                            if (o.result) {
                                return createNotificationForUser(userId, o.record)
                            } else {
                                return insertUserRefs(userId, o.record.id, null)
                            }
                        })).then((results) => {
                            resolve(results)
                        }).catch((e) => {
                            reject(e)
                        })
                    }).catch((e) => {
                        reject(e)
                    })
            }).catch((e) => {
                reject(`${logPrefix} Failed to check bulk message condition: error - ${e}`)
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
 * Helper function - Insert in bulkMessage user reference table
 * 
 * @param {Integer} userId 
 * @param {Integer} bulkMessageId 
 * @param {Integer} notificationId 
 */
async function insertUserRefs(userId, bulkMessageId, notificationId) {
    try {
        const r = await models.BulkMessageUserRefs.create({
            bulk_message_id: bulkMessageId,
            user_id: userId,
            notification_id: notificationId,
        })
        logger.info(`${logPrefix} Inserted userRef record for bulk message id ${r.id} for current user ${userId}`)
        return r
    } catch (e) {
        logger.error(`${logPrefix} Failed to insert userRef record for user: ${userId}, error: ${e}`)
        throw new Error(`insertUserRefs() : ${e}`)
    }
}

/**
 * Helper function 
 * @param {Integer} userId 
 * @param {Object} bulkMessage 
 */
async function createNotificationForUser(userId, bulkMessage) {
    try {
        const n = await models.Notification.create({
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
        })
        logger.info(`${logPrefix} Inserted notification record ${n.id} for current user ${userId}`)
        // TODO need to be in transaction so that rollback will be possible
        const result = await insertUserRefs(userId, bulkMessage.id, n.id)
        return result
    } catch (e) {
        logger.error(`${logPrefix} insert broadcast notification error: ${e} `)
        throw new Error(`createNotificationForUser() : ${e}`)
    }
}


// Exports
module.exports = {
    checkBulkMessageForUser,
};