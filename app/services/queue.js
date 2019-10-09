const amqp = require('amqplib');

let queues = {};
const assertQueueOptions = { durable: true };
const sendToQueueOptions = { persistent: true };
const host = process.env.AMQP_HOST || 'amqp://rabbitMQ';

module.exports = async (queueName, message, convert = true) => {

  let channel = queues[queueName];

  if (convert) {
    message = JSON.stringify(message);
  }

  if (!channel) {
    const connection = await amqp.connect(host);
    const newChannel = await connection.createChannel();
    await newChannel.assertQueue(queueName, assertQueueOptions);
    channel = queues[queueName] = newChannel;
  }

  return channel.sendToQueue(queueName, Buffer.from(message), sendToQueueOptions);
}