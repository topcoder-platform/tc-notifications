/**
 * Event scheduler
 *
 * Keeps scheduled events in ScheduledEvents model.
 * When scheduled time comes, retrieves all due events from DB
 * and passes them to the events handler to process.
 */
const _ = require('lodash');
const cron = require('node-cron');
const models = require('../models');
const logger = require('../common/logger');

/**
 * Statuses of scheduled events
 *
 * @constant
 */
const SCHEDULED_EVENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

class EventScheduler {
  /**
   * EventScheduler constructor
   *
   * @param {String}   schedulerId scheduler id
   * @param {Object}   periods     keys are period names to store in DB
   *                               values are period definition in cron format
   * @param {Function} handler     function which is called when events time comes
   */
  constructor(schedulerId, periods, handler) {
    this.schedulerId = schedulerId;
    this.periods = periods;
    this.handler = handler;

    this.initSchedule();
  }

  /**
   * Set status for the list of events
   *
   * @param {Array}  events list of events
   * @param {String} status events status
   *
   * @return {Promise} resolves to model update result
   */
  static setEventsStatus(events, status) {
    return models.ScheduledEvents.update({
      status,
    }, {
      where: {
        id: _.map(events, 'id'),
      },
    });
  }

  /**
   * Initialize cron schedule
   */
  initSchedule() {
    _.forOwn(this.periods, (periodDefinition, periodName) => {
      logger.verbose(`[EventScheduler] init handler '${this.schedulerId}'`
        + ` period '${periodName}' (${periodDefinition}).`);

      cron.schedule(periodDefinition, () => {
        logger.verbose(`[EventScheduler] run task for handler '${this.schedulerId}'`
          + ` period '${periodName}' (${periodDefinition}).`);

        models.ScheduledEvents.findAll({
          where: {
            schedulerId: this.schedulerId,
            period: periodName,
            status: [
              SCHEDULED_EVENT_STATUS.PENDING,
              SCHEDULED_EVENT_STATUS.FAILED,
            ],
          },
        }).then((events) => this.handler(events, EventScheduler.setEventsStatus));
      });
    });
  }

  /**
   * Adds events to the list of pending events
   *
   * @param {Object} scheduledEvent             event prams to schedule
   * @param {Object} scheduledEvent.data        arbitrary event data
   * @param {String} scheduledEvent.period      event period name
   * @param {Number} scheduledEvent.userId      (optional) user id
   * @param {String} scheduledEvent.eventType   (optional) event type
   * @param {String} scheduledEvent.reference   (optional) target entity name (like 'topic')
   * @param {String} scheduledEvent.referenceId (optional) target entity id (like <topicId>)
   *
   * @return {Promise} resolves to model create result
   */
  addEvent(scheduledEvent) {
    logger.verbose(`[EventScheduler] add event for handler '${this.schedulerId}' period '${scheduledEvent.period}'.`);

    const event = _.pick(scheduledEvent, [
      'data', 'period', 'userId', 'eventType', 'reference', 'referenceId',
    ]);
    event.schedulerId = this.schedulerId;
    event.status = SCHEDULED_EVENT_STATUS.PENDING;

    return models.ScheduledEvents.create(event);
  }
}

/**
 * Creates EventScheduler instance
 *
 * @param {String}   schedulerId scheduler id
 * @param {Object}   periods     keys are period names to store in DB
 *                               values are period definition in cron format
 * @param {Function} handler     function which is called when events time comes
 */
function createEventScheduler(schedulerId, periods, handler) {
  return new EventScheduler(schedulerId, periods, handler);
}

module.exports = {
  SCHEDULED_EVENT_STATUS,
  createEventScheduler,
};
