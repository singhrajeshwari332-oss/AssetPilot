export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: err.message,
      errors: err.errors
    });
  }

  if (err.code === 'P2002') {
    const target = err.meta?.target || 'Field';
    return res.status(409).json({
      message: `A record with this ${Array.isArray(target) ? target.join(', ') : target} already exists.`
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      message: 'Record not found in the database.'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message
  });
}
