import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSocketIO } from './services/socketService.js';
import { env, clientOrigins } from './config/env.js';

async function startServer() {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Create Express app
    const app = createApp();

    // 3. Create HTTP Server
    const httpServer = http.createServer(app);

    // 4. Initialize Socket.IO
    initSocketIO(httpServer, clientOrigins);

    // 5. Start listening
    httpServer.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 AIDMS Backend running at http://localhost:${env.PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${env.PORT}/api/docs`);
      console.log(`⚡ Environment: ${env.NODE_ENV}`);
      console.log(`🤖 AI Provider: ${env.AI_PROVIDER}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start AIDMS Server:', err);
    process.exit(1);
  }
}

startServer();
