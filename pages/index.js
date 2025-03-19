import { useState } from 'react';
import { performance } from 'perf_hooks';
import { useRouter } from 'next/router';
import * as cookie from 'cookie';
import { getRedisClient } from '../lib/redis';

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

  let client;
  let connectTime = null;
  let fetchTime = null;
  let isAuthenticated = false;
  let data = {}; // Гарантируем, что data не undefined

  try {
    const startConnect = performance.now();
    client = await getRedisClient();
    connectTime = performance.now() - startConnect;

    // Проверка сессии
    const username = await client.get(`session:${sessionId}`);
    if (!username) {
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

    // Получаем все ключи без фильтрации
    const keys = await client.keys('*');

    if (keys.length > 0) {
      try {
        const values = await client.mGet(keys);
        keys.forEach((key, index) => {
          data[key] = values[index] !== undefined ? values[index] : '';
        });
      } catch (err) {
        console.error('Ошибка при mGet:', err);
      }
    }

    fetchTime = performance.now() - startFetch;
  } catch (err) {
    console.error('Ошибка при работе с Redis:', err);
  } finally {
    if (client) await client.disconnect();
  }

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
        <p>Нет данных в базе.</p>
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
