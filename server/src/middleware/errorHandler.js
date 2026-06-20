export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({
    error:
      status >= 500 && !err.statusCode
        ? 'Sisäinen palvelinvirhe'
        : err.message,
  });
}
