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
  ACTIVE_USER_STATUSES: ['ACTIVE'],

  BUS_API_EVENT: {
    CONNECT: {
      POST: {
        UPDATED: 'connect.notification.project.post.edited',
        CREATED: 'connect.notification.project.post.created',
        DELETED: 'connect.notification.project.post.deleted',
        MENTION: 'connect.notification.project.post.mention',
      },
      MEMBER: {
        JOINED: 'connect.notification.project.member.joined',
        LEFT: 'connect.notification.project.member.left',
        REMOVED: 'connect.notification.project.member.removed',
        MANAGER_JOINED: 'connect.notification.project.member.managerJoined',
        COPILOT_JOINED: 'connect.notification.project.member.copilotJoined',
        ASSIGNED_AS_OWNER: 'connect.notification.project.member.assignedAsOwner',
        INVITE_CREATED: 'connect.notification.project.member.invite.created',
        INVITE_UPDATED: 'connect.notification.project.member.invite.updated',
        INVITE_REQUESTED: 'connect.notification.project.member.invite.requested',
        INVITE_APPROVED: 'connect.notification.project.member.invite.approved',
        INVITE_REJECTED: 'connect.notification.project.member.invite.rejected',
      },
      PROJECT: {
        ACTIVE: 'connect.notification.project.active',
        APPROVED: 'connect.notification.project.approved',
        CANCELED: 'connect.notification.project.canceled',
        COMPLETED: 'connect.notification.project.completed',
        CREATED: 'connect.notification.project.created',
        FILE_UPLOADED: 'connect.notification.project.fileUploaded',
        LINK_CREATED: 'connect.notification.project.linkCreated',
        PAUSED: 'connect.notification.project.paused',
        SUBMITTED_FOR_REVIEW: 'connect.notification.project.submittedForReview',
        SPECIFICATION_MODIFIED: 'connect.notification.project.updated.spec',
      },
      PROJECT_PLAN: {
        READY: 'connect.notification.project.plan.ready',
        MODIFIED: 'connect.notification.project.plan.updated',
        PROGRESS_UPDATED: 'connect.notification.project.updated.progress',
        PHASE_ACTIVATED: 'connect.notification.project.phase.transition.active',
        PHASE_COMPLETED: 'connect.notification.project.phase.transition.completed',
        PHASE_PAYMENT_UPDATED: 'connect.notification.project.phase.update.payment',
        PHASE_PROGRESS_UPDATED: 'connect.notification.project.phase.update.progress',
        PHASE_SCOPE_UPDATED: 'connect.notification.project.phase.update.scope',
        PHASE_PRODUCT_SPEC_UPDATED: 'connect.notification.project.product.update.spec',
        MILESTONE_ACTIVATED: 'connect.notification.project.timeline.milestone.transition.active',
        MILESTONE_COMPLETED: 'connect.notification.project.timeline.milestone.transition.completed',
        WAITING_FOR_CUSTOMER_INPUT: 'connect.notification.project.timeline.milestone.waiting.customer',
        TIMELINE_ADJUSTED: 'connect.notification.project.timeline.adjusted',
      },
      TOPIC: {
        CREATED: 'connect.notification.project.topic.created',
        DELETED: 'connect.notification.project.topic.deleted',
      },
    },
    EMAIL: {
      // TODO: after a proper named email topic is created, this is being used as the email event's topic
      GENERAL: 'connect.notification.email.project.notifications.generic',
      BUNDLED: 'connect.notification.email.project.notifications.bundled',
    },
  },
};
