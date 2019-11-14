/**
 * Script for initializing/resetting DB.
 *
 * WARNING
 * It recreates DB schema causing removing existent data if any.
 */
const notificationServer = require('../index');

console.info('Initializing db...');

notificationServer
  .initDatabase()
  .then(() => {
    console.info('Database was successfully initialized.');
    process.exit();
  })
  .catch((err) => {
    console.error('Error initializing DB', err);
    process.exit(1);
  });