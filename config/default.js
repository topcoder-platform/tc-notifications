/**
 * The configuration file.
 */
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL,
  PORT: process.env.PORT,
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
  AUTH_SECRET: process.env.AUTH_SECRET,
  VALID_ISSUERS: process.env.VALID_ISSUERS ? process.env.VALID_ISSUERS.replace(/\\"/g, '') : null,
  // keep it here for dev purposes, it's only needed by modified version of tc-core-library-js
  // which skips token validation when locally deployed

  KAFKA_URL: process.env.KAFKA_URL,
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT ? process.env.KAFKA_CLIENT_CERT.replace('\\n', '\n') : null,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY ?
    process.env.KAFKA_CLIENT_CERT_KEY.replace('\\n', '\n') : null,

  TC_API_V3_BASE_URL: process.env.TC_API_V3_BASE_URL || '',
  TC_API_V4_BASE_URL: process.env.TC_API_V4_BASE_URL || '',
  TC_API_V5_BASE_URL: process.env.TC_API_V5_BASE_URL || '',
  API_CONTEXT_PATH: process.env.API_CONTEXT_PATH || '/v5/notifications',
  TC_API_BASE_URL: process.env.TC_API_BASE_URL || '',

  // Configuration for generating machine to machine auth0 token.
  // The token will be used for calling another internal API.
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  // The token will be cached.
  // We define the time period of the cached token.
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME || 86400000,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,

  KAFKA_CONSUMER_RULESETS: {
    // key is Kafka topic name, value is array of ruleset which have key as
    // handler function name defined in src/processors/index.js
    'challenge.notification.events': [
      {
        handleChallenge: /** topic handler name */
        {
          type: 'UPDATE_DRAFT_CHALLENGE',
          roles: ['Submitter' /** Competitor */, 'Copilot', 'Reviewer'],
          notification:
          {
            id: 0, /** challengeid or projectid  */
            name: '', /** challenge name */
            group: 'Challenge',
            title: 'Challenge specification is modified.',
          },
        },
      },
    ],
    'notifications.autopilot.events': [
      {
        handleAutoPilot:
        {
          phaseTypeName: 'Checkpoint Screening',
          state: 'START',
          roles: ['Copilot', 'Reviewer'],
          notification:
          {
            id: 0, /** challengeid or projectid  */
            name: '', /** challenge name */
            group: 'Challenge',
            title: 'Challenge checkpoint review.',
          },
        },
      },
    ],
    'submission.notification.create': [
      {
        handleSubmission:
        {
          resource: 'submission',
          roles: ['Copilot', 'Reviewer'],
          selfOnly: true /** Submitter only */,
          notification:
          {
            id: 0, /** challengeid or projectid  */
            name: '', /** challenge name */
            group: 'Submission',
            title: 'A new submission is uploaded.',
          },
        },
      },
    ],
    'test.sachin': [
      {
        handleDummy:
        {}     
      },
    ],
    //'notifications.community.challenge.created': ['handleChallengeCreated'],
    //'notifications.community.challenge.phasewarning': ['handleChallengePhaseWarning'],
  },

  // email notification service related variables
  ENV: process.env.ENV,
  ENABLE_EMAILS: process.env.ENABLE_EMAILS ? Boolean(process.env.ENABLE_EMAILS) : false,
  ENABLE_DEV_MODE: process.env.ENABLE_DEV_MODE ? Boolean(process.env.ENABLE_DEV_MODE) : true,
  DEV_MODE_EMAIL: process.env.DEV_MODE_EMAIL,
  DEFAULT_REPLY_EMAIL: process.env.DEFAULT_REPLY_EMAIL,
};
