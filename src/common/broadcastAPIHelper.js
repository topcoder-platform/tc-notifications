/**
 *  Broadcast: API calling helper
 */

const _ = require('lodash')
const config = require('config')
const request = require('superagent')
const logger = require('./logger')
const m2mAuth = require('tc-core-library-js').auth.m2m
const NodeCache = require('node-cache')

const m2m = m2mAuth(config)
const cache = new NodeCache()

const logPrefix = "BroadcastAPI: "
const cachedTimeInSeconds = 300  //300 seconds 

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
        `query=userId%3A${userId}` +
        `&limit=1`
    if (cachedMemberInfo = cache.get(url)) {
        return new Promise( (resolve, reject) => {
            resolve(cachedMemberInfo)
        })
    } 
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
            cache.set(url, memberInfo, cachedTimeInSeconds)
            resolve(memberInfo)
        } catch (err) {
            reject(new Error(`BCA Memeber API: Failed to get member ` +
                `api detail for user id ${userId}, ${err}`))
        }

    })
}

/**
 * Helper Function - get user group 
 * @param {Integer} userId 
 */
async function getUserGroup(userId) {
    try {
        const machineToken = await getM2MToken()
        if (machineToken.length <= 0) {
            return (new Error(`BCA Group API: fecthing m2m token failed for ${userId}`))
        }
        let nextPage
        let res
        let url
        let page = 1
        let groupInfo = []
        const perPage = 100
        do {
            url = config.TC_API_V5_BASE_URL +
                `/groups/?memberId=${userId}&membershipType=user` +
                `&page=${page}&perPage=${perPage}`
            res = await callApi(url, machineToken)
            let resStatus = _.get(res, 'res.statusCode')
            if (resStatus != 200) {
                throw new Error(`BCA Group API: Failed for user id ${userId},` +
                    ` response status ${resStatus}`)
            }
            let data = _.get(res, 'body')
            groupInfo = groupInfo.concat(data)
            nextPage = _.get(res, 'header.x-next-page')
            page = nextPage
        } while (nextPage)
        logger.info(`BCA Group API: Feteched ${groupInfo.length} record(s) from group api`)
        return groupInfo
    } catch (e) {
        logger.error(`BCA: Error calling group api : ${e}`)
        throw new Error(`getUserGroup() : ${e}`)
    }
}

/**
 * 
 * @param {String} url 
 * @param {String} machineToken 
 */
async function callApi(url, machineToken) {
    try {
        logger.info(`calling api url ${url}`)
        return request.get(url).set('Authorization', `Bearer ${machineToken}`)
    } catch (e) {
        logger.error(`Error in calling URL ${url}, ${e}`)
        throw new Error(`callApi() : ${e}`)
    }
}

/**
 *  Helper function - check Skills and Tracks condition
 *  
 *  @param {Integer} userId 
 *  @param {Object} bulkMessage 
 *  @param {Object} m memberInfo
 * 
 */
async function checkUserSkillsAndTracks(userId, bulkMessage, m) {
    try {
        const skills = _.get(bulkMessage, 'recipients.skills')
        const tracks = _.get(bulkMessage, 'recipients.tracks')
        let skillMatch, trackMatch = false // default
        if (skills && skills.length > 0) {
            const ms = _.get(m[0], "skills") // get member skills 
            const memberSkills = []
            skillMatch = false
            _.map(ms, (o) => {
                memberSkills.push(_.get(o, 'name').toLowerCase())
            })
            _.map(skills, (s) => {
                if (_.indexOf(memberSkills, s.toLowerCase()) >= 0) {
                    skillMatch = true
                    logger.info(`BroadcastMessageId: ${bulkMessage.id},` +
                        ` '${s}' skill matached for user id ${userId}`)
                }
            })
        } else {
            skillMatch = true  // no condition, means allow for all 
        }

        //
        if (tracks.length > 0) {
            trackMatch = false
            const uDevChallenges = _.get(m[0], "stats[0].DEVELOP.challenges")
            const uDesignChallenges = _.get(m[0], "stats[0].DESIGN.challenges")
            const uDSChallenges = _.get(m[0], "stats[0].DATA_SCIENCE.challenges")
            _.map(tracks, (t) => {
                /**
                 * checking if user participated in specific challenges   
                 */
                let key = t.toLowerCase()
                if (key === "develop") {
                    trackMatch = uDevChallenges > 0 ? true : trackMatch
                } else if (key === "design") {
                    trackMatch = uDesignChallenges > 0 ? true : trackMatch
                } else if (key === "data_science") {
                    trackMatch = uDSChallenges > 0 ? true : trackMatch
                }
            })
        } else {
            trackMatch = true // no condition, means allow for all
        }
        const flag = (skillMatch && trackMatch) ? true : false
        return flag
    } catch (e) {
        throw new Error(`checkUserSkillsAndTracks() : ${e}`)
    }
}

/**
 * Helper function - check group condition 
 */
async function checkUserGroup(userId, bulkMessage, userGroupInfo) {
    try {
        const groups = _.get(bulkMessage, 'recipients.groups')
        let flag = false // default
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
            logger.info(`public group condition for userId ${userId}` +
                ` and BC messageId ${bulkMessage.id}, the result is: ${flag}`)
        }
        return flag
    } catch (e) {
        throw new Error(`checkUserGroup(): ${e}`)
    }
}

/**
 * Main Function - check if broadcast message is for current user or not  
 * 
 * @param {Integer} userId 
 * @param {Object} bulkMessage 
 * @param {Object} memberInfo
 * @param {Object} userGroupInfo
 * 
 * @return Promise 
 */
async function checkBroadcastMessageForUser(userId, bulkMessage, memberInfo, userGroupInfo) {
    return new Promise(function (resolve, reject) {
        Promise.all([
            checkUserSkillsAndTracks(userId, bulkMessage, memberInfo),
            checkUserGroup(userId, bulkMessage, userGroupInfo),
        ]).then((results) => {
            let flag = true // TODO need to be sure about default value  
            _.map(results, (r) => {
                flag = !r ? false : flag // TODO recheck condition 
            })
            logger.info(`BCA: messageId: ${bulkMessage.id} Final recipient` +
                ` condition result is: ${flag} for userId ${userId}`)
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
    getMemberInfo,
    getUserGroup,
}