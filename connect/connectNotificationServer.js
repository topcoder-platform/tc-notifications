/**
 * This is TopCoder connect notification server.
 */
'use strict';

global.Promise = require('bluebird');

const config = require('./config');
const notificationServer = require('../index');
const _ = require('lodash');
const service = require('./service');
const helpers = require('./helpers');
const { BUS_API_EVENT } = require('./constants');
const EVENTS = require('./events-config').EVENTS;
const PROJECT_ROLE_RULES = require('./events-config').PROJECT_ROLE_RULES;
const PROJECT_ROLE_OWNER = require('./events-config').PROJECT_ROLE_OWNER;
const emailNotificationServiceHandler = require('./notificationServices/email').handler;

/**
 * Get TopCoder members notifications
 *
 * @param  {Object} eventConfig event configuration
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getTopCoderMembersNotifications = (eventConfig) => {
  // if event doesn't have to be notified to topcoder member, just ignore
  if (!eventConfig.topcoderRoles) {
    return Promise.resolve([]);
  }

  const getRoleMembersPromises = eventConfig.topcoderRoles.map(topcoderRole => (
    service.getRoleMembers(topcoderRole)
  ));

  return Promise.all(getRoleMembersPromises).then((membersPerRole) => {
    let notifications = [];

    eventConfig.topcoderRoles.forEach((topcoderRole, roleIndex) => {
      membersPerRole[roleIndex].forEach((memberId) => {
        notifications.push({
          userId: memberId.toString(),
          contents: {
            topcoderRole,
          },
        });
      });
    });

    // only one per userId
    notifications = _.uniqBy(notifications, 'userId');

    return notifications;
  });
};

/**
 * Get notifications for mentioned users
 *
 * @param  {Object} logger object used to log in parent thread
 * @param  {Object} eventConfig event configuration
 * @param  {Object} message content
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getNotificationsForMentionedUser = (logger, eventConfig, content) => {
  if (!eventConfig.toMentionedUsers || !content) {
    return Promise.resolve([]);
  }

  let notifications = [];
  // eslint-disable-next-line
  const regexUserHandle = /title=\"@([a-zA-Z0-9-_.{}\[\]]+)\"|\[.*?\]\(.*?\"\@(.*?)\"\)/g;
  let matches = regexUserHandle.exec(content);
  while (matches) {
    const handle = matches[1] ? matches[1].toString() : matches[2].toString();
    notifications.push({
      userHandle: handle,
      newType: BUS_API_EVENT.CONNECT.POST.MENTION,
      contents: {
        toUserHandle: true,
      },
    });
    matches = regexUserHandle.exec(content);
  }
  // only one per userHandle
  notifications = _.uniqBy(notifications, 'userHandle');

  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
    const handles = _.map(notifications, 'userHandle');
    if (handles.length > 0) {
      service.getUsersByHandle(handles).then((users) => {
        _.forEach(notifications, (notification) => {
          const mentionedUser = _.find(users, { handle: notification.userHandle });
          notification.userId = mentionedUser ? mentionedUser.userId.toString() : notification.userHandle;
        });
        resolve(notifications);
      }).catch((error) => {
        if (logger) {
          logger.error(error);
          logger.info('Unable to send notification to mentioned user')
        }
        //resolves with empty notification which essentially means we are unable to send notification to mentioned user
        resolve([]);
      });
    } else {
      resolve([]);
    }
  });
};

/**
 * Get notifications for users obtained from originator
 *
 * @param  {Object} eventConfig event configuration
 * @param  {String} originator originator userId
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getNotificationsForOriginator = (eventConfig, originator) => {
  // if event doesn't have to be notified to originator, just ignore
  if (!eventConfig.originator) {
    return Promise.resolve([]);
  }

  // if we have to send notification to the originator,
  // but it's not provided in the message, then throw error
  if (!originator) {
    return Promise.reject(new Error('Missing originator in the event message.'));
  }

  return Promise.resolve([{
    userId: originator.toString(),
    contents: {
      originator: true,
    },
  }]);
};

/**
 * Get project members notifications
 *
 * @param  {Object} eventConfig event configuration
 * @param  {Object} project     project details
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getProjectMembersNotifications = (eventConfig, project) => {
  // if event doesn't have to be notified to project member, just ignore
  if (!eventConfig.projectRoles) {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    let notifications = [];
    const projectMembers = _.get(project, 'members', []);

    eventConfig.projectRoles.forEach(projectRole => {
      const roleNotifications = _.filter(projectMembers, PROJECT_ROLE_RULES[projectRole]).map((projectMember) => ({
        userId: projectMember.userId.toString(),
        contents: {
          projectRole,
        },
      }));

      // SPECIAL CASE for project owners
      // if we haven't found any project owner in project members list,
      // then treat any first member with isPrimary flag as an owner and send notification to him
      if (projectRole === PROJECT_ROLE_OWNER && roleNotifications.length < 1) {
        const ownerSubstituteMember = _.find(projectMembers, { isPrimary: true });

        // some member with isPrimary always suppose to exist, but check just in case
        if (ownerSubstituteMember) {
          roleNotifications.push({
            userId: ownerSubstituteMember.userId.toString(),
            contents: {
              projectRole,
            },
          });
        }
      }

      notifications = notifications.concat(roleNotifications);
    });

    // only one per userId
    notifications = _.uniqBy(notifications, 'userId');

    resolve(notifications);
  });
};

/**
 * Get notifications for users obtained from userId
 *
 * @param  {Object} eventConfig event configuration
 * @param  {String} userId  user id
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getNotificationsForUserId = (eventConfig, userId) => {
  // if event doesn't have to be notified to provided userHandle, just ignore
  if (!eventConfig.toUserHandle) {
    return Promise.resolve([]);
  }

  // if we have to send notification to the userHandle,
  // but it's not provided in the message, then throw error
  if (!userId) {
    return Promise.reject(new Error('Missing userId in the event message.'));
  }

  return Promise.resolve([{
    userId: userId.toString(),
    contents: {
      toUserHandle: true,
    },
  }]);
};

/**
 * Get notifications for a user who started topic which was commented
 *
 * @param  {Object} eventConfig event configuration
 * @param  {String} topicId     topic id
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getNotificationsForTopicStarter = (eventConfig, topicId) => {
  // if event doesn't have to be send to a topic starter, then skip
  if (!eventConfig.toTopicStarter) {
    return Promise.resolve([]);
  }

  // if we have to send notification to the topic starter
  // but topicId is not provided in the message, then throw error
  if (!topicId) {
    return Promise.reject(new Error('Missing topicId in the event message.'));
  }

  return service.getTopic(topicId).then((topic) => {
    const userId = topic.userId.toString();

    // special case: if topic created by CoderBot, don't send notification to him
    if (userId === 'CoderBot') {
      return [];
    }

    return [{
      userId,
      contents: {
        toTopicStarter: true,
      },
    }];
  });
};

/**
 * Filter members by project roles
 *
 * @params {Array} List of project roles
 * @params {Array} List of project members
 *
 * @returns {Array} List of objects with user ids
 */
