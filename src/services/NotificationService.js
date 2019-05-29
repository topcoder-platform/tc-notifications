/**
 * Service for notification functinoalities.
 */

'use strict';

const _ = require('lodash');
const Joi = require('joi');
const errors = require('../common/errors');
const logger = require('../common/logger');
const models = require('../models');

const DEFAULT_LIMIT = 10;

/**
 * Get notification settings.
 * @param {Number} userId the user id
 * @returns {Object} the notification settings
 */
function* getSettings(userId) {
  const notificationSettings = yield models.NotificationSetting.findAll({ where: { userId } });
  const serviceSettings = yield models.ServiceSettings.findAll({ where: { userId } });

  // format settings per notification type
  const notifications = {};
  _.each(notificationSettings, (setting) => {
    if (!notifications[setting.topic]) {
      notifications[setting.topic] = {};
    }
    if (!notifications[setting.topic][setting.serviceId]) {
      notifications[setting.topic][setting.serviceId] = {};
    }
    notifications[setting.topic][setting.serviceId][setting.name] = setting.value;
  });

  // format settings per service
  const services = {};
  _.each(serviceSettings, (setting) => {
    if (!services[setting.serviceId]) {
      services[setting.serviceId] = {};
    }
    services[setting.serviceId][setting.name] = setting.value;
  });
  return {
    notifications,
    services,
  };
}

getSettings.schema = {
  userId: Joi.number().required(),
};

/**
 * Save notification setting entry. If the entry is not found, it will be created; otherwise it will be updated.
 * @param {Object} entry the notification setting entry
 * @param {Number} userId the user id
 */
function* saveNotificationSetting(entry, userId) {
  const setting = yield models.NotificationSetting.findOne({ where: {
    userId, topic: entry.topic, serviceId: entry.serviceId, name: entry.name } });
  if (setting) {
    setting.value = entry.value;
    yield setting.save();
  } else {
    yield models.NotificationSetting.create({
      userId,
      topic: entry.topic,
      serviceId: entry.serviceId,
      name: entry.name,
      value: entry.value,
    });
  }
}

/**
 * Save service setting entry. If the entry is not found, it will be created; otherwise it will be updated.
 * @param {Object} entry the service setting entry
 * @param {Number} userId the user id
 */
function* saveServiceSetting(entry, userId) {
  const setting = yield models.ServiceSettings.findOne({ where: {
    userId, serviceId: entry.serviceId, name: entry.name } });
  if (setting) {
    setting.value = entry.value;
    yield setting.save();
  } else {
    yield models.ServiceSettings.create({
      userId,
      serviceId: entry.serviceId,
      name: entry.name,
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
  // convert notification settings object to the list of entries
  const notifications = [];
  _.forOwn(data.notifications, (notification, topic) => {
    _.forOwn(notification, (serviceSettings, serviceId) => {
      _.forOwn(serviceSettings, (value, name) => {
        notifications.push({
          topic,
          serviceId,
          name,
          value,
        });
      });
    });
  });

  // validation
  // there should be no duplicate (topic + serviceId + name)
  const triples = {};
  notifications.forEach((entry) => {
    const key = `${entry.topic} | ${entry.serviceId} | ${entry.name}`;
    if (triples[key]) {
      throw new errors.BadRequestError(`There are duplicate data for topic: ${
        entry.topic}, serviceId: ${entry.serviceId}, name: ${entry.name}`);
    }
    triples[key] = entry;
  });

  // save each entry in parallel
  yield _.map(notifications, (entry) => saveNotificationSetting(entry, userId));

  // convert services settings object the the list of entries
  const services = [];
  _.forOwn(data.services, (service, serviceId) => {
    _.forOwn(service, (value, name) => {
      services.push({
        serviceId,
        name,
        value,
      });
    });
  });

  // validation
  // there should be no duplicate (serviceId + name)
  const paris = {};
  services.forEach((entry) => {
    const key = `${entry.serviceId} | ${entry.name}`;
    if (paris[key]) {
      throw new errors.BadRequestError('There are duplicate data for'
        + ` serviceId: ${entry.serviceId}, name: ${entry.name}`);
    }
    paris[key] = entry;
  });

  yield _.map(services, (entry) => saveServiceSetting(entry, userId));
}

updateSettings.schema = {
  data: Joi.object().keys({
    notifications: Joi.object(),
    services: Joi.object(),
  }).required(),
  userId: Joi.number().required(),
};

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
  const notificationSettings = settings.notifications;
  const limit = query.limit || query.per_page;
  const offset = (query.page - 1) * limit;
  const filter = { where: {
    userId,
  }, offset, limit, order: [['createdAt', 'DESC']] };
  if (query.platform) {
    filter.where.type = { $like: `notifications\.${query.platform}\.%` };
  }
  if (_.keys(notificationSettings).length > 0) {
    // only filter out notifications types which were explicitly set to 'no' - so we return notification by default
    const notifications = _.keys(notificationSettings).filter((notificationType) =>
      !notificationSettings[notificationType] &&
      !notificationSettings[notificationType].web &&
      notificationSettings[notificationType].web.enabled === 'no'
    );
    filter.where.type = Object.assign(filter.where.type || {}, { $notIn: notifications });
  }
  if (query.type) {
    filter.where.type = Object.assign(filter.where.type || {}, { $eq: query.type });
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
    perPage: limit,
    currentPage: query.page,
    total: docs.count,
  };
}

listNotifications.schema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    per_page: Joi.number().integer().min(1).default(DEFAULT_LIMIT),
    // supporting limit field temporarily
    limit: Joi.number().integer().min(1),
    type: Joi.string(),
    platform: Joi.string(),
    // when it is true, return only read notifications
    // when it is false, return only un-read notifications
    // when it is no provided, no read flag filtering
    read: Joi.string().valid('true', 'false'),
  }).required(),
  userId: Joi.number().required(),
};

