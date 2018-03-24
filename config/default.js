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

  BUS_API_BASE_URL: process.env.BUS_API_BASE_URL,
  BUS_API_AUTH_TOKEN: process.env.BUS_API_AUTH_TOKEN,
  MENTION_EMAIL: process.env.MENTION_EMAIL,
  REPLY_EMAIL_PREFIX: process.env.REPLY_EMAIL_PREFIX,
  REPLY_EMAIL_DOMAIN: process.env.REPLY_EMAIL_DOMAIN,

  TC_ADMIN_TOKEN: process.env.TC_ADMIN_TOKEN,
  TC_API_V3_BASE_URL: process.env.TC_API_V3_BASE_URL || 'https://api.topcoder-dev.com/v3',
};
