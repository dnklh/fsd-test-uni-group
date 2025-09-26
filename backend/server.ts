import app from './app';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';

// Import queue service to start processing jobs
import './services/queueService';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    console.log('📊 Database initialized successfully');

    // Initialize Redis connection
    await initializeRedis();
    console.log('🔴 Redis initialized successfully');

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📖 API Documentation available at http://localhost:${PORT}`);
      console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔧 Development mode endpoints:');
        console.log(`   • Register: POST http://localhost:${PORT}/api/auth/register`);
        console.log(`   • Login: POST http://localhost:${PORT}/api/auth/login`);
        console.log(`   • Projects: GET http://localhost:${PORT}/api/projects`);
        console.log(`   • Add Project: POST http://localhost:${PORT}/api/projects`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
