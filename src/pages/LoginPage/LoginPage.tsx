
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

import './LoginPage.css';
import {Loader} from '../../components/ui/Loader'

export function LoginPage() {
  const { login, user, profile, loading } = useAuth();

 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setSubmitting(false);
    }
  };

   if (loading) {
  return <Loader />;
  }

  if (user && profile) {
  return <Navigate to="/" replace />;
}

  return (
    <main className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-form__header">
          <h1>Mini CRM</h1>
          <p>Войдите в систему управления объектами</p>
        </div>

        <label className="login-form__field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="example@mail.com"
            autoComplete="username"
            required
          />
        </label>

        <label className="login-form__field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="login-form__error" role="alert">
            {error}
          </p>
        )}

        <button
          className="login-form__submit"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
