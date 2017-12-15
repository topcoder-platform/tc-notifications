/**
 * Copyright (C) 2017 Topcoder Inc., All Rights Reserved.
 */


/**
 * Init  datasource
 *
 * @author      TCSCODER
 * @version     1.0
 */

const config = require('config');
const Sequelize = require('sequelize');
const logger = require('../common/logger');

Sequelize.Promise = require('bluebird');
let sequelizeInstance = null;

/**
 * get sequelize instance
 */
function getSequelize() {
  if (!sequelizeInstance) {
    console.log(config.DATABASE_OPTIONS);
    sequelizeInstance = new Sequelize(config.DATABASE_URL, config.DATABASE_OPTIONS);
    sequelizeInstance
      .authenticate()
      .then(() => {
        logger.info('Database connection has been established successfully.');
      })
      .catch((err) => {
        logger.error('Unable to connect to the database:', err);
      });
  }
  return sequelizeInstance;
}

module.exports = {
  getSequelize,
};
