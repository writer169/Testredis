import { createClient } from 'redis';

export async function getServerSideProps() {
  // Создаем клиент Redis, указываем URL из переменной окружения
  const client = createClient({
    url: process.env.REDIS_URL
  });

  await client.connect();

  // Получаем все ключи (при небольшом объеме данных это вполне ок)
  const keys = await client.keys('*');

  let data = {};
  if (keys.length > 0) {
    // Получаем значения для всех ключей
    const values = await client.mGet(keys);
    keys.forEach((key, index) => {
      data[key] = values[index];
    });
  }

  await client.disconnect();

  return {
    props: { data }
  };
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