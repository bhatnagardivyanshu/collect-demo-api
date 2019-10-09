const Router = require('express').Router();
const upload = require('multer')({ dest: 'uploads/' });
const ApiController = require('../../../controllers/api');

Router.get('/export', upload.single('file'), ApiController.exportDashboardDetails);

module.exports = Router;