const filterMembersByRoles = (roles, members) => {
  let result = [];

  roles.forEach(projectRole => {
    result = result.concat(
      _.filter(members, PROJECT_ROLE_RULES[projectRole])
        .map(projectMember => ({
          userId: projectMember.userId.toString(),
        }))
    );
  });

  return result;
};

/**
 * Exclude private posts notification
 *
 * @param  {Object} eventConfig event configuration
 * @param  {Object} project     project details
 * @param  {Array}  tags        list of message tags
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getExcludedPrivatePostNotifications = (eventConfig, project, tags) => {
  // skip if message is not private or exclusion rule is not configured
  if (!_.includes(tags, 'MESSAGES') || !eventConfig.privatePostsForProjectRoles) {
    return Promise.resolve([]);
  }

  const members = _.get(project, 'members', []);
  const notifications = filterMembersByRoles(eventConfig.privatePostsForProjectRoles, members);

  return Promise.resolve(notifications);
};

/**
 * Exclude notifications about posts inside draft phases
 *
 * @param  {Object} eventConfig event configuration
 * @param  {Object} project     project details
 * @param  {Array}  tags        list of message tags
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getExcludeDraftPhasesNotifications = (eventConfig, project, tags) => {
  // skip is no exclusion rule is configured
  if (!eventConfig.draftPhasesForProjectRoles) {
    return Promise.resolve([]);
  }

  const phaseId = helpers.extractPhaseId(tags);
  // skip if it is not phase notification
  if (!phaseId) {
    return Promise.resolve([]);
  }

  // exclude all user with configured roles if phase is in draft state
  return service.getPhase(project.id, phaseId)
    .then((phase) => {
      if (phase.status === 'draft') {
        const members = _.get(project, 'members', []);
        const notifications = filterMembersByRoles(eventConfig.draftPhasesForProjectRoles, members);

        return Promise.resolve(notifications);
      }
    });
};

/**
 * Exclude notifications using exclude rules of the event config
 *
 * @param {Object} logger object used to log in parent thread
 * @param {Array}  notifications notifications list
 * @param {Object} eventConfig   event configuration
 * @param {Object} message       message
 * @param {Object} data          any additional data which is retrieved once
 *
 * @returns {Promise} resolves to the list of filtered notifications
 */
