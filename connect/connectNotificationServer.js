/**
 * This is TopCoder connect notification server.
 */
'use strict';

global.Promise = require('bluebird');

const notificationServer = require('../index');
const _ = require('lodash');
const service = require('./service');
const EVENTS = require('./events-config').EVENTS;
const TOPCODER_ROLE_RULES = require('./events-config').TOPCODER_ROLE_RULES;
const PROJECT_ROLE_RULES = require('./events-config').PROJECT_ROLE_RULES;

/**
 * Get TopCoder members notifications
 *
 * @param  {Object} eventConfig event configuration
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getTopCoderMembersNotifications = (eventConfig) => {
  if (!eventConfig.topcoderRoles) {
    return Promise.resolve([]);
  }

  const getRoleMembersPromises = eventConfig.topcoderRoles.map(topcoderRole => (
    service.getRoleMembers(TOPCODER_ROLE_RULES[topcoderRole].id)
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
 * Get project members notifications
 *
 * @param  {Object} eventConfig event configuration
 * @param  {Object} project     project details
 *
 * @return {Promise}            resolves to a list of notifications
 */
const getProjectMembersNotifications = (eventConfig, project) => (
  new Promise((resolve) => {
    let notifications = [];
    const projectMembers = _.get(project, 'members', []);

    eventConfig.projectRoles.forEach(projectRole => {
      notifications = notifications.concat(
        _.filter(projectMembers, PROJECT_ROLE_RULES[projectRole]).map((projectMember) => ({
          userId: projectMember.userId.toString(),
          contents: {
            projectRole,
          },
        }))
      );
    });

    // only one per userId
    notifications = _.uniqBy(notifications, 'userId');

    resolve(notifications);
  })
);

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
    userId,
    contents: {
      toUserHandle: true,
    },
  }]);
};

// set configuration for the server, see ../config/default.js for available config parameters
// setConfig should be called before initDatabase and start functions
notificationServer.setConfig({ LOG_LEVEL: 'debug' });

// add topic handlers,
// handler is used build a notification list for a message of a topic,
// it is defined as: function(topic, message, callback),
// the topic is topic name,
// the message is JSON event message,
// the callback is function(error, userIds), where userIds is an array of user ids to receive notifications
const handler = (topic, message, callback) => {
  const projectId = message.projectId;
  if (!projectId) {
    return callback(new Error('Missing projectId in the event message.'));
  }

  const eventConfig = _.find(EVENTS, { type: topic });
  if (!eventConfig) {
    return callback(new Error(`Event type '${topic}' is not supported.`));
  }


  service.getProject(projectId).then(project => {
    // the order in this list defines the priority of notification for the same user
    // upper in this list - higher priority
    const promises = [];
    let allNotifications = [];
    if (message.userId) promises.push(getNotificationsForUserId(eventConfig, message.userId));
    promises.push(getProjectMembersNotifications(eventConfig, project));
    promises.push(getTopCoderMembersNotifications(eventConfig));
    Promise.all(promises
     ).then((notificationsPerSource) => (
      // first found notification for one user will be send, the rest ignored
      _.uniqBy(_.flatten(notificationsPerSource), 'userId')
    )).then((notifications) => {
      allNotifications = notifications;

      if (message.userId) {
        const ids = [message.userId];
        return service.getUsersById(ids);
      }
      return [];
    }).then((users) => {
      _.map(allNotifications, (notification) => {
        notification.projectName = project.name;
        notification.contents.userHandle = users[0].handle;
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

// init database, it will clear and re-create all tables
notificationServer
  .initDatabase()
  .then(() => notificationServer.start())
  .catch((e) => console.log(e)); // eslint-disable-line no-console

// if no need to init database, then directly start the server:
// notificationServer.start();
