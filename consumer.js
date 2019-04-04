/**
 * Kafka consumer
 */
'use strict';

const config = require('config');
const _ = require('lodash');
const Kafka = require('no-kafka');
const co = require('co');
const logger = require('./src/common/logger');
const models = require('./src/models');
const processors = require('./src/processors');
global.Promise = require('bluebird');

/**
 * Start Kafka consumer
 */
function startKafkaConsumer() {
  const options = { groupId: config.KAFKA_GROUP_ID, connectionString: config.KAFKA_URL };
  if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
    options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY };
  }
  const consumer = new Kafka.GroupConsumer(options);

  // data handler
  const messageHandler = (messageSet, topic, partition) => Promise.each(messageSet, (m) => {
    const message = m.message.value.toString('utf8');
    logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${
      m.offset}; Message: ${message}.`);

    let messageJSON;
    try {
      messageJSON = JSON.parse(message);
    } catch (e) {
      logger.error('Invalid message JSON.');
      logger.logFullError(e);
      // commit the message and ignore it
      consumer.commitOffset({ topic, partition, offset: m.offset });
      return;
    }

    if (messageJSON.topic !== topic) {
      logger.error(`The message topic ${messageJSON.topic} doesn't match the Kafka topic ${topic}.`);
      // commit the message and ignore it
      consumer.commitOffset({ topic, partition, offset: m.offset });
      return;
    }

    // get handler function names for the topic
    const handlerFuncNames = config.KAFKA_CONSUMER_HANDLERS[topic];
    if (!handlerFuncNames || handlerFuncNames.length === 0) {
      logger.error(`No handler configured for Kafka topic ${topic}.`);
      // commit the message and ignore it
      consumer.commitOffset({ topic, partition, offset: m.offset });
      return;
    }

    return co(function* () {
      // run each handler
      for (let i = 0; i < handlerFuncNames.length; i += 1) {
        try {
          const handler = processors[handlerFuncNames[i]];
          if (!handler) {
            logger.error(`Handler ${handlerFuncNames[i]} is not defined`);
            continue;
          }
          logger.info(`Run handler ${handlerFuncNames[i]}`);
          // run handler to get notifications
          const notifications = yield handler(messageJSON);
          if (notifications && notifications.length > 0) {
            // save notifications in bulk to improve performance
            yield models.Notification.bulkCreate(_.map(notifications, (n) => ({
              userId: n.userId,
              type: n.type || topic,
              contents: n.contents || messageJSON.payload || {},
              read: false,
              seen: false,
              version: n.version || null,
            })));
            // logging
            logger.info(`Saved ${notifications.length} notifications for users: ${
              _.map(notifications, (n) => n.userId).join(', ')
            }`);
          }
          logger.info(`Handler ${handlerFuncNames[i]} was run successfully`);
        } catch (e) {
          // log and ignore error, so that it won't block rest handlers
          logger.error(`Handler ${handlerFuncNames[i]} failed`);
          logger.logFullError(e);
        }
      }
    })
      // commit offset
      .then(() => consumer.commitOffset({ topic, partition, offset: m.offset }))
      .catch((err) => {
        logger.error('Kafka handler failed');
        logger.logFullError(err);
      });
  });

  // Start kafka consumer
  logger.info('Starting kafka consumer');
  consumer
    .init([{
      subscriptions: _.keys(config.KAFKA_CONSUMER_HANDLERS),
      handler: messageHandler,
    }])
    .then(() => {
      logger.info('Kafka consumer initialized successfully');
    })
    .catch((err) => {
      logger.error('Kafka consumer failed');
      logger.logFullError(err);
    });
}

startKafkaConsumer();