const excludeNotifications = (logger, notifications, eventConfig, message, data) => {
  // if there are no rules to exclude notifications, just return all of them untouched
  if (!eventConfig.exclude) {
    return Promise.resolve(notifications);
  }

  const { project } = data;
  // create event config using rules to exclude notifications
  const excludeEventConfig = Object.assign({
    type: eventConfig.type,
  }, eventConfig.exclude);

  // get notifications using rules for exclude notifications
  // and after filter out such notifications from the notifications list
  // TODO move this promise all together with `_.uniqBy` to one function
  //      and reuse it here and in `handler` function
  const tags = _.get(message, 'tags', []);

  return Promise.all([
    getNotificationsForTopicStarter(excludeEventConfig, message.topicId),
    getNotificationsForUserId(excludeEventConfig, message.userId),
    getNotificationsForMentionedUser(logger, excludeEventConfig, message.postContent),
    getProjectMembersNotifications(excludeEventConfig, project),
    getTopCoderMembersNotifications(excludeEventConfig),
    // these are special exclude rules which are only working for excluding notifications but not including
    getExcludedPrivatePostNotifications(excludeEventConfig, project, tags),
    getExcludeDraftPhasesNotifications(excludeEventConfig, project, tags),
  ]).then((notificationsPerSource) => (
    _.uniqBy(_.flatten(notificationsPerSource), 'userId')
  )).then((excludedNotifications) => {
    const excludedUserIds = _.map(excludedNotifications, 'userId');
    const filteredNotifications = notifications.filter((notification) => (
      !_.includes(excludedUserIds, notification.userId)
    ));

    return filteredNotifications;
  });
};

// set configuration for the server, see ../config/default.js for available config parameters
// setConfig should be called before initDatabase and start functions
notificationServer.setConfig({ LOG_LEVEL: 'debug' });

