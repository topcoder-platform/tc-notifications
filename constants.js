module.exports = {
  // set to a small value in order to test pagination functionalities, set to larger value in production
  SEARCH_USERS_PAGE_SIZE: 5,

  SETTINGS_EMAIL_SERVICE_ID: 'email',
  ACTIVE_USER_STATUSES: ['ACTIVE'],

  BUS_API_EVENT: {
    EMAIL: {
      GENERAL: 'notifications.action.email.connect.project.notifications.generic',
    },
  },
};
