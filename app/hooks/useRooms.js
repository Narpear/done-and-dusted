'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useRooms(username) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRooms = useCallback(async () => {
    if (!username) return;
    const { data } = await supabase
      .from('room_members')
      .select('room_id, rooms(id, name, code, owner)')
      .eq('username', username);
    if (data) {
      setRooms(data.filter((m) => m.rooms).map((m) => m.rooms));
    }
  }, [username]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  async function createRoom(name) {
    if (!username) return null;
    setLoading(true);
    setError(null);
    try {
      const code = generateCode();
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .insert({ name, code, owner: username })
        .select()
        .single();
      if (roomErr) throw roomErr;

      await supabase.from('room_members').insert({ room_id: room.id, username, color: '#6366f1' });
      await supabase.from('room_lists').insert({ room_id: room.id, name: 'Tasks', created_by: username });
      await supabase.from('room_activity').insert({
        room_id: room.id, username, action: 'join_room', entity_text: room.name,
      });

      await loadRooms();
      return room;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom(code) {
    if (!username) return null;
    setLoading(true);
    setError(null);
    try {
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select()
        .eq('code', code.toUpperCase().trim())
        .single();
      if (roomErr || !room) throw new Error('Room not found or expired');

      await supabase
        .from('room_members')
        .upsert({ room_id: room.id, username, color: '#6366f1', last_seen_at: new Date().toISOString() }, { onConflict: 'room_id,username' });

      await supabase.from('room_activity').insert({
        room_id: room.id, username, action: 'join_room', entity_text: room.name,
      });

      await loadRooms();
      return room;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function leaveRoom(roomId) {
    if (!username) return;
    await supabase.from('room_members').delete().eq('room_id', roomId).eq('username', username);
    await loadRooms();
  }

  async function deleteRoom(roomId) {
    // Only the owner can delete; cascade handles all child rows
    await supabase.from('rooms').delete().eq('id', roomId);
    await loadRooms();
  }

  return { rooms, loading, error, setError, createRoom, joinRoom, leaveRoom, deleteRoom, reload: loadRooms };
}
