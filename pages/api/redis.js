import { createClient } from 'redis';

export default async function handler(req, res) {
  let client;
  try {
    // Создаем клиент с паролем из переменных окружения
    client = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    });

    // Обработчик ошибок подключения
    client.on('error', err => {
      console.error('Redis Client Error:', err);
      throw new Error('Redis connection failed');
    });

    // Устанавливаем соединение
    await client.connect();

    // Получаем значение по ключу 'test' (можно динамически через req.query)
    const value = await client.get('test');

    // Закрываем соединение
    await client.quit();

    // Отправляем результат
    res.status(200).json({
      status: 'success',
      data: value || 'Key "test" not found in Redis'
    });

  } catch (error) {
    // Закрываем соединение при ошибке (если клиент был создан)
    if (client) {
      await client.quit().catch(quitError => 
        console.error('Redis quit error:', quitError)
      );
    }

    // Логируем ошибку и отправляем ответ
    console.error('API Error:', error);
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Failed to fetch data from Redis'
    });
  }
}