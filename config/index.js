module.exports = {

  queues: {
    index: 'background-processes'
  },

  jobTextToStatus: {
    'canceled': '-1',
    'queued': '0',
    'processing': '1',
    'paused': '2',
    'resumed': '3',
    'completed': '4',
  },

  jobTypes: {
    import: {
      team: 'import-team',
    },
    export: {
      dashboardDetails: 'export-dashboard-details'
    }
  }
}