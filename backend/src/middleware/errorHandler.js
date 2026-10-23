import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Filter out any sensitive information
  const response = {
    success: false,
    message: err.message || 'Internal server error'
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  console.error(`[Error] [${req.method} ${req.url}] ${err.message}`, err.stack || '');
  res.status(statusCode).json(response);
}
