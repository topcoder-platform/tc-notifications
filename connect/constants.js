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
      POST: {
        UPDATED: 'notifications.connect.project.post.edited',
        CREATED: 'notifications.connect.project.post.created',
        DELETED: 'notifications.connect.project.post.deleted',
        MENTION: 'notifications.connect.project.post.mention',
      },
      MEMBER: {
        JOINED: 'notifications.connect.project.member.joined',
        LEFT: 'notifications.connect.project.member.left',
        REMOVED: 'notifications.connect.project.member.removed',
        MANAGER_JOINED: 'notifications.connect.project.member.managerJoined',
        COPILOT_JOINED: 'notifications.connect.project.member.copilotJoined',
        ASSIGNED_AS_OWNER: 'notifications.connect.project.member.assignedAsOwner',
      },
      PROJECT: {
        ACTIVE: 'notifications.connect.project.active',
        APPROVED: 'notifications.connect.project.approved',
        CANCELED: 'notifications.connect.project.canceled',
        COMPLETED: 'notifications.connect.project.completed',
        CREATED: 'notifications.connect.project.created',
        FILE_UPLOADED: 'notifications.connect.project.fileUploaded',
        LINK_CREATED: 'notifications.connect.project.linkCreated',
        PAUSED: 'notifications.connect.project.paused',
        SUBMITTED_FOR_REVIEW: 'notifications.connect.project.submittedForReview',
        SPECIFICATION_MODIFIED: 'notifications.connect.project.specificationModified',
      },
      TOPIC: {
        CREATED: 'notifications.connect.project.topic.created',
        DELETED: 'notifications.connect.project.topic.deleted',
      },
    },
    EMAIL: {
      // TODO: after a proper named email topic is created, this is being used as the email event's topic
      GENERAL: 'notifications.action.email.connect.project.specificationModified',
      // this is only used as a schedulerId when creating scheduled data for bundled emails
      BUNDLED: 'notifications.action.email.connect.project.bundled',
    },
  },
};
