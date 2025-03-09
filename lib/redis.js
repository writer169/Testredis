// lib/redis.js
import { createClient } from 'redis';

// Инициализация Redis клиента (только на сервере)
export async function getRedisClient() {
  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
  
  if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
    throw new Error('Redis environment variables are not defined');
  }
  
  const redisPassword = encodeURIComponent(REDIS_PASSWORD);
  const redisUrl = `redis://default:${redisPassword}@${REDIS_HOST}:${REDIS_PORT}`;
  
  const client = createClient({ url: redisUrl });
  await client.connect();
  
  return client;
}