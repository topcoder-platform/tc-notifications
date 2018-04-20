/**
 * Service to get data from TopCoder API
 */
const request = require('superagent');
const config = require('./config');
const _ = require('lodash');
const tcCoreLibAuth = require('tc-core-library-js').auth;
const m2m = tcCoreLibAuth.m2m(config);

/**
 * Get project details
 *
 * @param  {String} projectId project id
 *
 * @return {Promise}          promise resolved to project details
 */
const getProject = (projectId) => request
  .get(`${config.TC_API_V4_BASE_URL}/projects/${projectId}`)
  .set('accept', 'application/json')
  .set('authorization', `Bearer ${config.TC_ADMIN_TOKEN}`)
  .then((res) => {
    if (!_.get(res, 'body.result.success')) {
      throw new Error(`Failed to get project details of project id: ${projectId}`);
    }

    const project = _.get(res, 'body.result.content');

    return project;
  }).catch((err) => {
    const errorDetails = _.get(err, 'response.body.result.content.message');
    throw new Error(
      `Failed to get project details of project id: ${projectId}.` +
      (errorDetails ? ' Server response: ' + errorDetails : '')
    );
  });

/**
 * Get role members
 *
 * @param  {String} roleId role id
 *
 * @return {Promise}       promise resolved to role members ids list
 */
const getRoleMembers = (roleId) => request
  .get(`${config.TC_API_V3_BASE_URL}/roles/${roleId}?fields=subjects`)
  .set('accept', 'application/json')
  .set('authorization', `Bearer ${config.TC_ADMIN_TOKEN}`)
  .then((res) => {
    if (!_.get(res, 'body.result.success')) {
      throw new Error(`Failed to get role memebrs of role id: ${roleId}`);
    }

    const members = _.get(res, 'body.result.content.subjects');

    return members;
  }).catch((err) => {
    const errorDetails = _.get(err, 'response.body.result.content.message');
    throw new Error(
      `Failed to get role memebrs of role id: ${roleId}.` +
      (errorDetails ? ' Server response: ' + errorDetails : '')
    );
  });

/**
 * Get users details by ids
 *
 * @param  {Array} ids list of user ids
 *
 * @return {Promise}   resolves to the list of user details
 */
const getUsersById = (ids) => {
  const query = _.map(ids, (id) => 'userId:' + id).join(' OR ');
  return m2m.getMachineToken(config.auth0CliendId, config.auth0CliendSecret)
    .then((token) => {
      if (!token && config.TC_ADMIN_TOKEN) token = config.TC_ADMIN_TOKEN;

      return request
      .get(`${config.TC_API_V3_BASE_URL}/members/_search?fields=userId,handle,firstName,lastName&query=${query}`)
      .set('accept', 'application/json')
      .set('authorization', `Bearer ${token}`)
      .then((res) => {
        if (!_.get(res, 'body.result.success')) {
          throw new Error(`Failed to get users by id: ${ids}  token:  ${token}`);
        }

        const users = _.get(res, 'body.result.content');
        return users;
      }).catch((err) => {
        const errorDetails = _.get(err, 'response.body.result.content.message');
        throw new Error(
          `Failed to get users by ids: ${ids}  ${token} .` +
          (errorDetails ? ' Server response: ' + errorDetails : '')
        );
      });
    })
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    });
};

/**
 * Get users details by ids
 *
 * @param  {Array} ids list of user ids
 *
 * @return {Promise}   resolves to the list of user details
 */
const getUsersByHandle = (handles) => {
  const query = _.map(handles, (handle) => 'handle:' + handle).join(' OR ');
  return m2m.getMachineToken(config.auth0CliendId, config.auth0CliendSecret)
    .then((token) => {
      if (!token && config.TC_ADMIN_TOKEN) token = config.TC_ADMIN_TOKEN;

      return request
      .get(`${config.TC_API_V3_BASE_URL}/members/_search?fields=userId,handle,firstName,lastName&query=${query}`)
      .set('accept', 'application/json')
      .set('authorization', `Bearer ${token}`)
      .then((res) => {
        if (!_.get(res, 'body.result.success')) {
          throw new Error(`Failed to get users by handle: ${handles} ${token}`);
        }
        const users = _.get(res, 'body.result.content');

        return users;
      }).catch((err) => {
        const errorDetails = _.get(err, 'response.body.result.content.message');
        throw new Error(
          `Failed to get users by handles: ${handles} ${token}.` +
          (errorDetails ? ' Server response: ' + errorDetails : '')
        );
      });
    })
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
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
  .get(`${config.TC_API_V4_BASE_URL}/topics/${topicId}`)
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
  getProject,
  getRoleMembers,
  getUsersById,
  getUsersByHandle,
  getTopic,
};
