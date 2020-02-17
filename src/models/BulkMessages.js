/**
 * Copyright (C) 2020 TopCoder Inc., All Rights Reserved.
 */

/**
 * The Bulk Message Store schema
 *
 * @author      TCSCODER
 * @version     1.0
 */


module.exports = (sequelize, DataTypes) => sequelize.define('bulk_messages', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    recipients: { type: DataTypes.JSONB, allowNull: false },
    rules: {type: DataTypes.JSONB, allowNull: true}
  }, {});
  
  // sequelize will generate and manage createdAt, updatedAt fields
  