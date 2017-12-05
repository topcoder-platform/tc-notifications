/**
 * The configuration file for connectNotificationServer.js.
 */

console.log('process.env.TC_API_BASE_URL:',process.env.TC_API_BASE_URL);
console.log('process.env.TC_ADMIN_TOKEN:',process.env.TC_ADMIN_TOKEN);

module.exports = {
  TC_API_BASE_URL: process.env.TC_API_BASE_URL,
  TC_ADMIN_TOKEN: process.env.TC_ADMIN_TOKEN, // eslint-disable-line max-len
};
