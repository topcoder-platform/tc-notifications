/**
 * The configuration file for connectNotificationServer.js.
 */

module.exports = {
  // TC API related variables
  TC_API_V3_BASE_URL: process.env.TC_API_V3_BASE_URL || 'https://api.topcoder-dev.com/v3',
  TC_API_V4_BASE_URL: process.env.TC_API_V4_BASE_URL || 'https://api.topcoder-dev.com/v4',
  MESSAGE_API_BASE_URL: process.env.MESSAGE_API_BASE_URL || 'https://api.topcoder-dev.com/v5',
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
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  // The token will be cached.
  // We define the time period of the cached token.
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME || 86400000,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,

  // email notification service related variables
  ENV: process.env.ENV,
  AUTH_SECRET: process.env.authSecret,
  ENABLE_EMAILS: process.env.ENABLE_EMAILS || true,
  ENABLE_DEV_MODE: process.env.ENABLE_DEV_MODE || true,
  DEV_MODE_EMAIL: process.env.DEV_MODE_EMAIL,
  MENTION_EMAIL: process.env.MENTION_EMAIL,
  REPLY_EMAIL_PREFIX: process.env.REPLY_EMAIL_PREFIX,
  REPLY_EMAIL_DOMAIN: process.env.REPLY_EMAIL_DOMAIN,
  REPLY_EMAIL_FROM: process.env.REPLY_EMAIL_FROM,
  DEFAULT_REPLY_EMAIL: process.env.DEFAULT_REPLY_EMAIL,
};
