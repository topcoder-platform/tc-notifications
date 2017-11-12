/**
 * Service for notification functinoalities.
 */

'use strict';

const _ = require('lodash');
const Joi = require('joi');
const errors = require('../common/errors');
const models = require('../models');

const DEFAULT_LIMIT = 10;

/**
 * List notifications.
 * @param {Object} query the query parameters
 * @param {Number} userId the user id
 * @returns {Object} the search result
 */
function* listNotifications(query, userId) {
  const filter = { where: { userId }, offset: query.offset, limit: query.limit };
  if (query.type) {
    filter.where.type = query.type;
  }
  if (query.read) {
    filter.where.read = (query.read === 'true');
  }
  const docs = yield models.Notification.findAndCountAll(filter);
  const items = _.map(docs.rows, r => {
    const item = r.toJSON();
    // id and userId are BIGINT in database, sequelize maps them to string values,
    // convert them back to Number values
    item.id = Number(item.id);
    item.userId = Number(item.userId);
    return item;
  });
  return {
    items,
    offset: query.offset,
    limit: query.limit,
    totalCount: docs.count,
  };
}

listNotifications.schema = {
  query: Joi.object().keys({
    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).default(DEFAULT_LIMIT),
    type: Joi.string(),
    // when it is true, return only read notifications
    // when it is false, return only un-read notifications
    // when it is no provided, no read flag filtering
    read: Joi.string().valid('true', 'false'),
  }).required(),
  userId: Joi.number().required(),
};

/**
 * Mark a notification as read.
 * @param {Number} notificationId the notification id
 * @param {Number} userId the user id
 */
function* markAsRead(notificationId, userId) {
  const entity = yield models.Notification.findOne({ where: { id: notificationId, read:false } });
  if (!entity) {
    throw new errors.NotFoundError(`Cannot find Notification where id = ${notificationId}`);
  }
  if (Number(entity.userId) !== userId) {
    throw new errors.ForbiddenError(`Cannot access Notification where id = ${notificationId}`);
  }
  entity.read = true;
  yield entity.save();
}

markAsRead.schema = {
  notificationId: Joi.number().required(),
  userId: Joi.number().required(),
};

/**
 * Mark all notifications as read.
 * @param {Number} userId the user id
 */
function* markAllRead(userId) {
  yield models.Notification.update({ read: true }, { where: { userId, read: false } });
}

markAllRead.schema = {
  userId: Joi.number().required(),
};

/**
 * Get notification settings.
 * @param {Number} userId the user id
 * @returns {Object} the notification settings
 */
function* getSettings(userId) {
  const settings = yield models.NotificationSetting.findAll({ where: { userId } });
  const result = {};
  _.each(settings, (setting) => {
    if (!result[setting.topic]) {
      result[setting.topic] = {};
    }
    result[setting.topic][setting.deliveryMethod] = setting.value;
  });
  return result;
}

getSettings.schema = {
  userId: Joi.number().required(),
};

/**
 * Save notification setting entry. If the entry is not found, it will be created; otherwise it will be updated.
 * @param {Object} entry the notification setting entry
 * @param {Number} userId the user id
 */
function* saveSetting(entry, userId) {
  const setting = yield models.NotificationSetting.findOne({ where: {
    userId, topic: entry.topic, deliveryMethod: entry.deliveryMethod } });
  if (setting) {
    setting.value = entry.value;
    yield setting.save();
  } else {
    yield models.NotificationSetting.create({
      userId,
      topic: entry.topic,
      deliveryMethod: entry.deliveryMethod,
      value: entry.value,
    });
  }
}

/**
 * Update notification settings. Un-specified settings are not changed.
 * @param {Array} data the notification settings data
 * @param {Number} userId the user id
 */
function* updateSettings(data, userId) {
  // there should be no duplicate (topic + deliveryMethod) pairs
  const pairs = {};
  _.each(data, (entry) => {
    const key = `${entry.topic} | ${entry.deliveryMethod}`;
    if (pairs[key]) {
      throw new errors.BadRequestError(`There are duplicate data for topic: ${
        entry.topic}, deliveryMethod: ${entry.deliveryMethod}`);
    }
    pairs[key] = entry;
  });

  // save each entry in parallel
  yield _.map(data, (entry) => saveSetting(entry, userId));
}

updateSettings.schema = {
  data: Joi.array().min(1).items(Joi.object().keys({
    topic: Joi.string().required(),
    deliveryMethod: Joi.string().required(),
    value: Joi.string().required(),
  })).required(),
  userId: Joi.number().required(),
};

// Exports
module.exports = {
  listNotifications,
  markAsRead,
  markAllRead,
  getSettings,
  updateSettings,
};
