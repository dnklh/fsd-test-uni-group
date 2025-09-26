import { createClient } from 'redis';
import Queue from 'bull';

// Redis client for general use
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize Redis connection
export const initializeRedis = async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connection established successfully');
  } catch (error) {
    console.error('❌ Error connecting to Redis:', error);
    process.exit(1);
  }
};

// Bull queue for background jobs
export const githubQueue = new Queue('github data fetching', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

console.log('🔄 GitHub queue initialized');
