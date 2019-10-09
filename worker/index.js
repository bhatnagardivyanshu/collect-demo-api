const AppConfig = require('../config');
const amqp = require('amqplib/callback_api');

const HOST = process.env.AMQP_HOST || 'amqp://rabbitMQ';
const assertQueueOptions = { durable: true };

const ImportTeamJobHandler = require('./ImportTeamJobHandler');
const ExportDashboardDetailsHandler = require('./ExportDashboardDetailsJobHandler');

amqp.connect(HOST, (err, connection) => {

  if (err) {
    console.log('WORKER HAS CONNECTION ERROR', err);
    process.exit(1);
  }

  connection.createChannel((err, channel) => {

    if (err) {
      console.log('WORKER HAS CHANNEL ERROR');
      process.exit(1);
    }

    let queue = AppConfig.queues.index;

    channel.assertQueue(queue, assertQueueOptions);
    channel.prefetch(1);

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    try {

      channel.consume(queue, async (msg) => {

        let job = JSON.parse(msg.content.toString());

        let { jobTypes: { import: importJobs, export: exportJobs } } = AppConfig;

        if (job.type === importJobs.team) {

          await new ImportTeamJobHandler(job).init(channel, msg);

        } else if (job.type === exportJobs.dashboardDetails) {

          await new ExportDashboardDetailsHandler(job).init(channel, msg);

        }

      }, { noAck: false });

    } catch (error) {

      channel.nack(msg);
    }

  });
})