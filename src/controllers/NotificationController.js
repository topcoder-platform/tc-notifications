/**
 * Contains endpoints related to notification functionalities.
 */
'use strict';

const NotificationService = require('../services/NotificationService');
const tcApiHelper = require('../common/tcApiHelper');

/**
 * List notifications.
 * @param req the request
 * @param res the response
 */
function* listNotifications(req, res) {
  const {
    items,
    perPage,
    currentPage,
    total,
  } = yield NotificationService.listNotifications(req.query, req.user.userId);

  const headers = tcApiHelper.generateV5Header({
    url: req.originalUrl,
    perPage,
    currentPage,
    total,
  });

  res.set(headers);
  res.json(items);
}

function* updateNotification(req, res) {
  res.json(yield NotificationService.updateNotification(req.user.userId, req.params.id, req.body));
}

/**
 * Mark a notification as read.
 * @param req the request
 * @param res the response
 */
function* markAsRead(req, res) {
  yield NotificationService.markAsRead(req.params.id, req.user.userId);
  res.end();
}

/**
 * Mark all notifications as read.
 * @param req the request
 * @param res the response
 */
function* markAllRead(req, res) {
  yield NotificationService.markAllRead(req.user.userId);
  res.end();
}

/**
 * Mark a notification as seen.
 * @param req the request
 * @param res the response
 */
function* markAsSeen(req, res) {
  yield NotificationService.markAsSeen(req.params.id, req.user.userId);
  res.end();
}

/**
 * Get notification settings.
 * @param req the request
 * @param res the response
 */
function* getSettings(req, res) {
  res.json(yield NotificationService.getSettings(req.user.userId));
}

/**
 * Update notification settings.
 * @param req the request
 * @param res the response
 */
function* updateSettings(req, res) {
  yield NotificationService.updateSettings(req.body, req.user.userId);
  res.end();
}

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
