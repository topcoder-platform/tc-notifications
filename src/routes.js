'use strict';

module.exports = {
  '/': {
    get: {
      controller: 'NotificationController',
      method: 'listNotifications',
    },
  },
  '/:id/read': {
    put: {
      controller: 'NotificationController',
      method: 'markAsRead',
    },
  },
  '/read': {
    put: {
      controller: 'NotificationController',
      method: 'markAllRead',
    },
  },
  '/:id/seen': {
    put: {
      controller: 'NotificationController',
      method: 'markAsSeen',
    },
  },
  '/settings': {
    get: {
      controller: 'NotificationController',
      method: 'getSettings',
    },
    put: {
      controller: 'NotificationController',
      method: 'updateSettings',
    },
  },
  '/health': {
    get: {
      controller: 'HealthController',
      method: 'health',
    },
  },
};
