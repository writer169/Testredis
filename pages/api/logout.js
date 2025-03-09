// pages/api/logout.js
import * as cookie from 'cookie';
import { getRedisClient } from '../../lib/redis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { sessionId } = cookie.parse(req.headers.cookie || '');
  
  if (!sessionId) {
    return res.status(200).json({ success: true });
  }

  let client;
  try {
    client = await getRedisClient();
    
    // Удаление сессии из Redis
    await client.del(`session:${sessionId}`);
  } catch (err) {
    console.error('Ошибка при работе с Redis:', err);
  } finally {
    if (client) await client.disconnect();
  }

  // Удаление cookie
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('sessionId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      expires: new Date(0),
      sameSite: 'strict',
      path: '/',
    })
  );

  return res.status(200).json({ success: true });
}
