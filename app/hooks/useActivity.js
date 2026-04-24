'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useActivity(roomId) {
  const [events, setEvents] = useState([]);
  const channelRef = useRef(null);

  async function load() {
    if (!roomId) return;
    const { data } = await supabase
      .from('room_activity')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(60);
    if (data) setEvents(data);
  }

  useEffect(() => {
    if (!roomId) { setEvents([]); return; }
    load();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`activity_${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'room_activity',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setEvents((prev) => [payload.new, ...prev].slice(0, 60));
      })
      .subscribe();
    channelRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return { events };
}
