const fs = require('fs');
const path = require('path');
const AppConfig = require('../config');
const JobHandler = require('./JobHandler');

class ExportDashboardDetailsJobHandler extends JobHandler {

  constructor({ id, type, filters }) {
    super({ id, type });
    this.filters = filters;
    this.filename = `${id}-dashboard-details.csv`;
    this.downloadPath = path.resolve('./', './downloads');
  }

  async processJob(channel, msg) {

    let initialJobStatus = await this.getJobDetails('status');
    console.log('\n\nINITIAL PROCESS JOB', initialJobStatus, '\n\n');

    if (
      initialJobStatus == AppConfig.jobTextToStatus.queued ||
      initialJobStatus == AppConfig.jobTextToStatus.processing
    ) {
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

    console.log('\n***** PROCESSING *****\n');
    // set job status to 1 (processing)
    await this.updateJobDetails('status', AppConfig.jobTextToStatus.processing);

    // Fetch data from database using the filters passed (this.filters);

    let currentJobStatus;
    let rowsProcessed = 0;

    const dummyData = "'3526 HIGH ST', 'SACRAMENTO', '95838', 'CA', '2', '1', '836', 'Residential', 'Wed May 21 00:00:00 EDT 2008', '59222', '38.631913', '-121.434879'\n";
    const ouptputFileStream = fs.createWriteStream(this.getAbsDownloadPath(), { flags: resume ? 'a' : 'w', encoding: 'utf-8' });

    let cancelProcessing = false;
    let pauseProcessing = false;
    let skipRows = resume;

    for (let i = 0; i < 2e4; i++) {
      let currentRowCount = i;
      console.log(i);
      if (skipRows) {
        let isCurrentRowProcessed = await this.getJobDetails('input-row-ids', { type: 'exists', value: currentRowCount });
        if (isCurrentRowProcessed) {
          continue;
        } else {
          console.log('***** SKIPPED ROWS - ', currentRowCount, ' *****');
          skipRows = false;
        }
      }

      ouptputFileStream.write(Buffer.from(dummyData));

      if (rowsProcessed % 25 === 0) {
        currentJobStatus = await this.getJobDetails('status');

        if (currentJobStatus == AppConfig.jobTextToStatus.canceled) {
          cancelProcessing = 'cancel';
          ouptputFileStream.end();
          break;

        } else if (currentJobStatus == AppConfig.jobTextToStatus.paused) {
          pauseProcessing = 'pause';
          ouptputFileStream.end();
          break;
        }
      }

      await this.updateJobDetails('rows-processed', rowsProcessed);
      await this.updateJobDetails('input-row-ids', currentRowCount, { type: 'save' });
      rowsProcessed++;
    }

    if (cancelProcessing) {
      this.cancelProcessing(channel, msg);
    } else if (pauseProcessing) {
      this.pauseProcessing(channel, msg);
    } else {
      this.handleCompletedJob(channel, msg);
    }
  }

  async resumeProcessing(channel, msg) {
    console.log('***** RESUME *****');
    let rowsProcessedCount = await this.getJobDetails('input-row-ids', { type: 'count' });
    console.log('RESUMING THE PROCESSING', rowsProcessedCount, ' count');
    this.startProcessing(channel, msg, rowsProcessedCount > 0);
  }

  async cancelProcessing(channel, msg) {
    console.log('***** CANCEL *****');
    channel.ack(msg);
    return this.removeFile();
  }

  async pauseProcessing(channel, msg) {
    console.log('***** PAUSE *****');
    await this.saveJobToRedis(msg.content.toString());
    channel.ack(msg);
    return;
  }

  handleCompletedJob(channel, msg) {
    this.updateJobDetails('status', AppConfig.jobTextToStatus.completed).then(() => {
      // Trigger mail to the user with download link
      console.log('\n****** JOB COMPLETED ******\n');
      channel.ack(msg);
    });
  }

  getAbsDownloadPath() {
    return path.resolve(this.downloadPath, this.filename);
  }

  removeFile() {
    fs.unlinkSync(this.getAbsDownloadPath());
  }

}

module.exports = ExportDashboardDetailsJobHandler;