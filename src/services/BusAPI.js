/**
 * Bus API service
 */
/* global M2m */
const request = require('superagent');
const config = require('config');
const _ = require('lodash');

/**
 * Post event to bus api
 *
 * @param  {Object} event event
 *
 * @return {Promise}      promise resolved to post event
 */
const postEvent = event => (
  M2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    .then(token => (
      request
        .post(`${config.TC_API_V5_BASE_URL}/bus/events`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send(event)
        .then(() => '')
        .catch((err) => {
          const errorDetails = _.get(err, 'message');
          throw new Error(
            `Failed to post event ${event}.`
            + (errorDetails ? ' Server response: ' + errorDetails : ''),
          );
        })
    ))
    .catch((err) => {
      err.message = 'Error generating m2m token: ' + err.message;
      throw err;
    })
);

module.exports = {
  postEvent,
};
