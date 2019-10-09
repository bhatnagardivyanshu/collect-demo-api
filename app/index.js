const app = require('express')();
const bodyParser = require('body-parser');
const ErrorHandler = require('./errors/ErrorHandler');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('environment', process.env.NODE_ENV);

app.get('/', (req, res, next) => {
  res.send('It works!!!');
});

// Register routes
app.use('/api', require('./routes/api'));

// Error Handler
app.use(ErrorHandler);

// Routes not found
app.use((req, res, next) => {
  res.status(404).send({
    message: 'Oops! Seems like you have hit an unknown endpoint'
  });
});

process.on('unhandledRejection', (err, p) => {
  // handle Error
});

process.on('uncaughtException', (err) => {
  // handle Error
  process.exit(1);
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening to PORT: ${PORT}`);
});

process.on('exit', (code) => {
  if (code !== 0) {
    // trigger server failure email
  }
})