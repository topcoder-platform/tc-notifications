/**
 * Data stream web socket functionalities.
 */
'use strict';

const _ = require('lodash');
const logger = require('./common/logger');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const helper = require('./common/helper');
const config = require('config');

// all web socket client data
const allWS = [];

// all cached messages, key is topic, value is array of messages of the topic with roles associated
const allMessages = {};

/**
 * Send object to websocket client
 *
 * @param {Object} ws object contains client information
 * @param {Object} payload object to send client
 */
const sendData = (ws, payload) => {
  try {
    ws.send(JSON.stringify(payload));
  } catch (err) {
    logger.error(err);
  }
};

/**
 * Compare two roles array to check if there is a shared role
 *
 * @param {Array} firstRoles first role array to compare
 * @param {Array} secondRoles second role array to compare
 * @returns {boolean} true if they have at least one common role
 */
function hasCommonRole(firstRoles, secondRoles) {
  return firstRoles.some((el) => secondRoles.indexOf(el) > -1);
}

/**
 * Setup web socket.
 * 
 */
const setup = (server) => {
  const wss = new WebSocketServer({server});
  wss.on('connection', (ws) => {
    logger.debug('web socket connected');
    const id = helper.generateRandomString();
    const clientData = {
      id,
      ws,
      authorized: false,
      roles: [],
      userId: null,
    };
    allWS.push(clientData);

    // got message from client,
    // the message is 'token:{JWT-token}' or string representation of JSON containing fields: topic and count,
    // where count is the last count of messages of the topic to retrieve
    ws.on('message', (message) => {
      // handle token
      if (message.startsWith('token:')) {
        logger.debug(`web socket message: ${message.substring(0, 10)}*********`);
        const token = message.substring('token:'.length);
        helper.isTokenAuthorized(token, (err, isAuthorized, decoded) => {
          if (err) {
            logger.error('failed to authorize token', err);
          } else if (isAuthorized) {
            logger.debug(`web socket authorized with roles: ${decoded.roles}`);
            clientData.authorized = true;
            clientData.roles = decoded.roles;
            clientData.userId = decoded.userId;
          }
        });
        return;
      }
      logger.debug(`web socket message: ${message}`);
      let msgJSON;
      try {
        msgJSON = JSON.parse(message);
      } catch (err) {
        logger.error('invalid message', message, err);
        return;
      }
      
    });

    // terminate web socket
    const terminateWS = () => {
      if (clientData.terminated) {
        return;
      }
      clientData.terminated = true;

      for (let i = 0; i < allWS.length; i += 1) {
        if (id === allWS[i].id) {
          // remove the current client data
          allWS.splice(i, 1);
          break;
        }
      }
      ws.close();
    };

    // close event handler
    ws.on('close', () => {
      logger.debug('web socket closed');
      terminateWS();
    });

    // error event handler
    ws.on('error', (err) => {
      logger.error('there is error for the web socket', err);
      terminateWS();
    });
  });

  wss.on('error', (err) => {
    logger.error('there is error for the web socket server', err);
  });
};


/**
 * Send notifications to all applicable web socket clients. The notifications will be cached to be retrieved by clients.
 *
 * @param {String} topic notification topic
 * @param {Array} notifications array of notifications to push
 * @returns {Object} handlerRuleSets ruleset of handler to check roles
 */
function* pushNotifications(topic, notifications, handlerRuleSets) {
  // send notifications to clients
  _.each(allWS, (clientData) => {
    // Check the auth and role for each notification since there are more then one handler
    // Each handler might have different role sets
    if (clientData.authorized) {
      _.map(notifications, (n) => {
        if ( clientData.userId == n.userId ) {
          sendData(clientData.ws, { full: false, topic, messages: [notifications] });
        }
      });
    }
  });
}

module.exports = {
  setup,
  pushNotifications,
};
