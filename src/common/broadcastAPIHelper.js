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

async function getM2MToken() {
    return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

async function getMemberInfo(userId) {
    const url = config.TC_API_V3_BASE_URL +
        `/members/_search/?fields=userId%2Cskills&query=userId%3A${userId}&limit=1`
    return new Promise(function (resolve, reject) {
        let memberInfo = []
        logger.info(`calling member api ${url} `)
        request
            .get(url).then((res) => {
                if (!_.get(res, 'body.result.success')) {
                    reject(new Error(`Failed to get member api detail for user id ${userId}`))
                }
                memberInfo = _.get(res, 'body.result.content')
                logger.info(`Feteched ${memberInfo.length} record(s) from member api`)
                resolve(memberInfo)
            })
            .catch((err) => {
                reject(new Error(`Failed to get member api detail for user id ${userId}, ${err}`))
            })

    })
    // Need clean-up 
    /*const m2m = await getM2MToken().catch((err) => { 
        logger.error(`${logPrefix} Failed to get m2m token`)
        return new Promise(function(res, rej) {
           rej(err)
        })
    })
    logger.info(`${logPrefix} Fetched m2m token sucessfully. Token length is: `, m2m.length)
    */
    //return request.get(url)
}

async function checkBroadcastMessageForUser(userId, bulkMessage) {
    return new Promise(function (resolve, reject) {
        const skills = _.get(bulkMessage, 'recipients.skills')
        logger.info(`Got skills in DB...`, skills)
        if (skills && skills.length > 0) {
            try {
                getMemberInfo(userId).then((m) => {
                    let flag = false
                    logger.info(`${logPrefix} got member info.`)
                    const ms = _.get(m[0], "skills")
                    const memberSkills = []
                    _.map(ms, (o) => {
                        memberSkills.push(_.get(o, 'name').toLowerCase())
                    })
                    logger.info(`${logPrefix} user id have following skills`, memberSkills)
                    _.map(skills, (s) => {
                        if (_.indexOf(memberSkills, s.toLowerCase()) >= 0) {
                            flag = true;
                            logger.info(`${logPrefix} '${s}' skill matached for user id ${userId}`)
                        }
                    })
                    resolve({
                        record: bulkMessage,
                        result: flag
                    })
                }).catch((err) => {
                    reject(err)
                })
            } catch (err) {
                reject(new Error(`${logPrefix} issue at skill condition check, ${err.message}`))
            }
        } else {
            resolve(true) // no condition on recipient, so for all 
        }
    }) // promise end

}

module.exports = {
    checkBroadcastMessageForUser,
}