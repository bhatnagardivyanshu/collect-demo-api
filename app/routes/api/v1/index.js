const Router = require('express').Router();

const JobRoutes = require('./job');
const TeamRoutes = require('./team');
const DashboardRoutes = require('./dashboard');

Router.use('/jobs', JobRoutes);
Router.use('/teams', TeamRoutes);
Router.use('/dashboard', DashboardRoutes);

module.exports = Router;