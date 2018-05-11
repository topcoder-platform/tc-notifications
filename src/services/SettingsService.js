/**
 * Settings service
 * to be used by other modules
 */
const _ = require('lodash');
const models = require('../models');

/**
 * Get particular service settings option
 *
 * @param {Object} options defined which settings option to get
 *
 * @return {Promise} resolves to settings option
 */
function getServiceSettingsOption(options) {
  // get only defined supported params
  const where = _.omitBy(
    _.pick(options, [
      'userId',
      'serviceId',
      'name',
    ]),
    _.isUndefined
  );


  return models.ServiceSettings.findOne({
    where,
    raw: true,
  });
}

module.exports = {
  getServiceSettingsOption,
};
