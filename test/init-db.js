/**
 * Initialize database tables. Create tables if not present.
 */
'use strict';

global.Promise = require('bluebird');
const models = require('../src/models');
const logger = require('../src/common/logger');

logger.info('Initialize database tables...');

models.init()
  .then(() => {
    logger.info('Initialize database tables - COMPLETED');
    process.exit();
  })
  .catch((err) => {
    logger.logFullError(err);
    process.exit(1);
  });
