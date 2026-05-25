'use client';

import { useState, useEffect, useCallback } from 'react';

// Supabase is loaded dynamically so the hook also works without a DB table yet.
async function getSupabase() {
  const { supabase } = await import('../lib/supabase');
  return supabase;
}

export function useCalendarEvents(username) {
  const [events, setEvents]   = useState([]);
  const [ready,  setReady]    = useState(false);

  // ── Load from Supabase on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = await getSupabase();
        const { data, error } = await sb
          .from('calendar_events')
          .select('*')
          .eq('username', username)
          .order('date', { ascending: true });
        if (!cancelled && !error) setEvents(data ?? []);
      } catch {
        // table may not exist yet; stay empty
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [username]);

  // ── Write helpers ──────────────────────────────────────────────────────────
  async function addEvent(fields) {
    const row = {
      username,
      title:     fields.title,
      date:      fields.date,
      time:      fields.time    ?? null,
      end_date:  fields.endDate ?? null,
      type:      fields.type    || null,
      tags:      fields.tags    ?? [],
      color:     fields.color   ?? null,
      notes:     fields.notes   || null,
      completed: false,
    };
    try {
      const sb = await getSupabase();
      const { data, error } = await sb
        .from('calendar_events')
        .insert(row)
        .select()
        .single();
      if (!error && data) {
        setEvents(prev => [...prev, normalise(data)]);
        return normalise(data);
      }
    } catch {}
    // optimistic fallback
    const fake = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setEvents(prev => [...prev, normalise(fake)]);
    return normalise(fake);
  }

  async function updateEvent(id, fields) {
    const patch = {
      title:    fields.title,
      date:     fields.date,
      time:     fields.time    ?? null,
      end_date: fields.endDate ?? null,
      type:     fields.type    || null,
      tags:     fields.tags    ?? [],
      color:    fields.color   ?? null,
      notes:    fields.notes   || null,
    };
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...fields, endDate: fields.endDate } : e));
    try {
      const sb = await getSupabase();
      await sb.from('calendar_events').update(patch).eq('id', id);
    } catch {}
  }

  async function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
    try {
      const sb = await getSupabase();
      await sb.from('calendar_events').delete().eq('id', id);
    } catch {}
  }

  async function toggleComplete(id) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    try {
      const sb = await getSupabase();
      await sb.from('calendar_events').update({ completed: !ev.completed }).eq('id', id);
    } catch {}
  }

  return { events, ready, addEvent, updateEvent, deleteEvent, toggleComplete };
}

// Map DB snake_case → component camelCase
function normalise(row) {
  return {
    id:        row.id,
    username:  row.username,
    title:     row.title,
    date:      row.date,
    time:      row.time      ?? null,
    endDate:   row.end_date  ?? null,
    type:      row.type      ?? '',
    tags:      row.tags      ?? [],
    color:     row.color     ?? null,
    notes:     row.notes     ?? null,
    completed: row.completed ?? false,
    createdAt: row.created_at,
  };
}
