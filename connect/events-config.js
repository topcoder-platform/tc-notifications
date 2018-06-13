/**
 * Configuration of connect events
 */
const config = require('./config');

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
    type: 'notifications.connect.project.created',
    projectRoles: [PROJECT_ROLE_OWNER],
    exclude: {
      topcoderRoles: [ROLE_CONNECT_MANAGER, ROLE_ADMINISTRATOR],
    },
  }, {
    type: 'notifications.connect.project.submittedForReview',
    projectRoles: [PROJECT_ROLE_OWNER],
    topcoderRoles: [ROLE_CONNECT_MANAGER, ROLE_ADMINISTRATOR],
  }, {
    type: 'notifications.connect.project.approved',
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
    topcoderRoles: [ROLE_CONNECT_COPILOT, ROLE_ADMINISTRATOR],
  }, {
    type: 'notifications.connect.project.active',
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
    topcoderRoles: [ROLE_ADMINISTRATOR],
  }, {
    type: 'notifications.connect.project.paused',
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
    topcoderRoles: [ROLE_ADMINISTRATOR],
  }, {
    type: 'notifications.connect.project.completed',
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
    topcoderRoles: [ROLE_ADMINISTRATOR],
  }, {
    type: 'notifications.connect.project.canceled',
    projectRoles: [PROJECT_ROLE_OWNER],
  },

  // User management
  {
    type: 'notifications.connect.project.member.joined',
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
  }, {
    type: 'notifications.connect.project.member.left',
    version: 2,
    projectRoles: [PROJECT_ROLE_MANAGER],
  }, {
    type: 'notifications.connect.project.member.removed',
    version: 2,
    projectRoles: [PROJECT_ROLE_MANAGER],
    toUserHandle: true,
  }, {
    type: 'notifications.connect.project.member.assignedAsOwner',
    version: 2,
    projectRoles: [PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
    toUserHandle: true,
  }, {
    type: 'notifications.connect.project.member.copilotJoined',
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
  }, {
    type: 'notifications.connect.project.member.managerJoined',
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER],
  },

  // Project activity
  {
    type: 'notifications.connect.project.topic.created',
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
    toMentionedUsers: true,
  }, {
    type: 'notifications.connect.project.post.created',
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
    toTopicStarter: true,
    toMentionedUsers: true,
  }, {
    type: 'notifications.connect.project.post.edited',
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
    toTopicStarter: true,
    toMentionedUsers: true,
  }, {
    type: 'notifications.connect.project.post.mention',
  },
  {
    type: 'notifications.connect.project.linkCreated',
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
  }, {
    type: 'notifications.connect.project.fileUploaded',
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
  }, {
    type: 'notifications.connect.project.specificationModified',
    version: 2,
    projectRoles: [PROJECT_ROLE_OWNER, PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER, PROJECT_ROLE_MEMBER],
  },
];

module.exports = {
  PROJECT_ROLE_RULES,
  TOPCODER_ROLE_RULES,
  EVENTS,

  PROJECT_ROLE_OWNER,
  PROJECT_ROLE_COPILOT,
  PROJECT_ROLE_MANAGER,
  PROJECT_ROLE_MEMBER,
};
