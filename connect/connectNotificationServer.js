/**
 * This is TopCoder connect notification server.
 */
'use strict';

const notificationServer = require('../index');
const request = require('superagent');
const _ = require('lodash');
const config = require('./config');

// set configuration for the server, see ../config/default.js for available config parameters
// setConfig should be called before initDatabase and start functions
notificationServer.setConfig({ LOG_LEVEL: 'debug' });

// add topic handlers,
// handler is used to find user ids that should receive notifications for a message of a topic,
// it is defined as: function(topic, message, callback),
// the topic is topic name,
// the message is JSON event message,
// the callback is function(error, userIds), where userIds is an array of user ids to receive notifications
const handler = (topic, message, callback) => {
  const projectId = message.projectId;
  if (!projectId) {
    return callback(new Error('Missing projectId in the event message'));
  }

  // get project details
  request
    .get(`${config.TC_API_BASE_URL}/projects/${projectId}`)
    .set('accept', 'application/json')
    .set('authorization', `Bearer ${config.TC_ADMIN_TOKEN}`)
    .end((err, res) => {
      if (err) {
        return callback(err);
      }
      if (!_.get(res, 'body.result.success')) {
        return callback(new Error(`Failed to get project details of project id: ${projectId}`));
      }
      // return member user ids
      callback(null, _.map(_.get(res, 'body.result.content.members', []), (member) => member.userId));
    });
};

notificationServer.addTopicHandler('notifications.connect.project.created', handler);
notificationServer.addTopicHandler('notifications.connect.project.updated', handler);
notificationServer.addTopicHandler('notifications.connect.message.posted', handler);
notificationServer.addTopicHandler('notifications.connect.message.edited', handler);
notificationServer.addTopicHandler('notifications.connect.message.deleted', handler);
notificationServer.addTopicHandler('notifications.connect.project.submittedForReview', handler);

// init database, it will clear and re-create all tables
notificationServer
  .initDatabase()
  .then(() => notificationServer.start())
  .catch((e) => console.log(e)); // eslint-disable-line no-console

// if no need to init database, then directly start the server:
// notificationServer.start();
