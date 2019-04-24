/**
 * This is entry point of the Kafka consumer processors.
 */
'use strict';

const ChallengeCreatedHandler = require('./challenge/ChallengeCreatedHandler');
const ChallengePhaseWarningHandler = require('./challenge/ChallengePhaseWarningHandler');
const ChallengeHandler = require('./challenge/ChallengeHandler');

// Exports
module.exports = {
  handleChallengeCreated: ChallengeCreatedHandler.handle,
  handleChallengePhaseWarning: ChallengePhaseWarningHandler.handle,
  handleChallenge: ChallengeHandler.handle,
};
