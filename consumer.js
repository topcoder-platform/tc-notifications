/**
 * Kafka consumer
 */
'use strict'

const Config = require('config')
const _ = require('lodash')
const Kafka = require('no-kafka')
const Promise = require('bluebird')
const Logger = require('./src/common/logger')
const Models = require('./src/models')

/**
 * Start Kafka consumer 
 * @param {Object} handlers  the handlers
 */
function startKafkaConsumer(handlers) {
    const options = { groupId: Config.KAFKA_GROUP_ID, connectionString: Config.KAFKA_URL }
    if (Config.KAFKA_CLIENT_CERT && Config.KAFKA_CLIENT_CERT_KEY) {
        options.ssl = { cert: Config.KAFKA_CLIENT_CERT, key: Config.KAFKA_CLIENT_CERT_KEY }
    }
    const consumer = new Kafka.SimpleConsumer(options)

    // data handler
    const messageHandler = (messageSet, topic, partition) => Promise.each(messageSet, (m) => {
        const message = m.message.value.toString('utf8')
        Logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${
            m.offset}; Message: ${message}.`)

        const topicName = topic

        // TODO handler

        const busPayload = JSON.parse(message)
        const notification = busPayload.payload

        return Models.Notification.create({
            userId: notification.userId,
            type: topicName,
            version: notification.version || null,
            contents: notification.contents || {},
            read: false,
            seen: false,
        })
            // commit offset
            .then(() => consumer.commitOffset({ topic, partition, offset: m.offset }))
            .catch((err) => {
                Logger.error('Kafka dataHandler failed')
                Logger.error(err)
            })
    })
    consumer
        .init()
        .then(() => _.each(_.keys(handlers),
            (topicName) => consumer.subscribe(topicName, messageHandler)))
        .catch((err) => {
            Logger.error('Kafka Consumer failed');
            Logger.error(err);
        });
}

let handlers = {}
let topics = JSON.parse(Config.KAFKA_CONSUMER_TOPICS)

// init all events
_.forEach(topics, (topic) => {
    handlers[topic] = null // TODO implement handler 
})

// execute consumer
startKafkaConsumer(handlers)
