'use client';

import { useState, useEffect } from 'react';

async function getSupabase() {
  const { supabase } = await import('../lib/supabase');
  return supabase;
}

export function useStudyLog(username) {
  const [logs, setLogs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = await getSupabase();
        const { data, error } = await sb
          .from('study_logs')
          .select('*')
          .eq('username', username)
          .order('date', { ascending: false });
        if (!cancelled && !error) setLogs(data ?? []);
      } catch {
        // table may not exist yet; stay empty
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [username]);

  // Upsert one entry per (username, date)
  async function saveLog(date, hours, notes) {
    const row = { username, date, hours, notes: notes || null };
    setLogs(prev => {
      const others = prev.filter(l => l.date !== date);
      return [...others, row].sort((a, b) => (a.date < b.date ? 1 : -1));
    });
    try {
      const sb = await getSupabase();
      const { data, error } = await sb
        .from('study_logs')
        .upsert(row, { onConflict: 'username,date' })
        .select()
        .single();
      if (!error && data) {
        setLogs(prev => {
          const others = prev.filter(l => l.date !== date);
          return [...others, data].sort((a, b) => (a.date < b.date ? 1 : -1));
        });
      }
    } catch {}
  }

  async function deleteLog(date) {
    setLogs(prev => prev.filter(l => l.date !== date));
    try {
      const sb = await getSupabase();
      await sb.from('study_logs').delete().eq('username', username).eq('date', date);
    } catch {}
  }

  return { logs, ready, saveLog, deleteLog };
}
