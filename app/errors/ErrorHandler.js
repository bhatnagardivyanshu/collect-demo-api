const BadRequestError = require('./BadRequestError');

module.exports = (err, req, res, next) => {

  if (err instanceof BadRequestError) {
    return res.status(err.status).send({
      message: err.message
    });
  }

  return res.status(500).send({
    message: err.message
  })
}