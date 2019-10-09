const AppConfig = require('../../config');
const ImportTeamJob = require('../jobs/ImportTeam');
const dispatchMessage = require('../services/queue');
const { asyncReqHandler } = require('../../utils/helpers');
const ExportDashboardDetailsJob = require('../jobs/ExportDashboardDetails');

exports.exportDashboardDetails = asyncReqHandler(async (req, res, next) => {

  // 1. validate file
  // 2. maybe create a db entry

  let job = new ExportDashboardDetailsJob(req);
  await job.saveJobToRedis();

  let jobDetails = job.getJobDetails();
  let queueName = AppConfig.queues.index;

  await dispatchMessage(queueName, jobDetails)
    .catch(err => {
      throw new Error('SOMETHING IS WRONG WITH THE QUEUE');
    })

  res.status(200).send({
    success: true,
    data: {
      job_id: job.jobId,
      message: 'We have received your request to export the details. The detials will be sent to you over email once completed. Feel Free to update the status of the job to cancel/pause/resume as and whenever you like'
    }
  });
})

exports.importTeam = asyncReqHandler(async (req, res, next) => {

  // 1. validate file
  // 2. maybe create a db entry

  let job = new ImportTeamJob(req);
  await job.saveJobToRedis();

  let jobDetails = job.getJobDetails();
  let queueName = AppConfig.queues.index;

  await dispatchMessage(queueName, jobDetails)
    .catch(err => {
      console.log(err.message, err);
      throw new Error('SOMETHING IS WRONG WITH THE QUEUE');
    });

  res.status(200).send({
    success: true,
    data: {
      job_id: jobId,
      message: 'We have received your request to import the file. You may update the job status to pause/resume/cancel'
    }
  });
})