require('dotenv').config();

if (process.env.ROLE === 'server') {
  require('./app/index.js');
} else {
  require('./worker/index.js');
}