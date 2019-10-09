const shortid = require('shortid');

exports.asyncReqHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.log('\n============ Error occured ===================\n', err, '\n===============================\n');
      next(err);
    });
  }
}

exports.getUniqueId = () => shortid.generate();