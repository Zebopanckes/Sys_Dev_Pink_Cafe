import { FormEvent, useState } from 'react';
import { AuthUser } from '../types';
import { login } from '../services/api';

interface LoginFormProps {
  onLoggedIn: (user: AuthUser) => void;
}

export function LoginForm({ onLoggedIn }: LoginFormProps) {
  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('manager123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      onLoggedIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(135deg, #fff4f8 0%, #f8f5ff 100%)',
      padding: '1rem',
    }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 430,
          backgroundColor: '#fff',
          borderRadius: 14,
          border: '1px solid #f1dbe5',
          boxShadow: '0 8px 30px rgba(30, 20, 40, 0.08)',
          padding: '1.5rem',
        }}
        aria-label="Login form"
      >
        <h1 style={{ margin: '0 0 0.35rem', color: '#b31257', fontSize: '1.35rem' }}>Bristol Pink Cafe</h1>
        <p style={{ margin: '0 0 1rem', color: '#555', fontSize: '0.92rem' }}>
          Sign in to access dashboard features by role.
        </p>

        <label htmlFor="username" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#333' }}>
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '0.58rem', borderRadius: 8, border: '1px solid #d8c8d0', marginBottom: '0.8rem' }}
          autoComplete="username"
          aria-required="true"
        />

        <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#333' }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '0.58rem', borderRadius: 8, border: '1px solid #d8c8d0', marginBottom: '0.9rem' }}
          autoComplete="current-password"
          aria-required="true"
        />

        {error && (
          <div role="alert" style={{ marginBottom: '0.7rem', color: '#b00020', fontSize: '0.86rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.65rem 0.8rem',
            border: 'none',
            borderRadius: 8,
            backgroundColor: loading ? '#c8a2b6' : '#e91e63',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          aria-label="Sign in"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p style={{ marginTop: '0.9rem', color: '#666', fontSize: '0.82rem', lineHeight: 1.5 }}>
          Demo users: manager/manager123, analyst/analyst123, viewer/viewer123.
        </p>
      </form>
    </div>
  );
}
