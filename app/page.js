'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Todo Item Component
function SortableTodoItem({ todo, onToggle, onDelete, mode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityStyles = {
    low: {
      border: 'border-l-blue-400',
      bg: 'bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
      dot: 'bg-blue-400',
    },
    medium: {
      border: 'border-l-amber-400',
      bg: 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
      dot: 'bg-amber-400',
    },
    high: {
      border: 'border-l-rose-400',
      bg: 'bg-gradient-to-r from-rose-50/50 to-transparent dark:from-rose-950/20',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
      dot: 'bg-rose-400',
    },
  };

  const priorityStyle = priorityStyles[todo.priority];
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative card-hover glass rounded-xl border-l-4 ${
        mode === 'basic' ? 'border-l-transparent' : priorityStyle.border
      } ${priorityStyle.bg} shadow-lg ${
        isDragging ? 'opacity-50 scale-105 z-50 shadow-2xl' : ''
      } ${todo.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-4 p-5">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="drag-handle flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing mt-1"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="4" r="1.5"/>
            <circle cx="4" cy="8" r="1.5"/>
            <circle cx="4" cy="12" r="1.5"/>
            <circle cx="12" cy="4" r="1.5"/>
            <circle cx="12" cy="8" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
          </svg>
        </button>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className="checkbox-custom flex-shrink-0 mt-1"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`text-[15.5px] leading-relaxed font-medium ${
            todo.completed 
              ? 'line-through text-gray-400 dark:text-gray-600' 
              : 'text-gray-800 dark:text-gray-100'
          }`}>
            {todo.text}
          </div>
          
          {mode === 'advanced' && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {todo.dueDate && (
                <span className={`priority-badge text-xs font-medium px-3 py-1.5 rounded-full ${
                  isOverdue 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 ring-2 ring-rose-200 dark:ring-rose-900' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <span className="mr-1.5">📅</span>
                  {new Date(todo.dueDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                  })}
                  {isOverdue && ' • Overdue'}
                </span>
              )}
              <span className={`priority-badge flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${priorityStyle.badge}`}>
                <div className={`w-2 h-2 rounded-full ${priorityStyle.dot} animate-pulse`}></div>
                <span className="capitalize">{todo.priority}</span>
              </span>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(todo.id)}
          className="delete-btn opacity-0 group-hover:opacity-100 flex-shrink-0 text-gray-400 hover:text-rose-500 dark:text-gray-600 dark:hover:text-rose-400 mt-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [inputText, setInputText] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [theme, setTheme] = useState('midnight');
  const [mode, setMode] = useState('basic');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('doneAndDustedTodos');
    const savedTheme = localStorage.getItem('doneAndDustedTheme');
    const savedMode = localStorage.getItem('doneAndDustedMode');
    
    if (savedTodos) setTodos(JSON.parse(savedTodos));
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', ['midnight', 'aurora', 'ocean'].includes(savedTheme));
    }
    if (savedMode) setMode(savedMode);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('doneAndDustedTodos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('doneAndDustedTheme', theme);
    document.documentElement.classList.toggle('dark', ['midnight', 'aurora', 'ocean'].includes(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('doneAndDustedMode', mode);
  }, [mode]);

  const addTodo = (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    const newTodo = {
      id: Date.now().toString(),
      text: inputText,
      completed: false,
      dueDate: mode === 'advanced' ? (dueDateTime || null) : null,
      priority: mode === 'advanced' ? priority : 'medium',
      createdAt: new Date().toISOString(),
    };

    setTodos([...todos, newTodo]);
    setInputText('');
    setDueDateTime('');
    setPriority('medium');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTodos((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const themes = {
    light: {
      name: 'Light',
      bg: 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30',
      preview: 'linear-gradient(135deg, #f9fafb 0%, #eff6ff 50%, #faf5ff 100%)',
    },
    midnight: {
      name: 'Midnight',
      bg: 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20',
      preview: 'linear-gradient(135deg, #111827 0%, #1e3a5f 50%, #2d1b4e 100%)',
    },
    sunset: {
      name: 'Sunset',
      bg: 'bg-gradient-to-br from-orange-50 via-rose-50 to-pink-100',
      preview: 'linear-gradient(135deg, #fff7ed 0%, #ffe4e6 50%, #fce7f3 100%)',
    },
    forest: {
      name: 'Forest',
      bg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100',
      preview: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 50%, #dcfce7 100%)',
    },
    ocean: {
      name: 'Ocean',
      bg: 'bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900',
      preview: 'linear-gradient(135deg, #164e63 0%, #1e3a8a 50%, #312e81 100%)',
    },
    aurora: {
      name: 'Aurora',
      bg: 'bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900',
      preview: 'linear-gradient(135deg, #581c87 0%, #831843 50%, #881337 100%)',
    },
  };

  const currentTheme = themes[theme];
  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    completion: todos.length ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0,
  };

  // Group todos into 3 columns
  const columns = [[], [], []];
  todos.forEach((todo, index) => {
    columns[index % 3].push(todo);
  });

  return (
    <div className={`min-h-screen ${currentTheme.bg} transition-all duration-500`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-5xl font-bold mb-3" style={{fontFamily: 'var(--font-display)'}}>
                <span className="gradient-text">Done and Dusted</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg" style={{fontFamily: 'var(--font-accent)'}}>
                Stay organized, stay productive
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Toggle */}
              <div className="glass rounded-xl p-1.5 shadow-lg">
                <button
                  onClick={() => setMode('basic')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'basic'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  Basic
                </button>
                <button
                  onClick={() => setMode('advanced')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'advanced'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  Advanced
                </button>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-2">
                {Object.entries(themes).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`theme-btn w-10 h-10 rounded-xl shadow-md hover:scale-110 transition-all ${
                      theme === key ? 'active ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent scale-110' : ''
                    }`}
                    style={{ background: t.preview }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="glass rounded-2xl p-6 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="stat-counter text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{fontFamily: 'var(--font-display)'}}>
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="stat-counter text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1" style={{fontFamily: 'var(--font-display)'}}>
                  {stats.active}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active</div>
              </div>
              <div className="text-center">
                <div className="stat-counter text-3xl font-bold text-green-600 dark:text-green-400 mb-1" style={{fontFamily: 'var(--font-display)'}}>
                  {stats.completed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completed</div>
              </div>
              <div className="text-center">
                <div className="stat-counter text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1" style={{fontFamily: 'var(--font-display)'}}>
                  {stats.completion}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="glass rounded-2xl shadow-xl p-6 mb-10">
          <div className={mode === 'advanced' ? 'grid grid-cols-1 lg:grid-cols-12 gap-4' : 'flex gap-4'}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="What needs to be done today?"
              className={`${
                mode === 'advanced' ? 'lg:col-span-6' : 'flex-1'
              } px-5 py-3.5 bg-white/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl 
                text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 
                text-[15px] font-medium focus:border-blue-500 focus:ring-0`}
              autoFocus
            />
            
            {mode === 'advanced' && (
              <>
                <input
                  type="date"
                  value={dueDateTime}
                  onChange={(e) => setDueDateTime(e.target.value)}
                  className="lg:col-span-3 px-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl 
                    text-gray-900 dark:text-gray-100 text-sm font-medium"
                />
                
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="lg:col-span-2 px-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl 
                    text-gray-900 dark:text-gray-100 text-sm font-medium"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </>
            )}
            
            <button
              type="submit"
              className={`${
                mode === 'advanced' ? 'lg:col-span-1' : ''
              } btn-primary px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </form>

        {/* Todo List - 3 Column Layout */}
        {todos.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-6 floating-btn">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3" style={{fontFamily: 'var(--font-display)'}}>
              No tasks yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Add your first task above to get started on your journey
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {columns.map((columnTodos, colIndex) => (
                <SortableContext
                  key={colIndex}
                  items={columnTodos.map(t => t.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="space-y-4">
                    {columnTodos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        mode={mode}
                      />
                    ))}
                  </div>
                </SortableContext>
              ))}
            </div>
          </DndContext>
        )}
      </div>
    </div>
  );
}