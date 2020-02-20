/**
 * 
 */

const _ = require('lodash')
const config = require('config')
const request = require('superagent')
const logger = require('./logger')
const m2mAuth = require('tc-core-library-js').auth.m2m;
const m2m = m2mAuth(config);

const logPrefix = "BroadcastAPI: "

/**
 * Helper Function - get m2m token 
 */
async function getM2MToken() {
    return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/**
 * Helper Function - get member profile 
 * @param {Integer} userId 
 */
async function getMemberInfo(userId) {
    const url = config.TC_API_V3_BASE_URL +
        "/members/_search/?" +
        "fields=userId%2Cskills" +
        `&query=userId%3A${userId}` +
        `&limit=1`
    return new Promise(async function (resolve, reject) {
        let memberInfo = []
        logger.info(`calling member api ${url} `)
        try {
            const res = await request.get(url)
            if (!_.get(res, 'body.result.success')) {
                reject(new Error(`BCA Memeber API: Failed to get member detail for user id ${userId}`))
            }
            memberInfo = _.get(res, 'body.result.content')
            logger.info(`BCA Memeber API: Feteched ${memberInfo.length} record(s) from member api`)
            resolve(memberInfo)
        } catch (err) {
            reject(new Error(`BCA Memeber API: Failed to get member api detail for user id ${userId}, ${err}`))
        }

    })
}

/**
 * Helper Function - get user group 
 * @param {Integer} userId 
 */
async function getUserGroup(userId) {
    //TODO need to take care of pagination
    const url = config.TC_API_V5_BASE_URL +
        `/groups/?memberId=${userId}` +
        "&membershipType=user&page=1"
    let groupInfo = []
    return new Promise(async (resolve, reject) => {
        try {
            const machineToken = await getM2MToken()
            //logger.info(`BCA Group API: got m2m token of length ${machineToken.length}`)
            const res = await request.get(url).set('Authorization', `Bearer ${machineToken}`);
            if (_.get(res, 'res.statusCode') != 200) {
                reject(new Error(`BCA Group API: Failed to get group detail for user id ${userId}`))
            }
            groupInfo = _.get(res, 'body')
            logger.info(`BCA Group API: Feteched ${groupInfo.length} record(s) from group api`)
            resolve(groupInfo)
        } catch (e) {
            reject(`Calling group api ${e}`)
        }
    })
}

/**
 *  Helper function - check Skill condition
 */
async function checkUserSkill(userId, bulkMessage) {
    return new Promise(async function (resolve, reject) {
        try {
            const skills = _.get(bulkMessage, 'recipients.skills')
            let flag = true // allow for all
            if (skills && skills.length > 0) {
                const m = await getMemberInfo(userId)
                const ms = _.get(m[0], "skills") // get member skills 
                const memberSkills = []
                flag = false
                _.map(ms, (o) => {
                    memberSkills.push(_.get(o, 'name').toLowerCase())
                })
                _.map(skills, (s) => {
                    if (_.indexOf(memberSkills, s.toLowerCase()) >= 0) {
                        flag = true
                        logger.info(`BroadcastMessageId: ${bulkMessage.id}, '${s}' skill matached for user id ${userId}`)
                    }
                })
            }
            resolve(flag)
        } catch (e) {
            reject(e)
        }
    }) // promise end 
}

/**
 * Helper function - check group condition 
 */
async function checkUserGroup(userId, bulkMessage) {
    return new Promise(async function (resolve, reject) {
        try {
            const groups = _.get(bulkMessage, 'recipients.groups')
            let flag = false // default
            const userGroupInfo = await getUserGroup(userId)
            if (groups.length > 0) {
                _.map(userGroupInfo, (o) => {
                    // particular group only condition
                    flag = (_.indexOf(groups, _.get(o, "name")) >= 0) ? true : flag
                })
            } else { // no group condition means its for `public` no private group
                flag = true // default allow for all
                _.map(userGroupInfo, (o) => {
                    // not allow if user is part of any private group
                    flag = (_.get(o, "privateGroup")) ? false : flag
                })
            }
            resolve(flag)
        } catch (e) {
            reject(e)
        }
    })
}

/**
 * Main Function - check if broadcast message is for current user or not  
 * 
 * @param {Integer} userId 
 * @param {Object} bulkMessage 
 */
async function checkBroadcastMessageForUser(userId, bulkMessage) {
    return new Promise(function (resolve, reject) {
        Promise.all([
            checkUserSkill(userId, bulkMessage),
            checkUserGroup(userId, bulkMessage),
        ]).then((results) => {
            let flag = true // TODO need to be sure about default value  
            _.map(results, (r) => {
                flag = !r ? false : flag // TODO recheck condition 
            })
            logger.info(`BCA: Final recepient condition result is: ${flag} for userId ${userId}`)
            resolve({
                record: bulkMessage,
                result: flag
            })
        }).catch((err) => {
            reject(`${logPrefix} got issue in checking recipient condition. ${err}`)
        })
    }) // promise end
}

module.exports = {
    checkBroadcastMessageForUser,
}