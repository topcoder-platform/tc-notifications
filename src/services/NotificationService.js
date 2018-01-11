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

/**
 * List notifications.
 *
 * This method returns only notifications for 'web'
 * Also this method filters notifications by the user and filters out notifications,
 * which user disabled in his settings.
 *
 * @param {Object} query the query parameters
 * @param {Number} userId the user id
 * @returns {Object} the search result
 */
function* listNotifications(query, userId) {
  const settings = yield getSettings(userId);

  const filter = { where: {
    userId,
  }, offset: query.offset, limit: query.limit, order: [['createdAt', 'DESC']] };
  if (_.keys(settings).length > 0) {
    // only filter out notifications types which were explicitly set to 'no' - so we return notification by default
    const notificationTypes = _.keys(settings).filter((notificationType) => settings[notificationType].web !== 'no');
    filter.where.type = { $in: notificationTypes };
  }
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
 * Mark notification(s) as read.
 * @param {Number} id the notification id or '-' separated ids
 * @param {Number} userId the user id
 */
function* markAsRead(id, userId) {
  const ids = _.map(id.split('-'), (str) => {
    const idInt = Number(str);
    if (!_.isInteger(idInt)) {
      throw new errors.BadRequestError(`Notification id should be integer: ${str}`);
    }
    return idInt;
  });
  const entities = yield models.Notification.findAll({ where: { id: { $in: ids }, read: false } });
  if (!entities || entities.length === 0) {
    throw new errors.NotFoundError(`Cannot find un-read Notification where id = ${id}`);
  }
  _.each(entities, (entity) => {
    if (Number(entity.userId) !== userId) {
      throw new errors.ForbiddenError(`Cannot access Notification where id = ${entity.id}`);
    }
  });
  yield models.Notification.update({ read: true }, { where: { id: { $in: ids }, read: false } });
}

markAsRead.schema = {
  id: Joi.string().required(),
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
