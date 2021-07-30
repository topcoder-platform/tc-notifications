module.exports = {
  // set to a small value in order to test pagination functionalities, set to larger value in production
  SEARCH_USERS_PAGE_SIZE: 5,

  SETTINGS_EMAIL_SERVICE_ID: 'email',
  SETTINGS_WEB_SERVICE_ID: 'web',
  SETTINGS_SLACK_SERVICE_ID: 'slack',
  ACTIVE_USER_STATUSES: ['ACTIVE'],

  BUS_API_EVENT: {
    EMAIL: {
      GENERAL: 'connect.notification.email.project.notifications.generic',
      UNIVERSAL: 'external.action.email',
    },
  },
};
