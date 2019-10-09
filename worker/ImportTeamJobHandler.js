const fs = require('fs');
const path = require('path');
const csvToJson = require('csvtojson');
const AppConfig = require('../config');
const JobHandler = require('./JobHandler');

class ImportTeamJobHandler extends JobHandler {

  constructor({ id, type, file_path }) {
    super({ id, type });
    this.filepath = file_path;
    this.absFilepath = path.resolve('./', this.filepath);
  }

  async processJob(channel, msg) {

    let initialJobStatus = await this.getJobDetails('status');
    if (initialJobStatus == AppConfig.jobTextToStatus.queued) {
      // Start processing
      return await this.startProcessing(channel, msg);
    } else if (initialJobStatus == AppConfig.jobTextToStatus.resumed) {
      // Resume processing
      return this.resumeProcessing(channel, msg);
    } else if (initialJobStatus == AppConfig.jobTextToStatus.canceled) {
      // Cancel processing
      return await this.cancelProcessing(channel, msg);
    } else if (initialJobStatus == AppConfig.jobTextToStatus.paused) {
      // Pause processing
      return await this.pauseProcessing(channel, msg);
    }
  }

  async startProcessing(channel, msg, resume = false) {
    // set job status to 1 (processing)
    console.log('***** PROCESSING *****');
    await this.updateJobDetails('status', AppConfig.jobTextToStatus.processing);

    let currentJobStatus;
    let currentRowCount = 0;
    let uploadedFileStream = this.getUploadedFileReadStream();
    let skipRows = resume;

    csvToJson().fromStream(uploadedFileStream).subscribe(async row => {

      if (skipRows) {
        // Skip input file rows that were previously processed
        let isCurrentRowProcessed = await this.getJobDetails('input-row-ids', { type: 'exists', value: currentRowCount });
        if (isCurrentRowProcessed) {
          currentRowCount++;
          return;
        } else {
          // Set skipRows = false when we get first unprocessed line
          skipRows = false;
        }
      }

      // checking if job is canceled after every 25 rows
      if (currentRowCount % 25 === 0) {

        await this.updateJobDetails('rows-processed', currentRowCount);
        currentJobStatus = await this.getJobDetails('status');

        // update job status to 'canceled' in redis
        if (currentJobStatus == AppConfig.jobTextToStatus.canceled) {
          throw new Error('cancel');
        } else if (currentJobStatus == AppConfig.jobTextToStatus.paused) {
          throw new Error('pause');
        }
      }

      // Save to Database

      // Add the row ids (of DB) for handling cancel, adding row-count for now
      await this.updateJobDetails('inserted-row-ids', currentRowCount, { type: 'save' });

      // Add the row id of the uploaded file for resuming, adding row-count for now
      await this.updateJobDetails('input-row-ids', currentRowCount, { type: 'save' });

      currentRowCount++;

    },
      (err) => this.handleStartProcessingError(err, channel, msg),
      () => this.handleProcessingComplete(channel, msg)
    );
  }

  handleStartProcessingError(error, channel, msg) {

    // if canceled by the user
    if (error.message === 'cancel') {
      channel.nack(msg, false, false);
      this.removeFile();
      return;
    }
    else if (error.message === 'pause') {
      this.pauseProcessing(channel, msg);
      return;
    }
    // if any other error, requeue the message
    else {
      channel.nack(msg);
    }

  }

  handleProcessingComplete(channel, msg) {
    this.updateJobDetails('status', AppConfig.jobTextToStatus.completed).then(() => {
      channel.ack(msg);
      this.removeFile();
    });
  }

  async cancelProcessing(channel, msg) {
    console.log('***** CANCEL *****');
    let rowsAddedCount = await this.getJobDetails('inserted-row-ids', { type: 'count' });

    if (rowsAddedCount > 0) {
      let chunk = await this.getJobDetails('inserted-row-ids', { type: 'chunk', start: 0, stop: 24 });


      for (let i = 0; i < chunk.length; i++) {
        // remove rows from DB
        // remove the first 25 ids that have been just deleted
        // get next batch of 25 ids
        if (i === chunk.length - 1) {
          await this.updateJobDetails('inserted-row-ids', chunk, { type: 'remove', start: 25, stop: -1 });
          i = 0;
          chunk = await this.getJobDetails('inserted-row-ids', { type: 'chunk', start: 0, stop: 24 });
        }
      }
    }
    channel.ack(msg);
  }

  async pauseProcessing(channel, msg) {
    console.log('***** PAUSE *****');
    await this.saveJobToRedis(msg.content.toString());
    channel.ack(msg);
    return;
  }

  async resumeProcessing(channel, msg) {
    console.log('***** RESUME *****');
    let rowsProcessedCount = await this.getJobDetails('input-row-ids', { type: 'count' });
    this.startProcessing(channel, msg, rowsProcessedCount > 0);
  }

  getUploadedFileReadStream() {
    return fs.createReadStream(this.absFilepath);
  }

  removeFile() {
    fs.unlinkSync(this.absFilepath);
  }

}

module.exports = ImportTeamJobHandler;