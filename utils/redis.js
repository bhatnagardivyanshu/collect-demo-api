const redis = require('redis');

const PORT = process.env.REDIS_PORT || 6379;
const HOST = process.env.REDIS_HOST || 'redis';
const redisClient = redis.createClient(PORT, HOST);

redisClient.on('connect', function () {
  console.log('CONNECTED : REDIS CLIENT');
})

redisClient.on('error', function (err) {
  console.log('ERROR OCCURED IN REDIS CLIENT', err);
  process.exit(1);
});

module.exports = redisClient;