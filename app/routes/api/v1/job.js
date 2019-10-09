const Router = require('express').Router();
const JobController = require('../../../controllers/job');

Router.put('/:jobId', JobController.updateJobStatus);

module.exports = Router;
