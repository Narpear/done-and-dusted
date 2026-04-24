'use client';
import { useState } from 'react';

export default function UserSetupModal({ onSave, isDarkTheme }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`glass rounded-2xl p-8 shadow-2xl w-full max-w-sm mx-4 ${isDarkTheme ? 'bg-gray-900/95' : 'bg-white/95'}`}>
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${isDarkTheme ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold mb-1 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            Pick a username
          </h2>
          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
            This is how others in shared rooms will see you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. alex, prerana, jess…"
            maxLength={30}
            autoFocus
            className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:border-blue-500 focus:ring-0 outline-none ${
              isDarkTheme
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
            }`}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            Let&apos;s go
          </button>
        </form>
      </div>
    </div>
  );
}
