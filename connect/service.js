/**
 * Service to get data from TopCoder API
 */
/* global M2m */
const request = require('superagent');
const config = require('./config');
const _ = require('lodash');

/**
 * Get project details
 *
 * @param  {String} projectId project id
 *
 * @return {Promise}          promise resolved to project details
 */
const getProject = (projectId) => {
  return M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then((token) => {
      return request
        .get(`${config.TC_API_V4_BASE_URL}/projects/${projectId}`)
        .set('accept', 'application/json')
        .set('authorization', `Bearer ${token}`)
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
    })
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    });
};
/**
 * Get role members
 *
 * @param  {String} roleId role id
 *
 * @return {Promise}       promise resolved to role members ids list
 */
const getRoleMembers = (roleId) => {
  return M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then((token) => {
      return request
        .get(`${config.TC_API_V3_BASE_URL}/roles/${roleId}?fields=subjects`)
        .set('accept', 'application/json')
        .set('authorization', `Bearer ${token}`)
        .then((res) => {
          if (!_.get(res, 'body.result.success')) {
            throw new Error(`Failed to get role membrs of role id: ${roleId}`);
          }
          const members = _.get(res, 'body.result.content.subjects');
          return members;
        }).catch((err) => {
          const errorDetails = _.get(err, 'response.body.result.content.message');
          throw new Error(
            `Failed to get role membrs of role id: ${roleId}.` +
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
const getUsersById = (ids) => {
  const query = _.map(ids, (id) => 'userId:' + id).join(' OR ');
  return M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
    .then((token) => {
      return request
      .get(`${config.TC_API_V3_BASE_URL}/members/_search?fields=userId,email,handle,firstName,lastName,photoURL&query=${query}`)
      .set('accept', 'application/json')
      .set('authorization', `Bearer ${token}`)
      .then((res) => {
        if (!_.get(res, 'body.result.success')) {
          throw new Error(`Failed to get users by ids: ${ids}`);
        }

        const users = _.get(res, 'body.result.content');
        return users;
      }).catch((err) => {
        const errorDetails = _.get(err, 'response.body.result.content.message')
          || `Status code: ${err.response.statusCode}`;
        throw new Error(
          `Failed to get users by ids: ${ids}.` +
          (errorDetails ? ' Server response: ' + errorDetails : '')
        );
      });
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
  return M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
    .then((token) => {
      return request
      .get(`${config.TC_API_V3_BASE_URL}/members/_search?fields=userId,handle,firstName,lastName,photoURL&query=${query}`)
      .set('accept', 'application/json')
      .set('authorization', `Bearer ${token}`)
      .then((res) => {
        if (!_.get(res, 'body.result.success')) {
          throw new Error(`Failed to get users by handle: ${handles}`);
        }
        const users = _.get(res, 'body.result.content');

        return users;
      }).catch((err) => {
        const errorDetails = _.get(err, 'response.body.result.content.message')
          || `Status code: ${err.response.statusCode}`;
        throw new Error(
          `Failed to get users by handles: ${handles}.` +
          (errorDetails ? ' Server response: ' + errorDetails : '')
        );
      });
    });
};

/**
 * Get topic details
 *
 * @param  {String} topicId topic id
 *
 * @return {Promise}          promise resolved to topic details
 */
const getTopic = (topicId, logger) => {
  return M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then((token) => {
      return request
        .get(`${config.MESSAGE_API_BASE_URL}/topics/${topicId}/read`)
        .set('accept', 'application/json')
        .set('authorization', `Bearer ${token}`)
        .then((res) => {
          if (!_.get(res, 'body.result.success')) {
            throw new Error(`Failed to get topic details of topic id: ${topicId}`);
          }
          return _.get(res, 'body.result.content');
        }).catch((err) => {
          if (logger) {
            logger.error(err, `Error while calling ${config.MESSAGE_API_BASE_URL}/topics/${topicId}/read`);
          }
          const errorDetails = _.get(err, 'response.body.result.content.message');
          throw new Error(
            `Failed to get topic details of topic id: ${topicId}.` +
            (errorDetails ? ' Server response: ' + errorDetails : '')
          );
        });
    })
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    });
};

module.exports = {
  getProject,
  getRoleMembers,
  getUsersById,
  getUsersByHandle,
  getTopic,
};
