'use client';

import { useState, useEffect, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { generateId, calcProgress, getNextRecurrenceDate } from '../lib/utils';

const STORAGE_KEYS = {
  lists: 'doneAndDustedLists',
  currentListId: 'doneAndDustedCurrentListId',
  theme: 'doneAndDustedTheme',
  font: 'doneAndDustedFont',
  mode: 'doneAndDustedMode',
  layout: 'doneAndDustedLayout',
  sortBy: 'doneAndDustedSortBy',
};

function checkParentCompletion(todos) {
  return todos.map((todo) => {
    if (todo.subtasks && todo.subtasks.length > 0) {
      const progress = calcProgress(todo);
      return { ...todo, completed: progress === 1 };
    }
    return todo;
  });
}

function deepUpdateSubtask(subtasks, targetId, updater) {
  return subtasks.map((s) => {
    if (s.id === targetId) return updater(s);
    if (s.subtasks && s.subtasks.length > 0) {
      return { ...s, subtasks: deepUpdateSubtask(s.subtasks, targetId, updater) };
    }
    return s;
  });
}

function deepDeleteSubtask(subtasks, targetId) {
  return subtasks
    .filter((s) => s.id !== targetId)
    .map((s) => ({
      ...s,
      subtasks: s.subtasks ? deepDeleteSubtask(s.subtasks, targetId) : [],
    }));
}

function markAllSubtasksComplete(subtasks, val) {
  return subtasks.map((s) => ({
    ...s,
    completed: val,
    subtasks: s.subtasks ? markAllSubtasksComplete(s.subtasks, val) : [],
  }));
}

export function useTodos() {
  const [lists, setLists] = useState([{ id: 'default', name: 'My Tasks', todos: [] }]);
  const [currentListId, setCurrentListId] = useState('default');
  const [theme, setTheme] = useState('rose-gold');
  const [font, setFont] = useState('inter');
  const [mode, setMode] = useState('basic');
  const [layout, setLayout] = useState('grid');
  const [sortBy, setSortBy] = useState('manual');
  const [deletedTodo, setDeletedTodo] = useState(null); // { todo, index, listId }
  const undoTimerRef = useRef(null);

  // ── Load from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    const saved = (key) => {
      try { return localStorage.getItem(key); } catch { return null; }
    };

    function migrateSubtasks(subtasks) {
      if (!Array.isArray(subtasks)) return [];
      return subtasks.map((s) => ({
        ...s,
        subtasks: migrateSubtasks(s.subtasks),
      }));
    }

    const savedLists = saved(STORAGE_KEYS.lists);
    const savedId = saved(STORAGE_KEYS.currentListId);
    const savedTheme = saved(STORAGE_KEYS.theme);
    const savedFont = saved(STORAGE_KEYS.font);
    const savedMode = saved(STORAGE_KEYS.mode);
    const savedLayout = saved(STORAGE_KEYS.layout);
    const savedSortBy = saved(STORAGE_KEYS.sortBy);

    if (savedLists) {
      const parsed = JSON.parse(savedLists);
      const migrated = parsed.map((list) => ({
        ...list,
        todos: list.todos.map((todo) => ({
          ...todo,
          subtasks: migrateSubtasks(todo.subtasks),
        })),
      }));
      setLists(migrated);
    }
    if (savedId) setCurrentListId(savedId);
    if (savedFont) setFont(savedFont);
    if (savedMode) setMode(savedMode);
    if (savedLayout) setLayout(savedLayout);
    if (savedSortBy) setSortBy(savedSortBy);

    // System dark mode detection — only if user hasn't saved a theme preference
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('charcoal');
    }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.lists, JSON.stringify(lists)); }, [lists]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.currentListId, currentListId); }, [currentListId]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.theme, theme); }, [theme]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.font, font); }, [font]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.mode, mode); }, [mode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.layout, layout); }, [layout]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.sortBy, sortBy); }, [sortBy]);

  // Cleanup undo timer on unmount
  useEffect(() => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentList = lists.find((l) => l.id === currentListId) || lists[0];
  const todos = currentList?.todos ?? [];

  function updateCurrentListTodos(updater) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === currentListId ? { ...l, todos: updater(l.todos) } : l
      )
    );
  }

  // ── Todo CRUD ─────────────────────────────────────────────────────────────
  function addTodo({ text, dueDate, priority, tag, notes, recurrence }) {
    const newTodo = {
      id: generateId(),
      text,
      completed: false,
      subtasks: [],
      dueDate: dueDate || null,
      priority: priority || 'medium',
      tag: tag || null,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      recurrence: recurrence || null,
    };
    updateCurrentListTodos((prev) => [...prev, newTodo]);
  }

  function toggleTodo(id) {
    updateCurrentListTodos((prev) => {
      const result = [];
      for (const todo of prev) {
        if (todo.id !== id) { result.push(todo); continue; }
        const newCompleted = !todo.completed;
        const updated = {
          ...todo,
          completed: newCompleted,
          subtasks: todo.subtasks ? markAllSubtasksComplete(todo.subtasks, newCompleted) : [],
        };
        result.push(updated);
        // Spawn next occurrence for recurring tasks when completing
        if (newCompleted && todo.recurrence) {
          result.push({
            id: generateId(),
            text: todo.text,
            completed: false,
            subtasks: [],
            dueDate: getNextRecurrenceDate(todo.dueDate, todo.recurrence),
            priority: todo.priority,
            tag: todo.tag,
            notes: '',
            createdAt: new Date().toISOString(),
            recurrence: todo.recurrence,
          });
        }
      }
      return result;
    });
  }

  function deleteTodo(id) {
    const todo = todos.find((t) => t.id === id);
    const index = todos.findIndex((t) => t.id === id);
    if (!todo) return;

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    updateCurrentListTodos((prev) => prev.filter((t) => t.id !== id));
    setDeletedTodo({ todo, index, listId: currentListId });

    undoTimerRef.current = setTimeout(() => {
      setDeletedTodo(null);
      undoTimerRef.current = null;
    }, 5000);
  }

  function undoDelete() {
    if (!deletedTodo) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== deletedTodo.listId) return l;
        const newTodos = [...l.todos];
        newTodos.splice(deletedTodo.index, 0, deletedTodo.todo);
        return { ...l, todos: newTodos };
      })
    );
    setDeletedTodo(null);
  }

  function dismissUndo() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setDeletedTodo(null);
  }

  function editTodo(id, newText) {
    updateCurrentListTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: newText } : t))
    );
  }

  function updateTodoNotes(id, notes) {
    updateCurrentListTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, notes } : t))
    );
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  function bulkDelete(ids) {
    updateCurrentListTodos((prev) => prev.filter((t) => !ids.has(t.id)));
  }

  function bulkComplete(ids) {
    updateCurrentListTodos((prev) =>
      prev.map((t) =>
        ids.has(t.id)
          ? { ...t, completed: true, subtasks: markAllSubtasksComplete(t.subtasks, true) }
          : t
      )
    );
  }

  function moveTodosToList(ids, targetListId) {
    const todosToMove = todos.filter((t) => ids.has(t.id));
    setLists((prev) =>
      prev.map((l) => {
        if (l.id === currentListId) return { ...l, todos: l.todos.filter((t) => !ids.has(t.id)) };
        if (l.id === targetListId) return { ...l, todos: [...l.todos, ...todosToMove] };
        return l;
      })
    );
  }

  // ── Subtask CRUD ──────────────────────────────────────────────────────────
  function addSubtask(parentId, subtaskText) {
    updateCurrentListTodos((prev) =>
      checkParentCompletion(
        prev.map((todo) => {
          if (todo.id !== parentId) return todo;
          return {
            ...todo,
            subtasks: [
              ...(todo.subtasks || []),
              { id: generateId(), text: subtaskText, completed: false, subtasks: [], notes: '' },
            ],
          };
        })
      )
    );
  }

  function toggleSubtask(rootTodoId, subtaskId, updatedSubtask = null, reorderedSubtasks = null) {
    updateCurrentListTodos((prev) =>
      checkParentCompletion(
        prev.map((todo) => {
          if (todo.id !== rootTodoId) return todo;
          if (reorderedSubtasks) return { ...todo, subtasks: reorderedSubtasks };
          return {
            ...todo,
            subtasks: deepUpdateSubtask(todo.subtasks, subtaskId, (s) =>
              updatedSubtask || { ...s, completed: !s.completed }
            ),
          };
        })
      )
    );
  }

  function deleteSubtask(rootTodoId, subtaskId) {
    updateCurrentListTodos((prev) =>
      checkParentCompletion(
        prev.map((todo) => {
          if (todo.id !== rootTodoId) return todo;
          return { ...todo, subtasks: deepDeleteSubtask(todo.subtasks, subtaskId) };
        })
      )
    );
  }

  function editSubtask(rootTodoId, subtaskId, newText) {
    updateCurrentListTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== rootTodoId) return todo;
        return {
          ...todo,
          subtasks: deepUpdateSubtask(todo.subtasks, subtaskId, (s) => ({ ...s, text: newText })),
        };
      })
    );
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (sortBy !== 'manual') setSortBy('manual');
    updateCurrentListTodos((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  // ── List management ───────────────────────────────────────────────────────
  function addList(name) {
    const newList = { id: generateId(), name, todos: [] };
    setLists((prev) => [...prev, newList]);
    setCurrentListId(newList.id);
  }

  function deleteList(listId) {
    if (lists.length === 1) return;
    setLists((prev) => {
      const filtered = prev.filter((l) => l.id !== listId);
      if (currentListId === listId) setCurrentListId(filtered[0].id);
      return filtered;
    });
  }

  function editList(listId, newName) {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, name: newName } : l))
    );
  }

  return {
    // state
    lists, currentListId, setCurrentListId,
    todos, currentList,
    theme, setTheme,
    font, setFont,
    mode, setMode,
    layout, setLayout,
    sortBy, setSortBy,
    deletedTodo, undoDelete, dismissUndo,
    // todo actions
    addTodo, toggleTodo, deleteTodo, editTodo, updateTodoNotes,
    // bulk actions
    bulkDelete, bulkComplete, moveTodosToList,
    // subtask actions
    addSubtask, toggleSubtask, deleteSubtask, editSubtask,
    // dnd
    handleDragEnd,
    // list actions
    addList, deleteList, editList,
  };
}
