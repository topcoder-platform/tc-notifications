/**
 * Copyright (C) 2017 TopCoder Inc., All Rights Reserved.
 */

/**
 * the Scheduled Events schema
 *
 * @author      TCSCODER
 * @version     1.0
 */

module.exports = (sequelize, DataTypes) => sequelize.define('ScheduledEvents', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  schedulerId: { type: DataTypes.STRING, allowNull: false },
  data: { type: DataTypes.JSON, allowNull: false },
  // keep period as an arbitrary string so any service can define their own periods
  period: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), allowNull: false },
  // next fields are optional, scheduler by itself doesn't rely on them
  // main intention to have them is debugging production issues quickly
  // though particular services may defined and use them
  eventType: { type: DataTypes.STRING, allowNull: true },
  userId: { type: DataTypes.BIGINT, allowNull: true },
  reference: { type: DataTypes.STRING, allowNull: true },
  referenceId: { type: DataTypes.STRING, allowNull: true },
});
