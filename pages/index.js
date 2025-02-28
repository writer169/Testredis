import { createClient } from 'redis';
import { performance } from 'perf_hooks';

export async function getServerSideProps() {
  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
  const redisPassword = encodeURIComponent(REDIS_PASSWORD);
  const redisUrl = `redis://default:${redisPassword}@${REDIS_HOST}:${REDIS_PORT}`;

  const client = createClient({ url: redisUrl });

  let connectTime, fetchTime;

  try {
    const startConnect = performance.now();
    await client.connect();
    connectTime = performance.now() - startConnect;
  } catch (err) {
    console.error('Ошибка подключения к Redis:', err);
    return { props: { data: {}, connectTime: null, fetchTime: null } };
  }

  const startFetch = performance.now();
  const keys = await client.keys('*');
  let data = {};

  if (keys.length > 0) {
    const values = await client.mGet(keys);
    keys.forEach((key, index) => {
      data[key] = values[index];
    });
  }
  fetchTime = performance.now() - startFetch;

  await client.disconnect();

  return { props: { data, connectTime, fetchTime } };
}

export default function Home({ data, connectTime, fetchTime }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Данные из Redis</h1>
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