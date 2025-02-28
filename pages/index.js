import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/redis')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Redis Data Test</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Status: {data.status}</p>
          <p>Data: {data.data}</p>
        </div>
      )}
    </div>
  );
}