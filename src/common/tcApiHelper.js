/**
 * Contains generic helper methods for TC API
 */
const _ = require('lodash');
const URI = require('urijs');
const config = require('config');
const request = require('superagent');
const m2mAuth = require('tc-core-library-js').auth.m2m;
const m2m = m2mAuth(config);
const constants = require('../../constants');
const NotificationService = require('../services/NotificationService');
const logger = require('./logger');

/**
 * Get M2M token.
 * @returns {String} the M2M token
 */
function* getM2MToken() {
  return yield m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET);
}

/**
 * Search users by query string.
 * @param {String} query the query string
 * @returns {Array} the matched users
 */
function* searchUsersByQuery(query) {
  const token = yield getM2MToken();
  let users = [];
  // there may be multiple pages, search all pages
  let offset = 0;
  const limit = constants.SEARCH_USERS_PAGE_SIZE;
  // set initial total to 1 so that at least one search is done,
  // it will be updated from search result
  let total = 1;
  while (offset < total) {
    const res = yield request
      .get(`${
        config.TC_API_V3_BASE_URL
        }/members/_search?query=${
        query
        }&offset=${
        offset
        }&limit=${
        limit
        }&fields=userId,email,handle,firstName,lastName,photoURL,status`)
      .set('Authorization', `Bearer ${token}`);
    if (!_.get(res, 'body.result.success')) {
      throw new Error(`Failed to search users by query: ${query}`);
    }
    const records = _.get(res, 'body.result.content') || [];
    // add users
    users = users.concat(records);

    total = _.get(res, 'body.result.metadata.totalCount') || 0;
    offset += limit;
  }

  logger.verbose(`Searched users: ${JSON.stringify(users, null, 4)}`);
  return users;
}

/**
 * Get users by skills.
 * @param {Array} skills the skills
 * @returns {Array} the matched users
 */
function* getUsersBySkills(skills) {
  if (!skills || skills.length === 0) {
    return [];
  }
  // use 'OR' to link the skill matches
  const query = _.map(skills, (skill) => 'profiletrait.skills.name%3D"' + skill.trim() + '"').join(' OR ');
  return yield searchUsersByQuery(query);
}

/**
 * Get users by handles.
 * @param {Array} handles the user handles
 * @returns {Array} the matched users
 */
function* getUsersByHandles(handles) {
  if (!handles || handles.length === 0) {
    return [];
  }
  // use 'OR' to link the handle matches
  const query = _.map(handles, (h) => 'handle:"' + h.trim().replace('"', '\\"')  + '"').join(' OR ');
  return yield searchUsersByQuery(query);
}

/**
 * Send message to bus.
 * @param {Object} data the data to send
 */
function* sendMessageToBus(data) {
  const token = yield getM2MToken();
  yield request
    .post(`${config.TC_API_V5_BASE_URL}/bus/events`)
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
    .catch((err) => {
      const errorDetails = _.get(err, 'message');
      throw new Error(
        'Failed to post event to bus.' +
        (errorDetails ? ' Server response: ' + errorDetails : '')
      );
    });
}

/**
 * Notify user via email.
 * @param {Object} user the user
 * @param {Object} message the Kafka message JSON
 */
