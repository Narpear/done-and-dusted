'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const PING_MS = 10_000;
const STALE_MS = 35_000;

export function usePresence(roomId, username) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const intervalRef = useRef(null);
  const channelRef = useRef(null);

  async function ping() {
    if (!roomId || !username) return;
    await supabase.from('room_presence').upsert(
      { room_id: roomId, username, last_ping_at: new Date().toISOString() },
      { onConflict: 'room_id,username' }
    );
  }

  async function fetchOnline() {
    if (!roomId) return;
    const cutoff = new Date(Date.now() - STALE_MS).toISOString();
    const { data: presence } = await supabase
      .from('room_presence')
      .select('username')
      .eq('room_id', roomId)
      .gte('last_ping_at', cutoff);
    if (!presence) return;

    const { data: members } = await supabase
      .from('room_members')
      .select('username, color')
      .eq('room_id', roomId);

    const colorMap = Object.fromEntries((members || []).map((m) => [m.username, m.color]));
    setOnlineUsers(presence.map((p) => ({ username: p.username, color: colorMap[p.username] || '#6366f1' })));
  }

  useEffect(() => {
    if (!roomId || !username) { setOnlineUsers([]); return; }

    ping();
    fetchOnline();
    intervalRef.current = setInterval(() => { ping(); fetchOnline(); }, PING_MS);

    const channel = supabase
      .channel(`presence_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_presence', filter: `room_id=eq.${roomId}` }, fetchOnline)
      .subscribe();
    channelRef.current = channel;

    return () => {
      clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
      supabase.from('room_presence').delete().eq('room_id', roomId).eq('username', username);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, username]);

  return { onlineUsers };
}
