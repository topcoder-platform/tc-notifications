/**
 * Copyright (C) 2017 TopCoder Inc., All Rights Reserved.
 */

/**
 * the sequelize schema index
 *
 * @author      TCSCODER
 * @version     1.0
 */

const sequelize = require('./datasource').getSequelize();
const DataTypes = require('sequelize/lib/data-types');

const Notification = require('./Notification')(sequelize, DataTypes);
const NotificationSetting = require('./NotificationSetting')(sequelize, DataTypes);
const ServiceSettings = require('./ServiceSettings')(sequelize, DataTypes);
const ScheduledEvents = require('./ScheduledEvents')(sequelize, DataTypes);

module.exports = {
  Notification,
  NotificationSetting,
  ServiceSettings,
  ScheduledEvents,
  init: () => sequelize.sync(),
};
