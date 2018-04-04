/**
 * Service to get data from TopCoder API
 */
const request = require('superagent');
const config = require('config');
const _ = require('lodash');


/**
 * Get users details by ids
 *
 * @param  {Array} ids list of user ids
 *
 * @return {Promise}   resolves to the list of user details
 */
const getUsersById = (ids) => {
  const query = _.map(ids, (id) => 'id=' + id).join(' OR ');
  return request
    .get(`${config.TC_API_V3_BASE_URL}/users?fields=userId,email,handle,firstName,lastName&filter=${query}`)
    .set('accept', 'application/json')
    .set('authorization', `Bearer ${config.TC_ADMIN_TOKEN}`)
    .then((res) => {
      if (!_.get(res, 'body.result.success')) {
        throw new Error(`Failed to get users by id: ${ids}`);
      }
      const users = _.get(res, 'body.result.content');
      return users;
    }).catch((err) => {
      const errorDetails = _.get(err, 'response.body.result.content.message');
      throw new Error(
        `Failed to get users by ids: ${ids}.` +
        (errorDetails ? ' Server response: ' + errorDetails : '')
      );
    });
};

/**
 * Get topic details
 *
 * @param  {String} topicId topic id
 *
 * @return {Promise}          promise resolved to topic details
 */
const getTopic = (topicId) => request
  .get(`http://${config.TC_API_V4_BASE_URL}/topics/${topicId}`)
  .set('accept', 'application/json')
  .set('authorization', `Bearer ${config.TC_ADMIN_TOKEN}`)
  .then((res) => {
    if (!_.get(res, 'body.result.success')) {
      throw new Error(`Failed to get topic details of topic id: ${topicId}`);
    }

    return _.get(res, 'body.result.content');
  }).catch((err) => {
    const errorDetails = _.get(err, 'response.body.result.content.message');
    throw new Error(
      `Failed to get topic details of topic id: ${topicId}.` +
      (errorDetails ? ' Server response: ' + errorDetails : '')
    );
  });


module.exports = {
  getUsersById,
  getTopic,
};
