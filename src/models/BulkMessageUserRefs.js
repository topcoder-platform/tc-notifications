/**
 * Copyright (C) 2020 TopCoder Inc., All Rights Reserved.
 */

/**
 * The Bulk Message User Reference schema
 *
 * @author      TCSCODER
 * @version     1.0
 */


module.exports = (sequelize, DataTypes) => sequelize.define('bulk_message_user_refs', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    bulk_message_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'bulk_messages',
            key: 'id'
        }
    },
    notification_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'Notifications',
            key: 'id'
        }
    },
    user_id: { type: DataTypes.BIGINT, allowNull: false }
}, {});

  // sequelize will generate and manage createdAt, updatedAt fields
