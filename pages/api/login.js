import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as cookie from 'cookie';  // Исправленный импорт
import { getRedisClient } from '../../lib/redis';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 дней

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  // Парсим тело запроса
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Требуются имя пользователя и пароль' });
  }

  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
  }

  const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
  }

  let client;
  try {
    client = await getRedisClient();
    if (!client) throw new Error('Не удалось получить Redis-клиент');

    const sessionId = uuidv4();
    await client.set(`session:${sessionId}`, username, { EX: SESSION_DURATION });

    res.setHeader(
      'Set-Cookie',
      cookie.serialize('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: SESSION_DURATION,
        sameSite: 'strict',
        path: '/',
      })
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Ошибка при работе с Redis:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  } finally {
    if (client) await client.disconnect();
  }
}