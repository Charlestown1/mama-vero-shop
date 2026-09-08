/**
 * Central error handler. Never leaks raw database/internal errors to the client.
 */
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: 'Resource not found.' });
}

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  let statusCode = err.statusCode || 500;
  let message = 'Something went wrong. Please try again.';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use.`;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format.';
  } else if (err.publicMessage) {
    message = err.publicMessage;
  }

  res.status(statusCode).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