/**
 * Update notification.
 *
 * Update notification based on notification id
 *
 * @param {Number} userId the user id
 * @param {Number} notificationId the notification id
 * @param {Object} payload the update notification payload
 * @returns {Object} the updated notification
 */
function* updateNotification(userId, notificationId, payload) {
  if (payload.read === false) {
    throw new errors.ValidationError('Cannot set notification to be unread');
  }
  if (payload.seen === false) {
    throw new errors.ValidationError('Cannot set notification to be unseen');
  }

  const entity = yield models.Notification.findOne({ where: { id: Number(notificationId) } });
  if (!entity) {
    throw new errors.NotFoundError(`Cannot find Notification where id = ${notificationId}`);
  }
  if (Number(entity.userId) !== userId) {
    throw new errors.ForbiddenError(`Cannot access Notification where id = ${entity.id}`);
  }
  yield models.Notification.update(payload, { where: { id: Number(notificationId), userId: Number(userId) } });

  return Object.assign(entity, payload);
}

updateNotification.schema = {
  userId: Joi.number().required(),
  notificationId: Joi.number().required(),
  payload: Joi.object().keys({
    read: Joi.boolean(),
    seen: Joi.boolean(),
  }),
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

/**
 * Mark notification(s) as seen.
 * @param {Number} id the notification id or '-' separated ids
 * @param {Number} userId the user id
 */
function* markAsSeen(id, userId) {
  const ids = _.map(id.split('-'), (str) => {
    const idInt = Number(str);
    if (!_.isInteger(idInt)) {
      throw new errors.BadRequestError(`Notification id should be integer: ${str}`);
    }
    return idInt;
  });
  const entities = yield models.Notification.findAll({ where: { id: { $in: ids }, seen: { $not: true } } });
  if (!entities || entities.length === 0) {
    throw new errors.NotFoundError(`Cannot find un-seen Notification where id = ${id}`);
  }
  _.each(entities, (entity) => {
    if (Number(entity.userId) !== userId) {
      throw new errors.ForbiddenError(`Cannot access Notification where id = ${entity.id}`);
    }
  });
  yield models.Notification.update({ seen: true }, { where: { id: { $in: ids }, seen: { $not: true } } });
}

markAsSeen.schema = {
  id: Joi.string().required(),
  userId: Joi.number().required(),
};

// Exports
module.exports = {
  listNotifications,
  markAsRead,
  markAllRead,
  markAsSeen,
  getSettings,
  updateSettings,
  updateNotification,
};

logger.buildService(module.exports);
