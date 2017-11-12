'use strict';

module.exports = {
  '/notifications': {
    get: {
      controller: 'NotificationController',
      method: 'listNotifications',
    },
  },
  '/notifications/:id/read': {
    put: {
      controller: 'NotificationController',
      method: 'markAsRead',
    },
  },
  '/notifications/read': {
    put: {
      controller: 'NotificationController',
      method: 'markAllRead',
    },
  },
  '/notificationsettings': {
    get: {
      controller: 'NotificationController',
      method: 'getSettings',
    },
    put: {
      controller: 'NotificationController',
      method: 'updateSettings',
    },
  },
};
