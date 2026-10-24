import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { clientOrigins, env } from './config/env.js';
import { setupSwagger } from './swagger/swagger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import knowledgeBaseRoutes from './routes/knowledgeBaseRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  // CORS allowlist
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman, vitest)
        if (!origin || clientOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'AIDMS Backend',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    });
  });

  // Swagger Documentation
  setupSwagger(app);

  // Application Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api/doubts', doubtRoutes);
  app.use('/api/faculty', facultyRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/knowledge-base', knowledgeBaseRoutes);
  app.use('/api/files', fileRoutes);

  // 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
