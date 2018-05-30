/**
 * The configuration file.
 */
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL,
  PORT: process.env.PORT,
  authSecret: process.env.authSecret,
  authDomain: process.env.authDomain,
  jwksUri: process.env.jwksUri,
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

  validIssuers: process.env.validIssuers ? process.env.validIssuers.replace(/\\"/g, '') : null,
  KAFKA_URL: process.env.KAFKA_URL,
  KAFKA_TOPIC_IGNORE_PREFIX: process.env.KAFKA_TOPIC_IGNORE_PREFIX,
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT ? process.env.KAFKA_CLIENT_CERT.replace('\\n', '\n') : null,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY ?
    process.env.KAFKA_CLIENT_CERT_KEY.replace('\\n', '\n') : null,
  TC_ADMIN_TOKEN: process.env.TC_ADMIN_TOKEN,
  TC_API_V5_BASE_URL: process.env.TC_API_V5_BASE_URL || 'https://api.topcoder-dev.com/v5',
  API_CONTEXT_PATH: process.env.API_CONTEXT_PATH || '/v5/notifications',
};
