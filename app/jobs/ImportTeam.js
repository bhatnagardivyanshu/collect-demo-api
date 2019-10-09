const Job = require('./Job');
const AppConfig = require('../../config');
const Helpers = require('../../utils/helpers');

class ImportTeam extends Job {

  constructor(req) {
    super(req);
    this.file = req.file;
    this.type = AppConfig.jobTypes.import.team;
  }

  getJobDetails() {
    let details = super.getJobDetails();
    
    return {
      ...details,
      file_path: this.file.path,
      file_name: this.file.filename,
      original_file_name: this.file.originalname,
    }
  }

}

module.exports = ImportTeam;