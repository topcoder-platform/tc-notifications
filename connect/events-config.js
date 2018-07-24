/**
 * Configuration of connect events
 */
const config = require('./config');
const { BUS_API_EVENT } = require('./constants');

// project member role names
const PROJECT_ROLE_OWNER = 'owner';
const PROJECT_ROLE_COPILOT = 'copilot';
const PROJECT_ROLE_MANAGER = 'manager';
const PROJECT_ROLE_MEMBER = 'member';

// project member role rules
const PROJECT_ROLE_RULES = {
  [PROJECT_ROLE_OWNER]: { role: 'customer', isPrimary: true },
  [PROJECT_ROLE_COPILOT]: { role: 'copilot' },
  [PROJECT_ROLE_MANAGER]: { role: 'manager' },
  [PROJECT_ROLE_MEMBER]: {},
};

// TopCoder roles
const ROLE_CONNECT_COPILOT = 'Connect Copilot';
const ROLE_CONNECT_MANAGER = 'Connect Manager';
const ROLE_ADMINISTRATOR = 'administrator';

// TopCoder role rules
const TOPCODER_ROLE_RULES = {
  [ROLE_CONNECT_COPILOT]: { id: config.CONNECT_COPILOT_ROLE_ID },
  [ROLE_CONNECT_MANAGER]: { id: config.CONNECT_MANAGER_ROLE_ID },
  [ROLE_ADMINISTRATOR]: { id: config.ADMINISTRATOR_ROLE_ID },
};

/**
 * Supported events configuration
 *
 * Each event configuration object has
 *   type           {String}  [mandatory] Event type
 *   version        {Number}  [optional]  Version of the event.
 *   projectRoles   {Array}   [optional]  List of project member roles which has to get notification
 *   topcoderRoles  {Array}   [optional]  List of TopCoder member roles which has to get notification
 *   toUserHandle   {Boolean} [optional]  If set to true, user defined in `message.userHandle` will get notification
 *   toTopicStarter {Boolean} [optional]  If set to true, than will find who started topic `message.topicId` and
 *                                        send notification to him
 *   exclude        {Object}  [optional]  May contains any rules like `projectRoles`, `toUserHandle` etc
 *                                        but these rules will forbid sending notifications to members who satisfy them
 *
 * @type {Array}
 */
