const Job = require('./Job');
const AppConfig = require('../../config');

class ExportDashboardDetails extends Job {

  constructor(req) {
    super(req);
    this.filters = req.query;
    this.type = AppConfig.jobTypes.export.dashboardDetails;
  }

  getJobDetails() {
    let details = super.getJobDetails();
    return {
      ...details,
      filters: this.filters
    };
  }

}

module.exports = ExportDashboardDetails;