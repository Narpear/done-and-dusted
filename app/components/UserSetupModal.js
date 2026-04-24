'use client';
import { useState } from 'react';

export default function UserSetupModal({ onSignup, onLogin, isDarkTheme }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    const result = tab === 'signup'
      ? await onSignup(username, password)
      : await onLogin(username, password);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  const input = `w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none ${
    isDarkTheme
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-gray-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-400'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`rounded-2xl p-8 shadow-2xl w-full max-w-sm mx-4 ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>

        <div className="text-center mb-6">
          <h2 className={`text-xl font-bold mb-1 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            Done and Dusted
          </h2>
          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
            {tab === 'signup' ? 'Create an account to get started.' : 'Welcome back.'}
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex rounded-xl overflow-hidden border mb-6 ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
          {['login', 'signup'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-gray-700 text-white'
                  : isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            maxLength={30}
            autoFocus
            autoComplete="username"
            className={input}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              className={`${input} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${isDarkTheme ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
                  <path d="M10.73 10.73a3 3 0 004.54 4.54"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-500 pt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || loading}
            className="w-full py-3 mt-1 bg-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            {loading ? '…' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
