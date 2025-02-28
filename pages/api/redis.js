import { createClient } from 'redis';

export default async function handler(req, res) {
  try {
    const client = createClient({
      url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    });

    client.on('error', err => console.log('Redis Client Error', err));
    
    await client.connect();
    
    // Пример: получаем значение по ключу 'test'
    const value = await client.get('test');
    
    await client.quit();

    res.status(200).json({
      status: 'success',
      data: value || 'No data found for key "test"'
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}