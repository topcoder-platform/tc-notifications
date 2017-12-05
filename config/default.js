/**
 * The configuration file.
 */

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL,
  PORT: process.env.PORT,

  authSecret: process.env.authSecret,
  authDomain: process.env.authDomain,
  validIssuers: process.env.validIssuers,
  jwksUri: process.env.jwksUri,

  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_OPTIONS: {
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  },

  // comma separated Kafka hosts
  KAFKA_URL: process.env.KAFKA_URL, // eslint-disable-line max-len

  // ignore prefix for topics in the Kafka, e.g.
  // 'joan-26673.notifications.connect.project.updated' is considered as 'notifications.connect.project.updated'
  KAFKA_TOPIC_IGNORE_PREFIX: process.env.KAFKA_TOPIC_IGNORE_PREFIX,

  // when notification server is deployed to multiple instances, the instances should use same group id so that
  // Kafka event is not handled duplicately in the group, an event is handled by only one instance in the group
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,

  // Kafka connection certificate, optional;
  // if not provided, then SSL connection is not used, direct insecure connection is used;
  // if provided, it can be either path to certificate file or certificate content
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT ? process.env.KAFKA_CLIENT_CERT.replace('\\n', '\n') : null,

  // Kafka connection private key, optional;
  // if not provided, then SSL connection is not used, direct insecure connection is used;
  // if provided, it can be either path to private key file or private key content
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY ? process.env.KAFKA_CLIENT_CERT_KEY.replace('\\n', '\n') : null,
};
