'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Subtask Item Component with nested dropdown support
function SubtaskItem({ subtask, parentId, onToggleSubtask, onDeleteSubtask, isDarkTheme, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingNested, setIsAddingNested] = useState(false);
  const [nestedText, setNestedText] = useState('');

  const hasNestedSubtasks = subtask.subtasks && subtask.subtasks.length > 0;
  const completedNested = hasNestedSubtasks ? subtask.subtasks.filter(s => s.completed).length : 0;
  const totalNested = hasNestedSubtasks ? subtask.subtasks.length : 0;

  const handleAddNested = (e) => {
    e.preventDefault();
    if (nestedText.trim() === '') return;
    
    const newNested = {
      id: Date.now().toString(),
      text: nestedText,
      completed: false,
      subtasks: []
    };
    
    const updatedSubtask = {
      ...subtask,
      subtasks: [...(subtask.subtasks || []), newNested]
    };
    
    onToggleSubtask(parentId, subtask.id, updatedSubtask);
    setNestedText('');
    setIsAddingNested(false);
  };

  const handleToggleNested = (nestedId) => {
    const updatedSubtask = {
      ...subtask,
      subtasks: subtask.subtasks.map(ns =>
        ns.id === nestedId ? { ...ns, completed: !ns.completed } : ns
      )
    };
    onToggleSubtask(parentId, subtask.id, updatedSubtask);
  };

  const handleDeleteNested = (nestedId) => {
    const updatedSubtask = {
      ...subtask,
      subtasks: subtask.subtasks.filter(ns => ns.id !== nestedId)
    };
    onToggleSubtask(parentId, subtask.id, updatedSubtask);
  };

  const handleUpdateNested = (nestedId, updatedNested) => {
    const updatedSubtask = {
      ...subtask,
      subtasks: subtask.subtasks.map(ns =>
        ns.id === nestedId ? updatedNested : ns
      )
    };
    onToggleSubtask(parentId, subtask.id, updatedSubtask);
  };

  return (
    <div>
      <div className="glass rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Arrow */}
          {hasNestedSubtasks && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 text-gray-600 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          )}
          
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={subtask.completed}
            onChange={() => onToggleSubtask(parentId, subtask.id)}
            className="checkbox-custom flex-shrink-0"
            style={{ width: '1.125rem', height: '1.125rem' }}
          />
          
          {/* Text Content */}
          <div className="flex-1">
            <div className={`text-sm font-semibold ${
              subtask.completed 
                ? 'line-through text-gray-500 dark:text-gray-600' 
                : ''
            }`} style={!subtask.completed ? { color: isDarkTheme ? '#f5f5f5' : '#0a0a0a' } : undefined}>
              {subtask.text}
              {hasNestedSubtasks && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-500 font-normal">
                  ({completedNested}/{totalNested})
                </span>
              )}
            </div>
            
            {/* Add nested button */}
            {!isAddingNested && (
              <button
                onClick={() => setIsAddingNested(true)}
                className="opacity-0 group-hover:opacity-100 mt-1 text-xs hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-opacity"
                style={{ color: isDarkTheme ? '#d1d5db' : '#4b5563' }}
              >
                + Add nested
              </button>
            )}
            
            {/* Add nested form */}
            {isAddingNested && (
              <form onSubmit={handleAddNested} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={nestedText}
                  onChange={(e) => setNestedText(e.target.value)}
                  placeholder="Nested task..."
                  className={`flex-1 px-2 py-1 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkTheme
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                  }`}
                  autoFocus
                  onBlur={() => {
                    setTimeout(() => {
                      if (nestedText.trim() === '') {
                        setIsAddingNested(false);
                      }
                    }, 150);
                  }}
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </form>
            )}
          </div>
          
          {/* Delete Button */}
          <button
            onClick={() => onDeleteSubtask(parentId, subtask.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-600 dark:text-gray-600 dark:hover:text-rose-400 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Nested subtasks - rendered recursively with proper indentation */}
      {hasNestedSubtasks && isExpanded && (
        <div className="mt-2 pl-8 space-y-2">
          {subtask.subtasks.map((nested) => (
            <SubtaskItem
              key={nested.id}
              subtask={nested}
              parentId={subtask.id}
              onToggleSubtask={(_, nestedId, updated) => {
                if (updated) {
                  handleUpdateNested(nestedId, updated);
                } else {
                  handleToggleNested(nestedId);
                }
              }}
              onDeleteSubtask={(_, nestedId) => handleDeleteNested(nestedId)}
              isDarkTheme={isDarkTheme}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Sortable Todo Item Component with Recursive Nesting
function SortableTodoItem({ todo, onToggle, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask, mode, layout, level = 0, isDarkTheme }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');

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
      border: 'border-l-blue-500',
      bg: 'bg-gradient-to-r from-blue-50/60 to-transparent dark:from-blue-950/30',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    medium: {
      border: 'border-l-amber-500',
      bg: 'bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/30',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    high: {
      border: 'border-l-rose-500',
      bg: 'bg-gradient-to-r from-rose-50/60 to-transparent dark:from-rose-950/30',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
  };

  const priorityStyle = priorityStyles[todo.priority];
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
  const completedSubtasks = hasSubtasks ? todo.subtasks.filter(s => s.completed).length : 0;
  const totalSubtasks = hasSubtasks ? todo.subtasks.length : 0;

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (subtaskText.trim() === '') return;
    onAddSubtask(todo.id, subtaskText);
    setSubtaskText('');
    setIsAddingSubtask(false);
  };

  const handleDoubleClick = () => {
    setIsAddingSubtask(true);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group relative card-hover glass rounded-xl border-l-4 ${
          mode === 'basic' ? 'border-l-transparent' : priorityStyle.border
        } ${priorityStyle.bg} shadow-md ${
          isDragging ? 'opacity-50 scale-105 z-50 shadow-2xl' : ''
        } ${todo.completed ? 'opacity-60' : ''}`}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-start gap-4 p-5">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="drag-handle flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing mt-1"
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

          {/* Expand/Collapse for subtasks */}
          {hasSubtasks && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 text-gray-600 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-300 mt-1"
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          )}

          {/* Checkbox */}
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            className="checkbox-custom flex-shrink-0 mt-1"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className={`text-[15.5px] leading-relaxed font-semibold ${
              todo.completed 
                ? 'line-through text-gray-500 dark:text-gray-600' 
                : ''
            }`} style={!todo.completed ? { color: isDarkTheme ? '#f5f5f5' : '#0a0a0a' } : undefined}>
              {todo.text}
              {hasSubtasks && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-500 font-normal">
                  ({completedSubtasks}/{totalSubtasks})
                </span>
              )}
            </div>
            
            {mode === 'advanced' && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {todo.dueDate && (
                  <span className={`priority-badge text-xs font-medium px-3 py-1.5 rounded-full ${
                    isOverdue 
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 ring-2 ring-rose-200 dark:ring-rose-900' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
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

            {/* Add subtask button */}
            {!isAddingSubtask && (
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="opacity-0 group-hover:opacity-100 mt-3 text-xs hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-opacity"
                style={{ color: isDarkTheme ? '#d1d5db' : '#4b5563' }}
              >
                + Add subtask
              </button>
            )}

            {/* Add subtask form */}
            {isAddingSubtask && (
              <form onSubmit={handleAddSubtask} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={subtaskText}
                  onChange={(e) => setSubtaskText(e.target.value)}
                  placeholder="Add a subtask..."
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkTheme
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                  }`}
                  autoFocus
                  onBlur={() => {
                    setTimeout(() => {
                      if (subtaskText.trim() === '') {
                        setIsAddingSubtask(false);
                      }
                    }, 150);
                  }}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubtask(false);
                    setSubtaskText('');
                  }}
                  className="px-3 py-1.5 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(todo.id)}
            className="delete-btn opacity-0 group-hover:opacity-100 flex-shrink-0 text-gray-500 hover:text-rose-600 dark:text-gray-600 dark:hover:text-rose-400 mt-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Render subtasks - nested dropdown style */}
      {hasSubtasks && isExpanded && (
        <div className="mt-3 space-y-2 pl-12">
          {todo.subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              parentId={todo.id}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              isDarkTheme={isDarkTheme}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [inputText, setInputText] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [theme, setTheme] = useState('rose-gold');
  const [font, setFont] = useState('inter');
  const [mode, setMode] = useState('basic');
  const [layout, setLayout] = useState('grid'); // 'grid' or 'list'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check if all subtasks are completed
  const checkParentCompletion = (updatedTodos) => {
    return updatedTodos.map(todo => {
      if (todo.subtasks && todo.subtasks.length > 0) {
        const allSubtasksCompleted = todo.subtasks.every(s => s.completed);
        return { ...todo, completed: allSubtasksCompleted };
      }
      return todo;
    });
  };

  // Load from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('doneAndDustedTodos');
    const savedTheme = localStorage.getItem('doneAndDustedTheme');
    const savedFont = localStorage.getItem('doneAndDustedFont');
    const savedMode = localStorage.getItem('doneAndDustedMode');
    const savedLayout = localStorage.getItem('doneAndDustedLayout');
    
    if (savedTodos) setTodos(JSON.parse(savedTodos));
    if (savedTheme) setTheme(savedTheme);
    if (savedFont) setFont(savedFont);
    if (savedMode) setMode(savedMode);
    if (savedLayout) setLayout(savedLayout);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('doneAndDustedTodos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('doneAndDustedTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('doneAndDustedFont', font);
  }, [font]);

  useEffect(() => {
    localStorage.setItem('doneAndDustedMode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('doneAndDustedLayout', layout);
  }, [layout]);

  const addTodo = (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    const newTodo = {
      id: Date.now().toString(),
      text: inputText,
      completed: false,
      subtasks: [],
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
    const updatedTodos = todos.map(todo => {
      if (todo.id === id) {
        const newCompleted = !todo.completed;
        if (newCompleted && todo.subtasks) {
          return {
            ...todo,
            completed: newCompleted,
            subtasks: todo.subtasks.map(s => ({ ...s, completed: true }))
          };
        }
        if (!newCompleted && todo.subtasks) {
          return {
            ...todo,
            completed: newCompleted,
            subtasks: todo.subtasks.map(s => ({ ...s, completed: false }))
          };
        }
        return { ...todo, completed: newCompleted };
      }
      return todo;
    });
    setTodos(updatedTodos);
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const addSubtask = (parentId, subtaskText) => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === parentId) {
        const newSubtask = {
          id: Date.now().toString(),
          text: subtaskText,
          completed: false,
        };
        return {
          ...todo,
          subtasks: [...(todo.subtasks || []), newSubtask],
        };
      }
      return todo;
    });
    setTodos(updatedTodos);
  };

  const toggleSubtask = (parentId, subtaskId, updatedSubtask = null) => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === parentId) {
        return {
          ...todo,
          subtasks: todo.subtasks.map(s =>
            s.id === subtaskId 
              ? (updatedSubtask || { ...s, completed: !s.completed })
              : s
          ),
        };
      }
      return todo;
    });
    setTodos(checkParentCompletion(updatedTodos));
  };

  const deleteSubtask = (parentId, subtaskId) => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === parentId) {
        return {
          ...todo,
          subtasks: todo.subtasks.filter(s => s.id !== subtaskId),
        };
      }
      return todo;
    });
    setTodos(checkParentCompletion(updatedTodos));
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
    'rose-gold': {
      name: 'Rose Gold',
      bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50',
      accent: '#f43f5e',
    },
    'sage': {
      name: 'Sage',
      bg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
      accent: '#10b981',
    },
    'lavender': {
      name: 'Lavender',
      bg: 'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50',
      accent: '#8b5cf6',
    },
    'peach': {
      name: 'Peach',
      bg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50',
      accent: '#f97316',
    },
    'midnight': {
      name: 'Midnight Blue',
      bg: 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900',
      accent: '#3b82f6',
      dark: true,
    },
    'charcoal': {
      name: 'Charcoal',
      bg: 'bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900',
      accent: '#6366f1',
      dark: true,
    },
  };

  const fonts = {
    inter: { name: 'Inter', class: 'font-inter' },
    playfair: { name: 'Playfair Display', class: 'font-playfair' },
    roboto: { name: 'Roboto', class: 'font-roboto' },
    poppins: { name: 'Poppins', class: 'font-poppins' },
    lora: { name: 'Lora', class: 'font-lora' },
    montserrat: { name: 'Montserrat', class: 'font-montserrat' },
    crimson: { name: 'Crimson Text', class: 'font-crimson' },
  };

  const currentTheme = themes[theme] || themes['rose-gold'];
  const currentFont = fonts[font] || fonts['inter'];
  const isDarkTheme = currentTheme.dark || false;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    completion: todos.length ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0,
  };

  // Group todos into 3 columns for grid layout
  const columns = [[], [], []];
  todos.forEach((todo, index) => {
    columns[index % 3].push(todo);
  });

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentFont.class} transition-all duration-500`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-5xl font-bold mb-3">
                <span className="gradient-text">Done and Dusted</span>
              </h1>
              <p className={`text-lg ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
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
                      ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md`
                      : `${isDarkTheme ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-700 hover:bg-white/50'}`
                  }`}
                >
                  Basic
                </button>
                <button
                  onClick={() => setMode('advanced')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'advanced'
                      ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md`
                      : `${isDarkTheme ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-700 hover:bg-white/50'}`
                  }`}
                >
                  Advanced
                </button>
              </div>

              {/* Layout Toggle */}
              <div className="glass rounded-xl p-1.5 shadow-lg">
                <button
                  onClick={() => setLayout('grid')}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    layout === 'grid'
                      ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md`
                      : `${isDarkTheme ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-700 hover:bg-white/50'}`
                  }`}
                  title="Grid Layout"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    layout === 'list'
                      ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md`
                      : `${isDarkTheme ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-700 hover:bg-white/50'}`
                  }`}
                  title="List Layout"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="4" width="18" height="3" rx="1"/>
                    <rect x="3" y="10" width="18" height="3" rx="1"/>
                    <rect x="3" y="16" width="18" height="3" rx="1"/>
                  </svg>
                </button>
              </div>

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="glass rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
                    <path d="m4.93 4.93 4.24 4.24m5.66 0 4.24-4.24M4.93 19.07l4.24-4.24m5.66 0 4.24 4.24"/>
                  </svg>
                  <span className={`font-semibold text-sm ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
                    Settings
                  </span>
                </button>

                {isSettingsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsSettingsOpen(false)}
                    />
                    <div className="dropdown-menu absolute right-0 mt-2 w-64 glass rounded-xl shadow-2xl z-20 border border-gray-200/50 dark:border-gray-700/50 p-4">
                      {/* Theme Selector */}
                      <div className="mb-4">
                        <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                          Theme
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(themes).map(([key, t]) => (
                            <button
                              key={key}
                              onClick={() => {
                                setTheme(key);
                              }}
                              className={`aspect-square rounded-lg transition-all relative ${
                                theme === key ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
                              }`}
                              style={{ background: t.accent }}
                              title={t.name}
                            >
                              {theme === key && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="absolute inset-0 m-auto">
                                  <path d="M5 13l4 4L19 7"/>
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Selector */}
                      <div>
                        <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                          Font
                        </label>
                        <select
                          value={font}
                          onChange={(e) => setFont(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkTheme 
                              ? 'bg-gray-800/50 border-gray-700 text-gray-200' 
                              : 'bg-white/50 border-gray-300 text-gray-700'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                        >
                          {Object.entries(fonts).map(([key, f]) => (
                            <option key={key} value={key} className={f.class}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="glass rounded-2xl p-6 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`stat-counter text-3xl font-bold mb-1 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {stats.total}
                </div>
                <div className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="stat-counter text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {stats.active}
                </div>
                <div className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Active</div>
              </div>
              <div className="text-center">
                <div className="stat-counter text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {stats.completed}
                </div>
                <div className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Completed</div>
              </div>
              <div className="text-center">
                <div className="stat-counter text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {stats.completion}%
                </div>
                <div className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Progress</div>
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
              placeholder="What needs to be done? (Double-click tasks to add subtasks)"
              className={`${
                mode === 'advanced' ? 'lg:col-span-6' : 'flex-1'
              } px-5 py-3.5 ${
                isDarkTheme 
                  ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-400' 
                  : 'bg-white/50 border-gray-200/50 text-gray-900 placeholder:text-gray-600'
              } border-2 rounded-xl text-[15px] font-medium focus:border-blue-500 focus:ring-0`}
              autoFocus
            />
            
            {mode === 'advanced' && (
              <>
                <input
                  type="date"
                  value={dueDateTime}
                  onChange={(e) => setDueDateTime(e.target.value)}
                  className={`lg:col-span-3 px-4 py-3.5 ${
                    isDarkTheme 
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100' 
                      : 'bg-white/50 border-gray-200/50 text-gray-900'
                  } border-2 rounded-xl text-sm font-medium`}
                />
                
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`lg:col-span-2 px-4 py-3.5 ${
                    isDarkTheme 
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100' 
                      : 'bg-white/50 border-gray-200/50 text-gray-900'
                  } border-2 rounded-xl text-sm font-medium`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
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
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </form>

        {/* Todo List */}
        {todos.length === 0 ? (
          <div className="text-center py-24">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 floating-btn ${
              isDarkTheme 
                ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30' 
                : 'bg-gradient-to-br from-blue-100 to-purple-100'
            }`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              No tasks yet
            </h3>
            <p className={`text-lg ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Add your first task above to get started
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {layout === 'grid' ? (
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
                          onAddSubtask={addSubtask}
                          onToggleSubtask={toggleSubtask}
                          onDeleteSubtask={deleteSubtask}
                          mode={mode}
                          layout={layout}
                          isDarkTheme={isDarkTheme}
                        />
                      ))}
                    </div>
                  </SortableContext>
                ))}
              </div>
            ) : (
              <SortableContext
                items={todos.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4 max-w-4xl mx-auto">
                  {todos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onAddSubtask={addSubtask}
                      onToggleSubtask={toggleSubtask}
                      onDeleteSubtask={deleteSubtask}
                      mode={mode}
                      layout={layout}
                      isDarkTheme={isDarkTheme}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </DndContext>
        )}
      </div>
    </div>
  );
}