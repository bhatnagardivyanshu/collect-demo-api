const Router = require('express').Router();
const upload = require('multer')({ dest: 'uploads/' });
const ApiController = require('../../../controllers/api');

Router.post('/import', upload.single('file'), ApiController.importTeam);

module.exports = Router;