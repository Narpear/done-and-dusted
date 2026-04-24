'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

function normalize(t) {
  return {
    id: t.id,
    text: t.text,
    completed: t.completed,
    priority: t.priority || 'medium',
    tag: t.tag || '',
    dueDate: t.due_date || '',
    notes: t.notes || '',
    subtasks: t.subtasks || [],
    recurrence: t.recurrence || null,
    assignedTo: t.assigned_to || null,
    completedBy: t.completed_by || null,
    createdBy: t.created_by || null,
    createdAt: t.created_at,
    orderIndex: t.order_index || 0,
  };
}

export function useRoomTodos(roomId, username) {
  const [lists, setLists] = useState([]);
  const [currentListId, setCurrentListId] = useState(null);
  const [todos, setTodos] = useState([]);
  const [members, setMembers] = useState([]);
  const subRef = useRef(null);

  const loadLists = useCallback(async () => {
    if (!roomId) return;
    const { data, error } = await supabase
      .from('room_lists')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at');
    if (error) { console.error('loadLists error:', error); return; }
    if (data) {
      setLists(data);
      setCurrentListId((prev) => prev && data.find((l) => l.id === prev) ? prev : (data[0]?.id || null));
      if (data.length === 0) {
        // Room has no list yet — create a default one
        const { data: newList, error: createErr } = await supabase
          .from('room_lists')
          .insert({ room_id: roomId, name: 'Tasks', created_by: 'system' })
          .select().single();
        if (!createErr && newList) {
          setLists([newList]);
          setCurrentListId(newList.id);
        }
      }
    }
  }, [roomId]);

  const loadMembers = useCallback(async () => {
    if (!roomId) return;
    const { data } = await supabase
      .from('room_members')
      .select('username, color')
      .eq('room_id', roomId);
    if (data) setMembers(data);
  }, [roomId]);

  const loadTodos = useCallback(async () => {
    if (!currentListId) { setTodos([]); return; }
    const { data } = await supabase
      .from('room_todos')
      .select('*')
      .eq('list_id', currentListId)
      .order('order_index');
    if (data) setTodos(data.map(normalize));
  }, [currentListId]);

  useEffect(() => {
    if (!roomId) { setLists([]); setTodos([]); setMembers([]); setCurrentListId(null); return; }
    loadLists();
    loadMembers();
  }, [roomId, loadLists, loadMembers]);

  useEffect(() => {
    loadTodos();
    if (subRef.current) supabase.removeChannel(subRef.current);
    if (!currentListId) return;

    const channel = supabase
      .channel(`room_todos_${currentListId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_todos',
        filter: `list_id=eq.${currentListId}`,
      }, loadTodos)
      .subscribe();

    subRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [currentListId, loadTodos]);

  // ── Write helpers (optimistic updates) ────────────────────────────────────

  async function addTodo(fields) {
    if (!currentListId) { console.error('addTodo: no list in this room'); return; }
    if (!username) { console.error('addTodo: no username'); return; }
    const tempId = crypto.randomUUID();
    const optimistic = {
      id: tempId, text: fields.text, completed: false,
      priority: fields.priority || 'medium', tag: fields.tag || '',
      dueDate: fields.dueDate || '', notes: '', subtasks: [],
      recurrence: fields.recurrence || null, assignedTo: null,
      completedBy: null, createdBy: username,
      createdAt: new Date().toISOString(), orderIndex: todos.length,
    };
    setTodos((prev) => [...prev, optimistic]);
    const { data, error } = await supabase.from('room_todos').insert({
      list_id: currentListId,
      text: fields.text,
      priority: fields.priority || 'medium',
      tag: fields.tag || null,
      due_date: fields.dueDate || null,
      recurrence: fields.recurrence || null,
      created_by: username,
      order_index: todos.length,
    }).select().single();
    if (error) {
      console.error('addTodo error:', error);
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
      return;
    }
    setTodos((prev) => prev.map((t) => t.id === tempId ? normalize(data) : t));
    supabase.from('room_activity').insert({
      room_id: roomId, username, action: 'add_task', entity_text: fields.text,
    });
  }

  async function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const completed = !todo.completed;
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed, completedBy: completed ? username : null } : t));
    await supabase.from('room_todos').update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? username : null,
    }).eq('id', id);
    if (completed) {
      supabase.from('room_activity').insert({
        room_id: roomId, username, action: 'complete_task', entity_text: todo.text,
      });
    }
  }

  async function deleteTodo(id) {
    const todo = todos.find((t) => t.id === id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from('room_todos').delete().eq('id', id);
    if (error) {
      console.error('deleteTodo error:', error);
      if (todo) setTodos((prev) => [...prev, todo]);
      return;
    }
    if (todo) {
      supabase.from('room_activity').insert({
        room_id: roomId, username, action: 'delete_task', entity_text: todo.text,
      });
    }
  }

  async function editTodo(id, text) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, text } : t));
    await supabase.from('room_todos').update({ text }).eq('id', id);
  }

  async function updateTodoNotes(id, notes) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, notes } : t));
    await supabase.from('room_todos').update({ notes }).eq('id', id);
  }

  async function assignTodo(id, assignedTo) {
    const todo = todos.find((t) => t.id === id);
    await supabase.from('room_todos').update({ assigned_to: assignedTo }).eq('id', id);
    if (todo) {
      await supabase.from('room_activity').insert({
        room_id: roomId, username, action: 'assign_task', entity_text: todo.text,
        details: { assigned_to: assignedTo },
      });
    }
  }

  async function addSubtask(todoId, text) {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const subtasks = [...todo.subtasks, { id: crypto.randomUUID(), text, completed: false, subtasks: [] }];
    await supabase.from('room_todos').update({ subtasks }).eq('id', todoId);
  }

  async function toggleSubtask(todoId, subtaskId, _unused, newSubtasks) {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const subtasks = newSubtasks
      ? newSubtasks
      : todo.subtasks.map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    await supabase.from('room_todos').update({ subtasks }).eq('id', todoId);
  }

  async function deleteSubtask(todoId, subtaskId) {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const subtasks = todo.subtasks.filter((s) => s.id !== subtaskId);
    await supabase.from('room_todos').update({ subtasks }).eq('id', todoId);
  }

  async function editSubtask(todoId, subtaskId, text) {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const subtasks = todo.subtasks.map((s) => s.id === subtaskId ? { ...s, text } : s);
    await supabase.from('room_todos').update({ subtasks }).eq('id', todoId);
  }

  async function addList(name) {
    if (!roomId || !username) return;
    const { data } = await supabase
      .from('room_lists')
      .insert({ room_id: roomId, name, created_by: username })
      .select()
      .single();
    await loadLists();
    if (data) setCurrentListId(data.id);
    await supabase.from('room_activity').insert({
      room_id: roomId, username, action: 'add_list', entity_text: name,
    });
  }

  return {
    lists, currentListId, setCurrentListId,
    todos, members,
    addTodo, toggleTodo, deleteTodo, editTodo, updateTodoNotes, assignTodo,
    addList,
    addSubtask, toggleSubtask, deleteSubtask, editSubtask,
  };
}
