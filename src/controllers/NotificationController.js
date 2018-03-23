/**
 * Contains endpoints related to notification functionalities.
 */
'use strict';

const NotificationService = require('../services/NotificationService');

/**
 * List notifications.
 * @param req the request
 * @param res the response
 */
function* listNotifications(req, res) {
  res.json(yield NotificationService.listNotifications(req.query, req.user.userId));
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
};