const EVENTS = [
  // Outside project
  {
    template: 'project-created.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.CREATED,
    projectRoles: [PROJECT_ROLE_OWNER],
    exclude: {
      topcoderRoles: [ROLE_CONNECT_MANAGER, ROLE_ADMINISTRATOR],
    },
  }, {
    template: 'project-submitted-for-review.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.SUBMITTED_FOR_REVIEW,
    projectRoles: [PROJECT_ROLE_OWNER],
    topcoderRoles: [ROLE_CONNECT_MANAGER, ROLE_ADMINISTRATOR],
  }, {
    template: 'project-approved.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.APPROVED,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
    topcoderRoles: [ROLE_CONNECT_COPILOT, ROLE_ADMINISTRATOR],
  }, {
    template: 'project-active.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.ACTIVE,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
    topcoderRoles: [ROLE_ADMINISTRATOR],
  }, {
    template: 'project-paused.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.PAUSED,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
    topcoderRoles: [ROLE_ADMINISTRATOR],
  }, {
    template: 'project-completed.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.COMPLETED,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
    topcoderRoles: [ROLE_ADMINISTRATOR],
  }, {
    template: 'project-canceled.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.CANCELED,
    projectRoles: [PROJECT_ROLE_OWNER],
  },

  // User management
  {
    template: 'member-joined.html',
    type: BUS_API_EVENT.CONNECT.MEMBER.JOINED,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
  }, {
    template: 'member-left.html',
    type: BUS_API_EVENT.CONNECT.MEMBER.LEFT,
    version: 2,
    projectRoles: [PROJECT_ROLE_MANAGER],
  }, {
    template: 'member-removed.html',
    type: BUS_API_EVENT.CONNECT.MEMBER.REMOVED,
    version: 2,
    projectRoles: [PROJECT_ROLE_MANAGER],
    toUserHandle: true,
  }, {
    template: 'member-assigned-as-owner.html',
    type: BUS_API_EVENT.CONNECT.MEMBER.ASSIGNED_AS_OWNER,
    version: 2,
    projectRoles: [PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
    toUserHandle: true,
  }, {
    template: 'member-copilot-joined.html',
    type: BUS_API_EVENT.CONNECT.MEMBER.COPILOT_JOINED,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
  }, {
    template: 'member-manager-joined.html',
    type: BUS_API_EVENT.CONNECT.MEMBER.MANAGER_JOINED,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
  },

  // Project activity
  {
    template: 'topic-created.html',
    type: BUS_API_EVENT.CONNECT.TOPIC.CREATED,
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
    toMentionedUsers: true,
  }, {
    template: 'post-created.html',
    type: BUS_API_EVENT.CONNECT.POST.CREATED,
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
    toTopicStarter: true,
    toMentionedUsers: true,
  }, {
    template: 'post-updated.html',
    type: BUS_API_EVENT.CONNECT.POST.UPDATED,
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
    toTopicStarter: true,
    toMentionedUsers: true,
  }, {
    template: 'post-mention.html',
    type: BUS_API_EVENT.CONNECT.POST.MENTION,
  },
  {
    template: 'project-link-created.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.LINK_CREATED,
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
  }, {
    template: 'project-file-uploaded.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.FILE_UPLOADED,
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
  }, {
    template: 'project-specification-modified.html',
    type: BUS_API_EVENT.CONNECT.PROJECT.SPECIFICATION_MODIFIED,
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
  },
];

const EVENT_BUNDLES = {
  TOPICS_AND_POSTS: {
    title: 'New posts and replies',
    types: [
      BUS_API_EVENT.CONNECT.TOPIC.CREATED,
      BUS_API_EVENT.CONNECT.POST.CREATED,
      BUS_API_EVENT.CONNECT.POST.UPDATED,
      BUS_API_EVENT.CONNECT.POST.MENTION,
    ],
  },
  PROJECT_STATUS: {
    title: 'Project status changes',
    types: [
      BUS_API_EVENT.CONNECT.PROJECT.ACTIVE,
      BUS_API_EVENT.CONNECT.PROJECT.APPROVED,
      BUS_API_EVENT.CONNECT.PROJECT.CANCELED,
      BUS_API_EVENT.CONNECT.PROJECT.COMPLETED,
      BUS_API_EVENT.CONNECT.PROJECT.CREATED,
      BUS_API_EVENT.CONNECT.PROJECT.PAUSED,
      BUS_API_EVENT.CONNECT.PROJECT.SUBMITTED_FOR_REVIEW,
    ],
  },
  PROJECT_SPECIFICATION: {
    title: 'Project specification changes',
    types: [
      BUS_API_EVENT.CONNECT.PROJECT.SPECIFICATION_MODIFIED,
    ],
  },
  PROJECT_FILES: {
    title: 'File uploads',
    types: [
      BUS_API_EVENT.CONNECT.PROJECT.FILE_UPLOADED,
    ],
  },
  PROJECT_LINKS: {
    title: 'New project links',
    types: [
      BUS_API_EVENT.CONNECT.PROJECT.LINK_CREATED,
    ],
  },
  PROJECT_TEAM: {
    title: 'Team changes',
    types: [
      BUS_API_EVENT.CONNECT.MEMBER.ASSIGNED_AS_OWNER,
      BUS_API_EVENT.CONNECT.MEMBER.COPILOT_JOINED,
      BUS_API_EVENT.CONNECT.MEMBER.JOINED,
      BUS_API_EVENT.CONNECT.MEMBER.LEFT,
      BUS_API_EVENT.CONNECT.MEMBER.MANAGER_JOINED,
      BUS_API_EVENT.CONNECT.MEMBER.REMOVED,
    ],
  },
};

module.exports = {
  PROJECT_ROLE_RULES,
  TOPCODER_ROLE_RULES,
  EVENTS,
  EVENT_BUNDLES,

  PROJECT_ROLE_OWNER,
  PROJECT_ROLE_COPILOT,
  PROJECT_ROLE_MANAGER,
  PROJECT_ROLE_MEMBER,
};