function* notifyUserViaEmail(user, message) {
  const notificationType = message.topic;
  const eventType = constants.BUS_API_EVENT.EMAIL.GENERAL;

  const settings = yield NotificationService.getSettings(user.userId);

  // if email notification is explicitly disabled for current notification type do nothing
  // by default we treat all notification types enabled
  if (settings.notifications[notificationType]
    && settings.notifications[notificationType][constants.SETTINGS_EMAIL_SERVICE_ID]
    && settings.notifications[notificationType][constants.SETTINGS_EMAIL_SERVICE_ID].enabled === 'no'
  ) {
    logger.verbose(`Notification '${notificationType}' won't be sent by '${constants.SETTINGS_EMAIL_SERVICE_ID}'`
      + ` service to the userId '${user.userId}' due to his notification settings.`);
    return;
  }

  const userStatus = user.status;
  // don't send email notification for inactive users, ideally we should not have generated
  // notifications for inactive users, however, for now handling it here as safe gaurd
  if (userStatus && constants.ACTIVE_USER_STATUSES.indexOf(userStatus) < 0) {
    logger.error('Notification generated for inactive user, ignoring');
    return;
  }

  let userEmail;
  if (config.ENABLE_DEV_MODE) {
    userEmail = config.DEV_MODE_EMAIL;
  } else {
    userEmail = user.email;
    if (!userEmail) {
      logger.error(`Email not received for user: ${user.userId}`);
      return;
    }
  }
  const recipients = [userEmail];

  const categories = [`${config.ENV}:${eventType}`.toLowerCase()];

  const eventMessage = {
    data: {
      name: user.firstName + ' ' + user.lastName,
      handle: user.handle,
      date: (new Date(message.timestamp)).toISOString(),
      user,
      message,
      type: notificationType,
    },
    recipients,
    version: 'v3',
    from: {
      name: user.handle,
      email: config.DEFAULT_REPLY_EMAIL,
    },
    categories,
  };
  eventMessage.data[eventMessage.data.type] = true;

  // send email message to bus
  yield sendMessageToBus({
    topic: eventType,
    originator: 'tc-notifications',
    timestamp: (new Date()).toISOString(),
    'mime-type': 'application/json',
    payload: eventMessage,
  });
  logger.info(`Successfully sent ${eventType} event with body ${JSON.stringify(eventMessage, null, 4)} to bus api`);
}

/**
 * Get challenge details
 * @param {Number} challengeId the challenge id
 * @returns {Object} the challenge details
 */
function* getChallenge(challengeId) {
  // this is public API, M2M token is not needed
  const url = `${config.TC_API_V4_BASE_URL}/challenges/${challengeId}`;
  logger.info(`calling public challenge api ${url}`);
  const res = yield request.get(url);
  if (!_.get(res, 'body.result.success')) {
    throw new Error(`Failed to get challenge by id ${challengeId}`);
  }
  return _.get(res, 'body.result.content');
}

/**
 * Notify users of message.
 * @param {Array} users the users
 * @param {Object} notification notifcation node
 * @returns {Array} the notifications
 */
function* notifyUsersOfMessage(users, notification) {
  if (!users || users.length === 0) {
    logger.info('No users to notify message.');
    return [];
  }

  const notifications = [];
  // handle each user
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    // construct notification, rest fields are set in consumer.js
    notifications.push({ userId: user.userId, notification });

    /* TODO  Sachin disabled this code
    if (config.ENABLE_EMAILS) {
      // notify user by email, ignore error in order not to block rest processing
      try {
        yield notifyUserViaEmail(user, message);
      } catch (e) {
        logger.error(`Failed to send email to user id: ${user.userId}, handle: ${user.handle}`);
        logger.logFullError(e);
      }
    } */
  }
  logger.info(`Total ${notifications.length} users would be notified.`);
  return notifications;
}

/**
 * Fetch Challenge usersInfo from challenge id.
 * @param {String} challengeId infomix challenge id
 * @returns {Array} the associated user's detail object
 */
function* getUsersInfoFromChallenge(challengeId) {
  const token = yield getM2MToken();
  let usersInfo = [];
  const url = `${config.TC_API_V4_BASE_URL}/challenges/${challengeId}/resources`;
  logger.info(`calling challenge api ${url} `);
  const res = yield request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .catch((err) => {
      const errorDetails = _.get(err, 'message');
      throw new Error(
        `Error in call challenge api by id ${challengeId}` +
        (errorDetails ? ' Server response: ' + errorDetails : '')
      );
    });
  if (!_.get(res, 'body.result.success')) {
    throw new Error(`Failed to get challenge by id ${challengeId}`);
  }
  usersInfo = _.get(res, 'body.result.content');
  logger.info(`Feteched ${usersInfo.length} records from challenge api`);
  return usersInfo;
}

