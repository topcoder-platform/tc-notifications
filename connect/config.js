/**
 * The configuration file for connectNotificationServer.js.
 */

module.exports = {
  TC_API_V3_BASE_URL: process.env.TC_API_V3_BASE_URL || 'https://api.topcoder-dev.com/v3',
  TC_API_V4_BASE_URL: process.env.TC_API_V4_BASE_URL || 'https://api.topcoder-dev.com/v4',
  MESSAGE_API_BASE_URL: process.env.MESSAGE_API_BASE_URL || 'https://api.topcoder-dev.com/v4',
  // eslint-disable-next-line max-len
  TC_ADMIN_TOKEN: process.env.TC_ADMIN_TOKEN,

  // Probably temporary variables for TopCoder role ids for 'Connect Manager', 'Connect Copilot' and 'administrator'
  // These are values for development backend. For production backend they may be different.
  // These variables are currently being used to retrieve above role members using API V3 `/roles` endpoint.
  // As soon as this endpoint is replaced with more suitable one, these variables has to be removed if no need anymore.
  CONNECT_MANAGER_ROLE_ID: 8,
  CONNECT_COPILOT_ROLE_ID: 4,
  ADMINISTRATOR_ROLE_ID: 1,

  // id of the BOT user which creates post with various events in discussions
  TCWEBSERVICE_ID: process.env.TCWEBSERVICE_ID || '22838965',

  // Configuration for generating machine to machine auth0 token.
  // The token will be used for calling another internal API.
  auth0Url: process.env.auth0Url || 'https://topcoder-newauth.auth0.com/oauth/token',
  auth0Audience: process.env.auth0Audience || 'https://www.topcoder.com',
  // The token will be cached.
  // We define the time period of the cached token.
  tokenCacheTime: process.env.tokenCacheTime || 86400000,
  auth0CliendId: process.env.auth0CliendId,
  auth0CliendSecret: process.env.auth0CliendSecret,
};
