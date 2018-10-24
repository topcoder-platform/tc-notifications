const notificationServer = require('./index');

// // init database, it will clear and re-create all tables
// notificationServer
//   .initDatabase()
//   .then(() => notificationServer.startAPI())
//   .catch((e) => {
//     console.log(e); // eslint-disable-line no-console
//     notificationServer.logger.error('Notification API server errored out');
//   });

module.exports = notificationServer.startAPI();
