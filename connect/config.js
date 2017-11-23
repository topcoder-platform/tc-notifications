/**
 * The configuration file for connectNotificationServer.js.
 */

console.log('tc_api :', process.env.TC_API_BASE_URL);
console.log('tc_api token :', process.env.TC_ADMIN_TOKEN);
module.exports = {

  TC_API_BASE_URL: process.env.TC_API_BASE_URL,
  TC_ADMIN_TOKEN: process.env.TC_ADMIN_TOKEN,

};

