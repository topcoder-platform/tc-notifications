/**
 * Kafka consumer
 */
'use strict';

const config = require('config');
const _ = require('lodash');
const Kafka = require('no-kafka');
const co = require('co');
global.Promise = require('bluebird');
const healthcheck = require('topcoder-healthcheck-dropin')

const logger = require('./src/common/logger');
const models = require('./src/models');
const processors = require('./src/processors');


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

    // get rule sets for the topic
    const ruleSets = config.KAFKA_CONSUMER_RULESETS[topic];

    // TODO for NULL handler
    if (!ruleSets || ruleSets.length === 0) {
      logger.error(`No handler configured for Kafka topic ${topic}.`);
      // commit the message and ignore it
      consumer.commitOffset({ topic, partition, offset: m.offset });
      return;
    }

    return co(function* () {
      // run each handler
      for (let i = 0; i < ruleSets.length; i += 1) {
        const rule = ruleSets[i]
        const handlerFuncArr = _.keys(rule)
        const handlerFuncName = _.get(handlerFuncArr, "0")

        try {
          const handler = processors[handlerFuncName]
          const handlerRuleSets = rule[handlerFuncName]
          if (!handler) {
            logger.error(`Handler ${handlerFuncName} is not defined`);
            continue;
          }
          logger.info(`Run handler ${handlerFuncName}`);
          // run handler to get notifications
          const notifications = yield handler(messageJSON, handlerRuleSets);
          if (notifications && notifications.length > 0) {
            // save notifications in bulk to improve performance
            logger.info(`Going to insert ${notifications.length} notifications in database.`)
            yield models.Notification.bulkCreate(_.map(notifications, (n) => ({
              userId: n.userId,
              type: n.type || topic,
              contents: n.contents || n.notification || messageJSON.payload || {},
              read: false,
              seen: false,
              version: n.version || null,
            })))
            // logging
            logger.info(`Saved ${notifications.length} notifications`)
            /* logger.info(` for users: ${
              _.map(notifications, (n) => n.userId).join(', ')
              }`); */
          }
          logger.info(`Handler ${handlerFuncName} executed successfully`);
        } catch (e) {
          // log and ignore error, so that it won't block rest handlers
          logger.error(`Handler ${handlerFuncName} failed`);
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

  const check = function () {
    if (!consumer.client.initialBrokers && !consumer.client.initialBrokers.length) {
      return false
    }
    let connected = true
    consumer.client.initialBrokers.forEach(conn => {
      logger.debug(`url ${conn.server()} - connected=${conn.connected}`)
      connected = conn.connected & connected
    })
    return connected
  }

  // Start kafka consumer
  logger.info('Starting kafka consumer');
  consumer
    .init([{
      // subscribe topics
      subscriptions: _.keys(config.KAFKA_CONSUMER_RULESETS),
      handler: messageHandler,
    }])
    .then(() => {
      logger.info('Kafka consumer initialized successfully');
      healthcheck.init([check])
    })
    .catch((err) => {
      logger.error('Kafka consumer failed');
      logger.logFullError(err);
    });
}

startKafkaConsumer();
