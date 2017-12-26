/**
 * The configuration file for connectNotificationServer.js.
 */

module.exports = {
  TC_API_V3_BASE_URL: process.env.TC_API_V3_BASE_URL || 'https://api.topcoder-dev.com/v3',
  TC_API_V4_BASE_URL: process.env.TC_API_V4_BASE_URL || 'https://api.topcoder-dev.com/v4',
  // eslint-disable-next-line max-len
  TC_ADMIN_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiQ29ubmVjdCBNYW5hZ2VyIiwiQ29ubmVjdCBBZG1pbiJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci1kZXYuY29tIiwiaGFuZGxlIjoicGF0X21vbmFoYW4iLCJleHAiOjE1MTk4NDIyMzYsInVzZXJJZCI6IjQwMTUyOTMzIiwiaWF0IjoxNTE0MzE4NTA0LCJlbWFpbCI6ImRldm9wcytwYXRfbW9uYWhhbkB0b3Bjb2Rlci5jb20iLCJqdGkiOiIwOThjMGNjOS05OTljLTRlZjktYmM5ZS0yNTExZWJkZmJkMzIifQ.N3rbYMOfniLZ3TV3z08MAD46TwgFUGJ--UYhQVuu1Uw',

  // Probably temporary variables for TopCoder role ids for 'Connect Manager', 'Connect Copilot' and 'administrator'
  // These are values for development backend. For production backend they may be different.
  // These variables are currently being used to retrieve above role members using API V3 `/roles` endpoint.
  // As soon as this endpoint is replaced with more suitable one, these variables has to be removed if no need anymore.
  CONNECT_MANAGER_ROLE_ID: 8,
  CONNECT_COPILOT_ROLE_ID: 4,
  ADMINISTRATOR_ROLE_ID: 1,

  // id of the BOT user which creates post with various events in discussions
  TCWEBSERVICE_ID: process.env.TCWEBSERVICE_ID || '22838965',
};
