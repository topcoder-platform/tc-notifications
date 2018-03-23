/**
 * Copyright (C) 2017 TopCoder Inc., All Rights Reserved.
 */

/**
 * the Notification schema
 *
 * @author      TCSCODER
 * @version     1.0
 */


module.exports = (sequelize, DataTypes) => sequelize.define('Notification', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  contents: { type: DataTypes.JSONB, allowNull: false },
  read: { type: DataTypes.BOOLEAN, allowNull: false },
  seen: { type: DataTypes.BOOLEAN, allowNull: true },
  version: { type: DataTypes.SMALLINT, allowNull: true },
}, {});

// sequelize will generate and manage createdAt, updatedAt fields
