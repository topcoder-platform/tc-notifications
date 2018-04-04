const request = require('superagent');
const config = require('config');
const _ = require('lodash');

/**
 * Post event to bus api
 *
 * @param  {Object} event event
 *
 * @return {Promise}          promise resolved to post event
 */
const postEvent = (event) => {
  console.log('URL: ', `${config.TC_API_BASE_URL}/eventbus/events`);
  console.log('URL: ', `${config.TC_API_V3_BASE_URL}/eventbus/events`);
  return request
  .post(`${config.TC_API_BASE_URL}/eventbus/events`)
  .set('Content-Type', 'application/json')
  .set('Authorization', `Bearer ${config.BUS_API_AUTH_TOKEN}`)
  .send(event)
  .then(() => '')
  .catch((err) => {
    const errorDetails = _.get(err, 'message');
    throw new Error(
      `Failed to post event ${event}.` +
      (errorDetails ? ' Server response: ' + errorDetails : '')
    );
  });
}

module.exports = {
  postEvent,
};
