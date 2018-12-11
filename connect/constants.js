module.exports = {
  // periods of time in cron format (node-cron)
  SCHEDULED_EVENT_PERIOD: {
    every10minutes: '*/10 * * * *',
    hourly: '0 * * * *',
    daily: '0 7 * * *', // every day at 7am
    everyOtherDay: '0 7 */2 * *', // every other day at 7 am
    weekly: '0 7 * * 6', // every Saturday at 7am
  },

  // email service id for settings
  SETTINGS_EMAIL_SERVICE_ID: 'email',
  SETTINGS_EMAIL_BUNDLING_SERVICE_ID: 'emailBundling',
  ACTIVE_USER_STATUSES: ['ACTIVE'],

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
        SPECIFICATION_MODIFIED: 'connect.action.project.updated.spec',
      },
      PROJECT_PLAN: {
        READY: 'connect.action.project.plan.ready',
        MODIFIED: 'connect.action.project.plan.updated',
        PROGRESS_UPDATED: 'connect.action.project.updated.progress',
        PHASE_ACTIVATED: 'notifications.connect.project.phase.transition.active',
        PHASE_COMPLETED: 'notifications.connect.project.phase.transition.completed',
        PHASE_PAYMENT_UPDATED: 'notifications.connect.project.phase.update.payment',
        PHASE_PROGRESS_UPDATED: 'notifications.connect.project.phase.update.progress',
        PHASE_SCOPE_UPDATED: 'notifications.connect.project.phase.update.scope',
        PHASE_PRODUCT_SPEC_UPDATED: 'connect.action.project.product.update.spec',
        MILESTONE_ACTIVATED: 'connect.action.timeline.milestone.transition.active',
        MILESTONE_COMPLETED: 'connect.action.timeline.milestone.transition.completed',
        WAITING_FOR_CUSTOMER_INPUT: 'connect.action.timeline.milestone.waiting.customer',
        TIMELINE_ADJUSTED: 'connect.action.timeline.adjusted',
      },
      TOPIC: {
        CREATED: 'notifications.connect.project.topic.created',
        DELETED: 'notifications.connect.project.topic.deleted',
      },
    },
    EMAIL: {
      // TODO: after a proper named email topic is created, this is being used as the email event's topic
      GENERAL: 'notifications.action.email.connect.project.notifications.generic',
      BUNDLED: 'notifications.action.email.connect.project.notifications.bundled',
    },
  },
};
