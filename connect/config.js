/**
 * The configuration file for connectNotificationServer.js.
 */

module.exports = {
  TC_API_V3_BASE_URL: process.env.TC_API_V3_BASE_URL || 'https://api.topcoder-dev.com/v3',
  TC_API_V4_BASE_URL: process.env.TC_API_V4_BASE_URL || 'https://api.topcoder-dev.com/v4',
  TC_ADMIN_TOKEN: process.env.TC_ADMIN_TOKEN,

  // Probably temporary variables for TopCoder role ids for 'Connect Manager', 'Connect Copilot' and 'administrator'
  // These are values for development backend. For production backend they may be different.
  // These variables are currently being used to retrieve above role members using API V3 `/roles` endpoint.
  // As soon as this endpoint is replaced with more suitable one, these variables has to be removed if no need anymore.
  CONNECT_MANAGER_ROLE_ID: 8,
  CONNECT_COPILOT_ROLE_ID: 4,
  ADMINISTRATOR_ROLE_ID: 1,
};
