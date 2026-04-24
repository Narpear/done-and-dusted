'use client';
import { useState, useEffect } from 'react';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

export function useUser() {
  const [username, setUsername] = useState(null);
  const [color, setColor] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('dd_user') || 'null');
    if (stored?.username) {
      setUsername(stored.username);
      setColor(stored.color);
    }
    setReady(true);
  }, []);

  function saveUser(name) {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    const user = { username: name.trim(), color: c };
    localStorage.setItem('dd_user', JSON.stringify(user));
    setUsername(user.username);
    setColor(user.color);
  }

  return { username, color, ready, saveUser, needsSetup: ready && !username };
}
