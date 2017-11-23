/**
 * The configuration file.
 */
//var dotenv = require('dotenv').config({path: '/opt/app/.env'});

var shell = require('shelljs');
KAFKA_CLIENT_CERT = shell.cat('KAFKA_CLIENT_CERT.txt');
console.log('from shell kakfa cert:',KAFKA_CLIENT_CERT);
KAFKA_CLIENT_CERT_KEY=shell.cat('KAFKA_CLIENT_CERT_KEY.txt');
console.log('from shell kakfka key:',KAFKA_CLIENT_CERT_KEY);

var dotenv = require('dotenv').config();
//var DB_CONNSTRING = process.env.DB_CONNSTRING;
console.log('process.env.LOG_LEVEL:', process.env.LOG_LEVEL);
console.log('process.env.NODE_PORT:', process.env.NODE_PORT);
console.log('process.env.JWT_SECRET:', process.env.JWT_SECRET);
console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);
console.log('process.env.KAFKA_URL:', process.env.KAFKA_URL);
console.log('process.env.KAFKA_TOPIC_IGNORE_PREFIX:', process.env.KAFKA_TOPIC_IGNORE_PREFIX);
console.log('process.env.KAFKA_GROUP_ID:', process.env.KAFKA_GROUP_ID);
//process.exit();

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL,
  PORT: process.env.NODE_PORT,
  JWT_SECRET: process.env.JWT_SECRET,
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
  KAFKA_URL: process.env.KAFKA_URL, 

  // ignore prefix for topics in the Kafka, e.g.
  KAFKA_TOPIC_IGNORE_PREFIX: process.env.KAFKA_TOPIC_IGNORE_PREFIX,

  // when notification server is deployed to multiple instances, the instances should use same group id so that
  // Kafka event is not handled duplicately in the group, an event is handled by only one instance in the group
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,

  // Kafka connection certificate, optional;
  // if not provided, then SSL connection is not used, direct insecure connection is used;
  // if provided, it can be either path to certificate file or certificate content
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,

  // Kafka connection private key, optional;
  // if not provided, then SSL connection is not used, direct insecure connection is used;
  // if provided, it can be either path to private key file or private key content
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,
};
