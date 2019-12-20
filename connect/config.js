/**
 * The configuration file for connectNotificationServer.js.
 */

module.exports = {
  // TC API related variables
  TC_API_V3_BASE_URL: process.env.TC_API_V3_BASE_URL || 'https://api.topcoder-dev.com/v3',
  TC_API_V4_BASE_URL: process.env.TC_API_V4_BASE_URL || 'https://api.topcoder-dev.com/v4',
  TC_API_V5_BASE_URL: process.env.TC_API_V5_BASE_URL || 'https://api.topcoder-dev.com/v5',
  MESSAGE_API_BASE_URL: process.env.MESSAGE_API_BASE_URL || 'https://api.topcoder-dev.com/v5',

  // id of the BOT user which creates post with various events in discussions
  TCWEBSERVICE_ID: process.env.TCWEBSERVICE_ID || '22838965',
  CODERBOT_USER_ID: process.env.CODERBOT_USER_ID || 'CoderBot',

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
  AUTH_SECRET: process.env.AUTH_SECRET,
  ENABLE_EMAILS: process.env.ENABLE_EMAILS || true,
  ENABLE_DEV_MODE: process.env.ENABLE_DEV_MODE || true,
  DEV_MODE_EMAIL: process.env.DEV_MODE_EMAIL,
  MENTION_EMAIL: process.env.MENTION_EMAIL,
  REPLY_EMAIL_PREFIX: process.env.REPLY_EMAIL_PREFIX,
  REPLY_EMAIL_DOMAIN: process.env.REPLY_EMAIL_DOMAIN,
  REPLY_EMAIL_FROM: process.env.REPLY_EMAIL_FROM,
  DEFAULT_REPLY_EMAIL: process.env.DEFAULT_REPLY_EMAIL,

  CONNECT_URL: process.env.CONNECT_URL || 'https://connect.topcoder-dev.com',
  ACCOUNTS_APP_URL: process.env.ACCOUNTS_APP_URL || 'https://accounts.topcoder-dev.com',
};
