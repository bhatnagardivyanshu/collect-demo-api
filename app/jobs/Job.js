const AppConfig = require('../../config');
const Helpers = require('../../utils/helpers');
const redisClient = require('../../utils/redis');

class Job {

  constructor() {
    this.jobId = Helpers.getUniqueId();
  }

  getJobDetails() {
    return {
      id: this.jobId,
      type: this.type,
      created_at: new Date().getTime()
    }
  }

  saveJobToRedis() {
    return new Promise((resolve, reject) => {
      redisClient.hset(
        `jobs:${this.jobId}`,
        'status', AppConfig.jobTextToStatus.queued,
        'type', this.type,
        (err, reply) => {
          err ? reject(err) : resolve();
        });
    })
  }
}

module.exports = Job;