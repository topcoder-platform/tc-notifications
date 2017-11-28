/**
 * This script is used to generate JWT token for a user.
 * Usage: node test/token {user-id}
 */
'use strict';

const jwt = require('jsonwebtoken');
const config = require('config');
const _ = require('lodash');

if (process.argv.length !== 3) {
  console.info('Usage: node test/token {user-id}'); // eslint-disable-line no-console
  process.exit();
}
const userId = Number(process.argv[2]);
if (_.isNaN(userId)) {
  console.info('User id should be a number.'); // eslint-disable-line no-console
  process.exit();
}

// generate JWT token
const token = jwt.sign({ userId, iss: `https://api.${config.authDomain}` },
  config.authSecret, { expiresIn: '30 days' });

console.info(`JWT Token: ${token}`); // eslint-disable-line no-console
process.exit();
