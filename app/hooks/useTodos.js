'use client';

import { useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { generateId, calcProgress } from '../lib/utils';

const STORAGE_KEYS = {
  lists: 'doneAndDustedLists',
  currentListId: 'doneAndDustedCurrentListId',
  theme: 'doneAndDustedTheme',
  font: 'doneAndDustedFont',
  mode: 'doneAndDustedMode',
  layout: 'doneAndDustedLayout',
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

// Recursively updates a subtask anywhere in the tree by id
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

export function useTodos() {
  const [lists, setLists] = useState([{ id: 'default', name: 'My Tasks', todos: [] }]);
  const [currentListId, setCurrentListId] = useState('default');
  const [theme, setTheme] = useState('rose-gold');
  const [font, setFont] = useState('inter');
  const [mode, setMode] = useState('basic');
  const [layout, setLayout] = useState('grid');

  // ── Load from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    const saved = (key) => {
      try { return localStorage.getItem(key); } catch { return null; }
    };

    // Ensure every subtask (at any depth) has a subtasks array
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

    if (savedLists) {
      const parsed = JSON.parse(savedLists);
      // Migrate: ensure subtasks arrays exist at all depths
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
    if (savedTheme) setTheme(savedTheme);
    if (savedFont) setFont(savedFont);
    if (savedMode) setMode(savedMode);
    if (savedLayout) setLayout(savedLayout);
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.lists, JSON.stringify(lists)); }, [lists]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.currentListId, currentListId); }, [currentListId]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.theme, theme); }, [theme]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.font, font); }, [font]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.mode, mode); }, [mode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.layout, layout); }, [layout]);

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
  function addTodo({ text, dueDate, priority, tag, notes }) {
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
    };
    updateCurrentListTodos((prev) => [...prev, newTodo]);
  }

  function toggleTodo(id) {
    updateCurrentListTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== id) return todo;
        const newCompleted = !todo.completed;
        const markSubtasks = (subtasks, val) =>
          subtasks.map((s) => ({
            ...s,
            completed: val,
            subtasks: s.subtasks ? markSubtasks(s.subtasks, val) : [],
          }));
        return {
          ...todo,
          completed: newCompleted,
          subtasks: todo.subtasks ? markSubtasks(todo.subtasks, newCompleted) : [],
        };
      })
    );
  }

  function deleteTodo(id) {
    updateCurrentListTodos((prev) => prev.filter((t) => t.id !== id));
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
    // todo actions
    addTodo, toggleTodo, deleteTodo, editTodo, updateTodoNotes,
    // subtask actions
    addSubtask, toggleSubtask, deleteSubtask, editSubtask,
    // dnd
    handleDragEnd,
    // list actions
    addList, deleteList, editList,
  };
}