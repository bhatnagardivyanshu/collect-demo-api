const redisClient = require('../utils/redis');

class Job {
  constructor({ id, type }) {
    this.jobId = id;
    this.jobType = type;
  }

  async init(channel, msg) {
    await this.processJob(channel, msg);
  }

  getJobDetails(key, meta = {}) {
    if (['status', 'rows-processed'].includes(key)) {
      return new Promise((resolve, reject) => redisClient.hget(
        `jobs:${this.jobId}`,
        key,
        (err, value) => err ? reject(err) : resolve(value)
      ));
    }
    else if (key === 'inserted-row-ids' && meta.type === 'count') {
      return this.getRowIdsCount(key);
    }
    else if (key === 'inserted-row-ids' && meta.type === 'chunk') {
      return this.getRowIdsChunk(key, meta);
    }
    else if (key === 'input-row-ids' && meta.type === 'exists') {
      return this.doesInputRowIdExist(key, meta);
    }
    else if (key === 'input-row-ids' && meta.type === 'count') {
      return this.getInputRowIdCount(key, meta);
    }
  }

  updateJobDetails(key, value, meta = {}) {

    if (['status', 'rows-processed'].includes(key)) {
      return new Promise((resolve, reject) => {
        redisClient.hset(`jobs:${this.jobId}`, key, value, (err, reply) => {
          err ? reject(err) : resolve(reply);
        });
      });
    }
    else if (key === 'inserted-row-ids' && meta.type === 'save') {
      return this.setRowIds(key, value);
    }
    else if (key === 'inserted-row-ids' && meta.type === 'remove') {
      return this.removeRowIds(key, meta);
    }
    else if (key === 'input-row-ids' && meta.type === 'save') {
      return this.setInputRowIds(key, value);
    }
  }

  saveJobToRedis(details) {
    return new Promise((resolve, reject) => {
      redisClient.hset(
        `jobs:${this.jobId}`,
        'details', details,
        (err, reply) => err ? reject(err) : resolve(reply)
      );
    })
  }

  getRowIdsChunk(key, meta) {
    return new Promise((resolve, reject) => {
      redisClient.lrange(
        `jobs:${this.jobId}:${key}`,
        meta.start,
        meta.stop,
        (err, value) => err ? reject(err) : resolve(value))
    });
  }

  getRowIdsCount(key) {
    return new Promise((resolve, reject) => {
      redisClient.llen(
        `jobs:${this.jobId}:${key}`,
        (err, value) => err ? reject(err) : resolve(value)
      )
    });
  }

  getInputRowIdCount(key, meta) {
    return new Promise((resolve, reject) => {
      redisClient.scard(
        `jobs:${this.jobId}:${key}`,
        (err, value) => err ? reject(err) : resolve(value)
      )
    });
  }

  doesInputRowIdExist(key, meta) {
    return new Promise((resolve, reject) => {
      redisClient.sismember(
        `jobs:${this.jobId}:${key}`,
        meta.value,
        (err, value) => {
          err ? reject(err) : resolve(value)
        }
      )
    });
  }

  removeRowIds(key, meta) {
    return new Promise((resolve, reject) => {
      redisClient.ltrim(
        `jobs:${this.jobId}:${key}`,
        meta.start,
        meta.stop,
        (err, reply) => err ? reject(err) : resolve(reply));
    });
  }

  setRowIds(key, value) {
    return new Promise((resolve, reject) => {
      return redisClient.rpush(`jobs:${this.jobId}:${key}`, value, (err, reply) => {
        err ? reject(err) : resolve(reply);
      });
    });
  }

  setInputRowIds(key, value) {
    return new Promise((resolve, reject) => {
      return redisClient.sadd(`jobs:${this.jobId}:${key}`, value, (err, reply) => {
        err ? reject() : resolve();
      });
    });
  }
}

module.exports = Job;