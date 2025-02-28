import { createClient } from 'redis';

export async function getServerSideProps() {
  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
  const redisPassword = encodeURIComponent(REDIS_PASSWORD);
  const redisUrl = `redis://default:${redisPassword}@${REDIS_HOST}:${REDIS_PORT}`;

  const client = createClient({ url: redisUrl });
  try {
    await client.connect();
  } catch (err) {
    console.error('Ошибка подключения к Redis:', err);
    return { props: { data: {} } };
  }

  const keys = await client.keys('*');
  let data = {};
  if (keys.length > 0) {
    const values = await client.mGet(keys);
    keys.forEach((key, index) => {
      data[key] = values[index];
    });
  }
  await client.disconnect();

  return { props: { data } };
}

export default function Home({ data }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Данные из Redis</h1>
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