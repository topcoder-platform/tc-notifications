/**
 * Service to get data from TopCoder API
 */
/* global M2m */
const request = require('superagent');
const config = require('./config');
const _ = require('lodash');

let rolesCache = null;

/**
 * Get project details
 *
 * @param  {String} projectId project id
 *
 * @return {Promise}          promise resolved to project details
 */
const getProject = (projectId) => (
  M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then((token) => (
      request
        .get(`${config.TC_API_V5_BASE_URL}/projects/${projectId}`)
        .set('accept', 'application/json')
        .set('authorization', `Bearer ${token}`)
        .then((res) => {
          const project = res.body;
          if (!project) {
            throw new Error(`Failed to get project details of project id: ${projectId}`);
          }
          return project;
        }).catch((err) => {
          const errorDetails = _.get(err, 'response.body.message');
          throw new Error(
            `Failed to get project details of project id: ${projectId}.` +
            (errorDetails ? ' Server response: ' + errorDetails : '')
          );
        })
    ))
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
);

/**
 * Get role id
 *
 * @param  {String} role role
 *
 * @return {Promise}       promise resolved to role members ids list
 */
const getRoleId = (role) => {
  if (rolesCache) {
    const cachedRole = _.find(rolesCache, { roleName: role });
    if (cachedRole) {
      return Promise.resolve(cachedRole.id);
    }
  }
  return M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then((token) => (
      request
        .get(`${config.TC_API_V3_BASE_URL}/roles`)
        .set('accept', 'application/json')
        .set('authorization', `Bearer ${token}`)
        .then((res) => {
          if (!_.get(res, 'body.result.success')) {
            throw new Error('Failed to get roles list');
          }
          const roles = _.get(res, 'body.result.content');
          rolesCache = roles;
          return _.find(roles, { roleName: role }).id;
        }).catch((err) => {
          const errorDetails = _.get(err, 'response.body.result.content.message');
          throw new Error(
            `Failed to get role id for role ${role}.` +
            (errorDetails ? ' Server response: ' + errorDetails : '')
          );
        })
    ))
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    });
};

/**
 * Get role members
 *
 * @param  {String} role role
 *
 * @return {Promise}       promise resolved to role members ids list
 */
const getRoleMembers = (role) => (
  M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then((token) => (
      getRoleId(role)
      .then(roleId => (
        request
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
        })
      ))
    ))
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
);

/**
 * Get users details by ids
 *
 * @param  {Array} ids list of user ids
 *
 * @return {Promise}   resolves to the list of user details
 */
const getUsersById = (ids) => {

  let query = ""
  if (ids.length>1) {
    query = _.map(ids, (id) => 'userIds=' + id).join('&');
  } else if(ids.length==1) {
    query = 'userId=' + ids[0];
  }

  console.log(`Calling members API with query: ${query}`)
  return M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
    .then((token) => {
      const fields = 'fields=userId,email,handle,firstName,lastName,photoURL,status';
      return request
      .get(`${config.TC_API_V5_BASE_URL}/members/?${fields}&${query}`)
      .set('accept', 'application/json')
      .set('authorization', `Bearer ${token}`)
      .then((res) => {
        console.log(`Result: ${JSON.stringify(res)}`)
        if (res.status!=200) {
          throw new Error(`Failed to get users by ids: ${ids}`);
        }
        const users = JSON.parse(_.get(res, 'text'));
        return users;
      }).catch((err) => {
        const errorDetails = `Status code: ${JSON.stringify(err)}`;
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
  const query = _.map(handles, (handle) => 'handle:"' + handle.trim().replace('"', '\\"') + '"').join(' OR ');
  return M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
    .then((token) => {
      const fields = 'fields=userId,handle,firstName,lastName,photoURL';
      return request
      .get(`${config.TC_API_V3_BASE_URL}/members/_search?${fields}&query=${query}`)
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
const getTopic = (topicId, logger) => (
  M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then((token) => (
      request
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
        })
    ))
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
);

/**
 * Get phase details
 *
 * @param  {String} projectId project id
 * @param  {String} phaseId phase id
 *
 * @return {Promise}          promise resolved to phase details
 */
const getPhase = (projectId, phaseId) => (
  M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then((token) => (
      request
        .get(`${config.TC_API_V5_BASE_URL}/projects/${projectId}/phases/${phaseId}`)
        .set('accept', 'application/json')
        .set('authorization', `Bearer ${token}`)
        .then((res) => {
          const project = res.body;
          if (!project) {
            throw new Error(`Failed to get phase details of project id: ${projectId}, phase id: ${phaseId}`);
          }
          return project;
        }).catch((err) => {
          const errorDetails = _.get(err, 'response.body.message');
          throw new Error(
            `Failed to get phase details of project id: ${projectId}, phase id: ${phaseId}.` +
            (errorDetails ? ' Server response: ' + errorDetails : '')
          );
        })
    ))
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
);

module.exports = {
  getProject,
  getRoleMembers,
  getUsersById,
  getUsersByHandle,
  getTopic,
  getPhase,
};
