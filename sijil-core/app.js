import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import * as logger from './src/utils/logger.js';
import healthRouter from './src/routes/health.routes.js';
import apiRouter from './src/routes/index.js';
import { slugRedirectMiddleware } from './src/middleware/slugRedirect.middleware.js';
import { analyticsTrackerMiddleware } from './src/middleware/analyticsTracker.middleware.js';

const app = express();

// 1. Standard Global Security & Body Parsing Middleware
app.use(helmet());
app.use(cors()); // Allows all origins globally for public content strategy access
app.use(express.json({ limit: '2mb' }));

// 2. Automated Custom Request Performance Logging Middleware
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    // Convert high-resolution time array into readable milliseconds
    const responseTimeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTimeMs}ms`);
  });

  next();
});

// 3. Mount Application Core Routing Points
app.use('/api/health', healthRouter);
app.use('/api', apiRouter);

// 4. Slug Redirect Middleware - AFTER routes but BEFORE 404 handler
app.use(slugRedirectMiddleware);

// 5. Analytics Tracker Middleware - AFTER routes, tracks views and searches
app.use(analyticsTrackerMiddleware);

// 6. Fallback 404 Routing Interceptor
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

// 7. Unified Global Exception Fallback Catch Mechanism
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  logger.error(`${req.method} ${req.originalUrl} failed with error: ${err.message}`);
  if (err.stack) console.error(err.stack); // Retain debugging context locally

  res.status(statusCode).json({ error: err.message || 'Internal Server Error' });
});

export default app;