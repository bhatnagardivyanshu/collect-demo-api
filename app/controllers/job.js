const AppConfig = require('../../config');
const redisClient = require('../../utils/redis');
const dispatchMessage = require('../services/queue');
const { asyncReqHandler } = require('../../utils/helpers');
const BadRequestError = require('../errors/BadRequestError');

exports.updateJobStatus = asyncReqHandler((req, res, next) => {

  // validate request

  let { jobId } = req.params;

  // check if the job exists in redis
  redisClient.hget(`jobs:${jobId}`, 'status', (err, currentStatus) => {

    if (err) { next(new Error('Something went wrong with redis')); }
    else if (!currentStatus) { next(new BadRequestError('We could not find a job with that id')); }
    else {

      const { status: newStatus } = req.body;

      if (!newStatus) next(new BadRequestError('Status is required'));

      // Through validations we can check the newStatus, should be pause or resume
      if (shouldResume(newStatus, currentStatus)) {

        return redisClient.hget(
          `jobs:${jobId}`,
          'details',
          (err, value) => {
            if (err) {
              return next(new Error('Something went wrong!'));
            }
            dispatchMessage(AppConfig.queues.index, JSON.parse(value));
            redisClient.hset(`jobs:${jobId}`, 'status', newStatus, (err, reply) => {
              if (err) next(new Error('Something went wrong!'));
              res.sendStatus(204);
            })
          });

      }

      else if (
        shouldPause(newStatus, currentStatus) ||
        shouldCancel(newStatus, currentStatus)
      ) {
        return redisClient.hset(`jobs:${jobId}`, 'status', newStatus, (err, reply) => {
          if (err) next(new Error('Something went wrong!'));
          res.sendStatus(204);
        })
      }

      else {
        next(new BadRequestError('Invalid status given'));
      }
    }
  });
});

const shouldCancel = (newStatus, currentStatus) => {
  return newStatus === AppConfig.jobTextToStatus.canceled &&
    (
      currentStatus !== AppConfig.jobTextToStatus.completed ||
      currentStatus !== AppConfig.jobTextToStatus.canceled
    );
}

const shouldPause = (newStatus, currentStatus) => {
  return newStatus === AppConfig.jobTextToStatus.paused &&
    (
      currentStatus === AppConfig.jobTextToStatus.resumed ||
      currentStatus === AppConfig.jobTextToStatus.queued ||
      currentStatus === AppConfig.jobTextToStatus.processing
    );
}

const shouldResume = (newStatus, currentStatus) => {
  return newStatus === AppConfig.jobTextToStatus.resumed &&
    currentStatus === AppConfig.jobTextToStatus.paused;
}
