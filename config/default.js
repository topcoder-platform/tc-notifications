/**
 * The configuration file.
 */
module.exports = {
  ENV: process.env.ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  PORT: process.env.PORT,
  AUTH_SECRET: process.env.authSecret,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_OPTIONS: {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DATABASE_SSL != null,
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  },

  VALID_ISSUERS: process.env.validIssuers ? process.env.validIssuers.replace(/\\"/g, '') : null,
  KAFKA_URL: process.env.KAFKA_URL,
  KAFKA_TOPIC_IGNORE_PREFIX: process.env.KAFKA_TOPIC_IGNORE_PREFIX,
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT ? process.env.KAFKA_CLIENT_CERT.replace('\\n', '\n') : null,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY ?
    process.env.KAFKA_CLIENT_CERT_KEY.replace('\\n', '\n') : null,

  MENTION_EMAIL: process.env.MENTION_EMAIL,
  REPLY_EMAIL_PREFIX: process.env.REPLY_EMAIL_PREFIX,
  REPLY_EMAIL_DOMAIN: process.env.REPLY_EMAIL_DOMAIN,

  TC_API_BASE_URL: process.env.TC_API_BASE_URL || 'https://api.topcoder-dev.com',
  TC_API_V3_BASE_URL: process.env.TC_API_V3_BASE_URL || 'https://api.topcoder-dev.com/v3',
  TC_API_V4_BASE_URL: process.env.TC_API_V4_BASE_URL || 'https://api.topcoder-dev.com/v4',
  TC_API_V5_BASE_URL: process.env.TC_API_V5_BASE_URL || 'https://api.topcoder-dev.com/v5',
  MESSAGE_API_BASE_URL: process.env.MESSAGE_API_BASE_URL || 'https://api.topcoder-dev.com/v5',
  ENABLE_EMAILS: process.env.ENABLE_EMAILS || true,
  ENABLE_DEV_MODE: process.env.ENABLE_DEV_MODE || true,
  DEV_MODE_EMAIL: process.env.DEV_MODE_EMAIL,
  API_CONTEXT_PATH: process.env.API_CONTEXT_PATH || '/v5/notifications',

  // Configuration for generating machine to machine auth0 token.
  // The token will be used for calling another internal API.
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  // The token will be cached.
  // We define the time period of the cached token.
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME || 86400000,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
};
