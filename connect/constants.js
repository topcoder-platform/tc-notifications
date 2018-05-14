module.exports = {
  // periods of time in cron format (node-cron)
  SCHEDULED_EVENT_PERIOD: {
    every10minutes: '*/10 * * * *',
    hourly: '0 * * * *',
    daily: '0 7 * * *', // every day at 7am
    weekly: '0 7 * * 6', // every Saturday at 7am
  },

  // email service id for settings
  SETTINGS_EMAIL_SERVICE_ID: 'email',

  BUS_API_EVENT: {
    CONNECT: {
      TOPIC_CREATED: 'notifications.connect.project.topic.created',
      TOPIC_DELETED: 'notifications.connect.project.topic.deleted',
      POST_CREATED: 'notifications.connect.project.post.created',
      POST_UPDATED: 'notifications.connect.project.post.edited',
      POST_DELETED: 'notifications.connect.project.post.deleted',
      MENTIONED_IN_POST: 'notifications.connect.project.post.mention',
    },
    EMAIL: {
      TOPIC_CREATED: 'notifications.action.email.connect.project.topic.created',
      POST_CREATED: 'notifications.action.email.connect.project.post.created',
      MENTIONED_IN_POST: 'notifications.action.email.connect.project.post.mention',
      BUNDLED: 'notifications.action.email.connect.project.bundled',
    },
  },
};
