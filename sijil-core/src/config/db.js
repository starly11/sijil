import mongoose from 'mongoose';
import { config } from './env.js';

// 1. Set global mongoose configurations
mongoose.set('strictQuery', true);

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms 
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connects to MongoDB with an exponential backoff retry strategy.
 * Retries 5 times with delays: 1s, 2s, 4s, 8s, 16s.
 */
export const connectDB = async () => {
  const MAX_RETRIES = 5;
  let attempt = 1;

  while (attempt <= MAX_RETRIES) {
    try {
      console.log(`🔌 Attempting MongoDB connection (Attempt ${attempt}/${MAX_RETRIES})...`);
      
      // Normalize connection string to handle retryable writes explicitly
      let connectionUri = config.MONGODB_URI;
      const hasRetryWrites = connectionUri.includes('retryWrites');
      
      if (!hasRetryWrites) {
        const separator = connectionUri.includes('?') ? '&' : '?';
        connectionUri += `${separator}retryWrites=false`;
      }

      await mongoose.connect(connectionUri, {
        // Modern Mongoose driver options can be fine-tuned here if needed
      });

      console.log('✅ MongoDB connected successfully.');
      return; // Exit function on success
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === MAX_RETRIES) {
        throw new Error(`MongoDB connection failed after ${MAX_RETRIES} attempts. original error: ${error.message}`);
      }

      // Calculate exponential backoff: 2^(attempt - 1) * 1000ms
      // Attempt 1: 2^0 * 1000 = 1000ms (1s)
      // Attempt 2: 2^1 * 1000 = 2000ms (2s)
      // Attempt 3: 2^2 * 1000 = 4000ms (4s)...
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      console.warn(`⏳ Retrying in ${backoffMs / 1000} seconds...`);
      
      await delay(backoffMs);
      attempt++;
    }
  }
};

// 2. Listen for standard mongoose connection lifecycle events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected! Application might lose database access.');
});

mongoose.connection.on('connected', () => {
  // Useful if Mongoose automatically reconnects internally after a transient drop
  console.log('🔄 MongoDB reconnected / established.');
});

mongoose.connection.on('error', (err) => {
  console.error(`🚨 MongoDB connection error: ${err.message}`);
});

// 3. Export the connection object for system health checks
export const dbConnection = mongoose.connection;