// add topic handlers,
// handler is used build a notification list for a message of a topic,
// it is defined as: function(topic, message, callback),
// the topic is topic name,
// the message is JSON event message,
// logger object used to log in parent thread
// the callback is function(error, userIds), where userIds is an array of user ids to receive notifications
const handler = (topic, message, logger, callback) => {
  logger.debug(topic, 'topic');
  logger.debug(message, 'message');
  const projectId = message.projectId;
  if (!projectId) {
    return callback(new Error('Missing projectId in the event message.'));
  }

  const eventConfig = _.find(EVENTS, { type: topic });
  if (!eventConfig) {
    return callback(new Error(`Event type '${topic}' is not supported.`));
  }

  // filter out `notifications.connect.project.topic.created` events send by bot
  // because they create too much clutter and duplicate info
  const botIds = [config.TCWEBSERVICE_ID, config.CODERBOT_USER_ID];
  if (topic === BUS_API_EVENT.CONNECT.TOPIC.CREATED && botIds.indexOf(message.userId.toString()) !== -1) {
    logger.info(`Ignoring, to avoid noise, Bot topic ${topic}`);
    return callback(null, []);
  }

  // get project details
  service.getProject(projectId).then(project => {
    let allNotifications = [];

    Promise.all([
      // the order in this list defines the priority of notification for the SAME user
      // upper in this list - higher priority
      // NOTE: always add all handles here, they have to check by themselves:
      //       - if they have to handle particular event type or skip it
      //       - check that event has everything required or throw error
      getNotificationsForTopicStarter(eventConfig, message.topicId),
      getNotificationsForUserId(eventConfig, message.userId),
      getNotificationsForOriginator(eventConfig, message.originator),
      getNotificationsForMentionedUser(logger, eventConfig, message.postContent),
      getProjectMembersNotifications(eventConfig, project),
      getTopCoderMembersNotifications(eventConfig),
    ]).then((notificationsPerSource) => {
      // first found notification for one user will be send, the rest ignored
      // NOTE all userId has to be string
      logger.debug('all notifications: ', notificationsPerSource);
      return _.uniqBy(_.flatten(notificationsPerSource), 'userId');
    }).then((notifications) => (
      excludeNotifications(logger, notifications, eventConfig, message, {
        project,
      })
    )).then((notifications) => {
      allNotifications = _.filter(notifications, notification => notification.userId !== `${message.initiatorUserId}`);

      if (eventConfig.includeUsers && message[eventConfig.includeUsers] &&
          message[eventConfig.includeUsers].length > 0) {
        allNotifications = _.filter(allNotifications,
          notification => message[eventConfig.includeUsers].includes(notification.userId));
      }
      logger.debug('filtered notifications: ', allNotifications);
      // now let's retrieve some additional data

      // if message has userId such messages will likely need userHandle and user full name
      // so let's get it
      const ids = [message.initiatorUserId];
      logger.debug(message.userId, 'message.userId');
      if (message.userId) {
        ids.push(message.userId);
      }
      return service.getUsersById(ids);
      // return [];
    }).then((users) => {
      logger.debug(users, 'users');
      _.map(allNotifications, (notification) => {
        notification.version = eventConfig.version;
        notification.contents.projectName = project.name;
        notification.contents.timestamp = (new Date()).toISOString();
        // if found a user then add user handle
        if (users.length) {
          const affectedUser = _.find(users, u => `${u.userId}` === `${message.userId}`);
          const initiatorUser = _.find(users, u => `${u.userId}` === `${message.initiatorUserId}`);
          if (affectedUser) {
            notification.contents.userHandle = affectedUser.handle;
            notification.contents.userFullName = `${affectedUser.firstName} ${affectedUser.lastName}`;
            notification.contents.userEmail = affectedUser.email;
            notification.contents.photoURL = affectedUser.photoURL;
          }
          notification.contents.initiatorUser = initiatorUser;
        }
      });
      callback(null, allNotifications);
    }).catch((err) => {
      callback(err);
    });
  }).catch((err) => {
    callback(err);
  });
};

// init all events
EVENTS.forEach(eventConfig => {
  notificationServer.addTopicHandler(eventConfig.type, handler);
});

// add notification service handlers
if (config.ENABLE_EMAILS) {
  notificationServer.addNotificationServiceHandler(emailNotificationServiceHandler);
}

// init database, it will clear and re-create all tables
// notificationServer
//   .initDatabase()
//   .then(() => notificationServer.startKafkaConsumers())
//   .catch((e) => {
//     console.log(e); // eslint-disable-line no-console
//     notificationServer.logger.error('Notification server errored out');
//   });

// if no need to init database, then directly start the server:
notificationServer.startKafkaConsumers();
