'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

async function hashPassword(username, password) {
  const salted = `${username.toLowerCase()}:${password}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salted));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useUser() {
  const [username, setUsername] = useState(null);
  const [color, setColor] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('dd_user') || 'null');
    if (stored?.username && stored?.verified) {
      setUsername(stored.username);
      setColor(stored.color);
    }
    setReady(true);
  }, []);

  async function signup(usernameInput, password) {
    const name = usernameInput.trim();
    const hash = await hashPassword(name, password);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .eq('username', name)
      .maybeSingle();

    if (existing) return { error: 'Username already taken — try another.' };

    const { error } = await supabase
      .from('users')
      .insert({ username: name, password_hash: hash, color });

    if (error) return { error: 'Could not create account. Try again.' };

    const user = { username: name, color, verified: true };
    localStorage.setItem('dd_user', JSON.stringify(user));
    setUsername(name);
    setColor(color);
    return { error: null };
  }

  async function login(usernameInput, password) {
    const name = usernameInput.trim();
    const hash = await hashPassword(name, password);

    const { data } = await supabase
      .from('users')
      .select('username, color')
      .eq('username', name)
      .eq('password_hash', hash)
      .maybeSingle();

    if (!data) return { error: 'Incorrect username or password.' };

    const user = { username: data.username, color: data.color, verified: true };
    localStorage.setItem('dd_user', JSON.stringify(user));
    setUsername(data.username);
    setColor(data.color);
    return { error: null };
  }

  function logout() {
    localStorage.removeItem('dd_user');
    setUsername(null);
    setColor(null);
  }

  return { username, color, ready, signup, login, logout, needsSetup: ready && !username };
}
