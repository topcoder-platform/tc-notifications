/**
 * Contains generic helper methods
 */
'use strict';

const _ = require('lodash');
const co = require('co');
const uuid = require('uuid/v4');
const config = require('config');
const authVerifier = require('tc-core-library-js').auth.verifier;


/**
 * Wrap generator function to standard express function
 * @param {Function} fn the generator function
 * @returns {Function} the wrapped function
 */
function wrapExpress(fn) {
  return function (req, res, next) {
    co(fn(req, res, next)).catch(next);
  };
}

/**
 * Wrap all generators from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress(obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress);
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'GeneratorFunction') {
      return wrapExpress(obj);
    }
    return obj;
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value);
  });
  return obj;
}

/**
 * Generate random uuid with timestamp
 * @returns {String} uuid with timestamp
 */
function generateRandomString() {
  return `${uuid()}-${new Date().getTime()}`;
}

/**
 * Check whether user is valid.
 *
 * @param {Object} user the user
 * @returns {boolean} whether it is valid
 */
function isValid(user) {
  return user !== undefined;
}

/**
 * Check whether JWT token is authorized to access the resources.
 *
 * @param {String} token the JWT token
 * @param {Function} callback the callback function
 */
function isTokenAuthorized(token, callback) {
  const secret = _.get(config, 'AUTH_SECRET') || '';
  const validIssuers = JSON.parse(_.get(config, 'VALID_ISSUERS') || '[]');
  const jwtKeyCacheTime = _.get(config, 'JWT_KEY_CACHE_TIME', '24h');
  if (!secret) {
    return callback(new Error('Auth secret not provided'));
  }
  if (!validIssuers || validIssuers.length === 0) {
    return callback(new Error('JWT Issuers not configured'));
  }

  const verifier = authVerifier(validIssuers, jwtKeyCacheTime);
  verifier.validateToken(token, secret, (err, decoded) => {
    if (err) {
      return callback(err);
    }
    const authorized = isValid(decoded);
    return callback(null, authorized, decoded.roles);
  });
}
module.exports = {
  wrapExpress,
  autoWrapExpress,
  generateRandomString,
  isTokenAuthorized,
};
