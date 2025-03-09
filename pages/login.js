import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        router.push('/');
      } else {
        setError(data.message || 'Ошибка входа');
      }
    } catch (err) {
      setError('Произошла ошибка при попытке входа');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Вход в систему</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.formGroup}>
          <label htmlFor="username">Имя пользователя:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">Пароль:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.button}>Войти</button>
      </form>
    </div>
  );
}