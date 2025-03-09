import { useState } from 'react';
import { createClient } from 'redis';
import { performance } from 'perf_hooks';
import { useRouter } from 'next/router';
import cookie from 'cookie';

export async function getServerSideProps({ req, res }) {
  // Проверка аутентификации
  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies.sessionId;

  if (!sessionId) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
  const redisPassword = encodeURIComponent(REDIS_PASSWORD);
  const redisUrl = `redis://default:${redisPassword}@${REDIS_HOST}:${REDIS_PORT}`;

  const client = createClient({ url: redisUrl });

  let connectTime, fetchTime, isAuthenticated = false;

  try {
    const startConnect = performance.now();
    await client.connect();
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
  } catch (err) {
    console.error('Ошибка подключения к Redis:', err);
    return { props: { data: {}, connectTime: null, fetchTime: null, username: null } };
  }

  const startFetch = performance.now();
  const keys = await client.keys('*');
  let data = {};

  if (keys.length > 0) {
    const filteredKeys = keys.filter(key => !key.startsWith('session:'));
    if (filteredKeys.length > 0) {
      const values = await client.mGet(filteredKeys);
      filteredKeys.forEach((key, index) => {
        data[key] = values[index];
      });
    }
  }
  fetchTime = performance.now() - startFetch;

  await client.disconnect();

  return { props: { data, connectTime, fetchTime, isAuthenticated } };
}

export default function Home({ data, connectTime, fetchTime, isAuthenticated }) {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
      });
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