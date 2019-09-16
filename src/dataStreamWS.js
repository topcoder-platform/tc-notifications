/**
 * Web socket support
 */

const _ = require('lodash');
const logger = require('./common/logger');
const helper = require('./common/helper');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const config = require('config');

const allWS = [];
const allMessages = [];
const maxMsgCount = Number(config.MAX_MESSAGE_COUNT);

// send data to client via web socket
function sendData(ws, payload) {
  try {
    ws.send(JSON.stringify(payload));
  } catch (e) {
    logger.logFullError(e);
  }
}

function setup(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    logger.debug('web socket connected');
    const id = helper.generateRandomString();
    const clientData = { id, ws, authorized: false };
    allWS.push(clientData);

    ws.on('message', (message) => {
      logger.debug(`web socket message: ${message}`);
      if (message.startsWith('token:')) {
        const token = message.substring('token:'.length);
        helper.isTokenAuthorized(token, (err, isAuthorized) => {
          if (err) {
            logger.logFullError(err);
            sendData(ws, { type: 'auth', message: 'failed to authorize token' });
          } else if (isAuthorized) {
            clientData.authorized = true;
            sendData(ws, { type: 'auth', message: 'authorized' });
          }
        });
        return;
      }
    });

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
    ws.on('error', (e) => {
      logger.logFullError('there is error for the web socket', e);
      terminateWS();
    });
  });

  wss.on('error', (e) => {
    logger.logFullError('there is error for the web socket server', e);
  });
}

/**
 * Send message to all applicable web socket clients. The message will be cached to be retrieved by clients.
 */
function sendMessage(message) {
  // cache message
  allMessages.push(message);
  if (allMessages.length > maxMsgCount) {
    allMessages.shift();
  }

  // send message to clients
  _.each(allWS, (clientData) => {
    if (clientData.authorized) {
      sendData(clientData.ws, message);
    }
  });
}

module.exports = {
  setup,
  sendMessage,
};