/**
 * Filter associated challenge's user based on criteria
 * @param {Array} usersInfo user object array
 * @param {Array} filterOnRoles on roles
 * @param {Array} filterOnUsers on user's ids
 *
 * @returns {Array} of user object
 */
function filterChallengeUsers(usersInfo, filterOnRoles = [], filterOnUsers = []) {
  const users = []; // filtered users
  const rolesAvailable = []; // available roles in challenge api response
  _.map(usersInfo, (user) => {
    const userId = parseInt(_.get(user, 'properties.External Reference ID'), 10);
    const role = _.get(user, 'role');

    if (_.indexOf(rolesAvailable, role) === -1) {
      rolesAvailable.push(role);
    }

    if (filterOnRoles.length > 0 && _.indexOf(filterOnRoles, role) >= 0) {
      users.push({ userId });
    } else if (filterOnUsers.length > 0 && _.indexOf(filterOnUsers, userId) >= 0) {
      users.push({ userId }); /** Submitter only case */
    } else if (filterOnRoles.length === 0 && filterOnUsers.length === 0) {
      users.push({ userId });
    }
  });
  logger.info(`Total roles available in this challenge are: ${rolesAvailable.join(',')}`);
  return _.uniqBy(users, 'userId');
}

/**
 * modify notification template
 * @param {Object} ruleSet rule
 * @param {Object} data values to be filled
 *
 * @returns {Object} notification node
 */
function* modifyNotificationNode(ruleSet, data) {
  const notification = _.get(ruleSet, 'notification');
  const id = data.id || data.challengeId || 0;
  const name = _.get(data, 'name');

  notification.id = id;

  if (name) {
    notification.name = name;
  } else {
    try {
      const challenge = yield getChallenge(id);
      notification.name = _.get(challenge, 'challengeTitle');
    } catch (error) {
      notification.name = '';
      logger.error(`Error in fetching challenge detail : ${error}`);
    }
  }
  return notification;
}

/**
 * generate header based on v5 specification
 * @param {String} url the api url to fetch
 * @param {Number} perPage the number served in one page
 * @param {Number} currentPage the current page number
 * @param {Number} total the total number of rows/entities
 *
 * @returns {Object} the header response
 */
function generateV5Header({ url, perPage, currentPage, total }) {
  const links = [];
  const fullUrl = `${config.TC_API_BASE_URL}${url}`;
  const generateUrl = (url_, page, rel) => {
    const newUrl = new URI(url_);
    newUrl.setQuery({
      page,
    });
    links.push(`<${newUrl.toString()}>; rel="${rel}"`);
  };

  const totalPages = perPage ? Math.ceil(total / perPage) : 1;
  const headers = {
    'X-Page': currentPage || 1,
    'X-Total': total,
    'X-Total-Pages': totalPages || 1,
  };
  if (perPage) {
    headers['X-Per-Page'] = perPage;
  }

  if (currentPage > 1) {
    headers['X-Prev-Page'] = currentPage - 1;
    generateUrl(fullUrl, currentPage - 1, 'prev');
    generateUrl(fullUrl, 1, 'first');
  }

  if (currentPage < totalPages) {
    headers['X-Next-Page'] = currentPage + 1;

    generateUrl(fullUrl, currentPage + 1, 'next');
    generateUrl(fullUrl, totalPages, 'last');
  }

  headers.Link = links.join(',');

  return headers;
}

module.exports = {
  getM2MToken,
  getUsersBySkills,
  getUsersByHandles,
  sendMessageToBus,
  notifyUserViaEmail,
  getChallenge,
  notifyUsersOfMessage,
  getUsersInfoFromChallenge,
  filterChallengeUsers,
  modifyNotificationNode,
  generateV5Header,
};
