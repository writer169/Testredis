import { useState } from 'react';
import { createClient } from 'redis';
import { performance } from 'perf_hooks';
import { useRouter } from 'next/router';
import cookie from 'cookie';

export async function getServerSideProps({ req, res }) {
  // Проверяем наличие cookie
  let cookies = {};
  try {
    const cookieHeader = req.headers?.cookie || '';
    cookies = cookie.parse(cookieHeader);
  } catch (error) {
    console.error('Ошибка разбора cookie:', error);
  }

  const sessionId = cookies.sessionId || null;
  if (!sessionId) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Проверяем переменные окружения
  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
  if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
    console.error('Ошибка: отсутствуют параметры для Redis.');
    return { props: { error: 'Ошибка конфигурации Redis' } };
  }

  const redisPassword = encodeURIComponent(REDIS_PASSWORD);
  const redisUrl = `redis://default:${redisPassword}@${REDIS_HOST}:${REDIS_PORT}`;

  const client = createClient({ url: redisUrl });

  let connectTime = null;
  let fetchTime = null;
  let isAuthenticated = false;
  let data = {}; // Гарантируем, что data не undefined

  try {
    const startConnect = performance.now();
    await client.connect();
    connectTime = performance.now() - startConnect;

    // Проверка сессии
    const username = await client.get(`session:${sessionId}`);
    if (!username) {
      await client.disconnect();
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    isAuthenticated = true;

    // Запрос данных из Redis
    const startFetch = performance.now();
    const keys = await client.keys('*');

    if (keys.length > 0) {
      const filteredKeys = keys.filter(key => !key.startsWith('session:'));
      if (filteredKeys.length > 0) {
        try {
          const values = await client.mGet(filteredKeys);
          filteredKeys.forEach((key, index) => {
            data[key] = values[index] !== undefined ? values[index] : '';
          });
        } catch (err) {
          console.error('Ошибка при mGet:', err);
        }
      }
    }

    fetchTime = performance.now() - startFetch;
    await client.disconnect();
  } catch (err) {
    console.error('Ошибка при работе с Redis:', err);
  }

  console.log('Данные перед рендерингом:', { data, connectTime, fetchTime, isAuthenticated });

  return { props: { data, connectTime, fetchTime, isAuthenticated } };
}

export default function Home({ data = {}, connectTime = null, fetchTime = null, isAuthenticated = false }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Данные из Redis</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Выйти
        </button>
      </div>

      <p><strong>Время подключения:</strong> {connectTime ? `${connectTime.toFixed(2)} мс` : 'Ошибка'}</p>
      <p><strong>Время получения данных:</strong> {fetchTime ? `${fetchTime.toFixed(2)} мс` : 'Ошибка'}</p>

      {Object.keys(data).length === 0 ? (
        <p>Нет данных в базе (кроме сессий).</p>
      ) : (
        <ul>
          {Object.entries(data).map(([key, value]) => (
            <li key={key}>
              <strong>{key}:</strong> {value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}