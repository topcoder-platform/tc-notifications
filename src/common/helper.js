/**
 * Contains generic helper methods
 */
'use strict';

const _ = require('lodash');
const co = require('co');

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
 * Helper method to clean up the provided email address for deducing the final address that matters for
 * the delivery of the email i.e. removing any non standard parts in the email address e.g. getting rid
 * of anything after + sign in the local part of the email.
 *
 * @param {String} email email address to be sanitized
 *
 * @returns {String} sanitized email
 */
function sanitizeEmail(email) {
  if (email) {
    return email.substring(0, email.indexOf('+') !== -1 ? email.indexOf('+') : email.indexOf('@'))
    + email.substring(email.indexOf('@'));
  }
  return '';
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  sanitizeEmail,
};
