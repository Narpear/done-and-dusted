'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Subtask Item Component with nested dropdown support and drag-and-drop
function SubtaskItem({ subtask, parentId, onToggleSubtask, onDeleteSubtask, onEditSubtask, isDarkTheme, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingNested, setIsAddingNested] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nestedText, setNestedText] = useState('');
  const [editText, setEditText] = useState(subtask.text);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  const handleEdit = () => {
    if (editText.trim() === '') return;
    onEditSubtask(parentId, subtask.id, editText);
    setIsEditing(false);
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

  const handleEditNested = (nestedId, newText) => {
    const updatedSubtask = {
      ...subtask,
      subtasks: subtask.subtasks.map(ns =>
        ns.id === nestedId ? { ...ns, text: newText } : ns
      )
    };
    onToggleSubtask(parentId, subtask.id, updatedSubtask);
  };

  const handleReorderNested = (activeId, overId) => {
    const oldIndex = subtask.subtasks.findIndex(s => s.id === activeId);
    const newIndex = subtask.subtasks.findIndex(s => s.id === overId);
    
    const updatedSubtask = {
      ...subtask,
      subtasks: arrayMove(subtask.subtasks, oldIndex, newIndex)
    };
    onToggleSubtask(parentId, subtask.id, updatedSubtask);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`glass rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group ${isDragging ? 'opacity-50 scale-105 z-50' : ''}`}>
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="4" cy="4" r="1.2"/>
              <circle cx="4" cy="8" r="1.2"/>
              <circle cx="4" cy="12" r="1.2"/>
              <circle cx="12" cy="4" r="1.2"/>
              <circle cx="12" cy="8" r="1.2"/>
              <circle cx="12" cy="12" r="1.2"/>
            </svg>
          </button>

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
            {isEditing ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') {
                    setEditText(subtask.text);
                    setIsEditing(false);
                  }
                }}
                className={`w-full px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                autoFocus
              />
            ) : (
              <div 
                className={`text-sm font-semibold ${
                  subtask.completed 
                    ? 'line-through text-gray-500 dark:text-gray-600' 
                    : ''
                }`} 
                style={!subtask.completed ? { color: isDarkTheme ? '#f5f5f5' : '#0a0a0a' } : undefined}
                onDoubleClick={() => setIsEditing(true)}
              >
                {subtask.text}
                {hasNestedSubtasks && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-500 font-normal">
                    ({completedNested}/{totalNested})
                  </span>
                )}
              </div>
            )}
            
            {/* Add nested button */}
            {!isAddingNested && !isEditing && (
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
      
      {/* Nested subtasks - rendered recursively with drag-and-drop */}
      {hasNestedSubtasks && isExpanded && (
        <div className="mt-2 pl-8 space-y-2">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (over && active.id !== over.id) {
                handleReorderNested(active.id, over.id);
              }
            }}
          >
            <SortableContext items={subtask.subtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
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
                  onEditSubtask={(_, nestedId, newText) => handleEditNested(nestedId, newText)}
                  isDarkTheme={isDarkTheme}
                  level={level + 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

// Sortable Todo Item Component
function SortableTodoItem({ todo, onToggle, onDelete, onEdit, onAddSubtask, onToggleSubtask, onDeleteSubtask, onEditSubtask, mode, layout, level = 0, isDarkTheme }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');
  const [editText, setEditText] = useState(todo.text);

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

  const handleEdit = () => {
    if (editText.trim() === '') return;
    onEdit(todo.id, editText);
    setIsEditing(false);
  };

  const handleDoubleClick = (e) => {
    // Only trigger edit if not clicking on other interactive elements
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
      setIsEditing(true);
    }
  };

  const handleReorderSubtasks = (activeId, overId) => {
    const oldIndex = todo.subtasks.findIndex(s => s.id === activeId);
    const newIndex = todo.subtasks.findIndex(s => s.id === overId);
    
    const reorderedSubtasks = arrayMove(todo.subtasks, oldIndex, newIndex);
    onToggleSubtask(todo.id, null, null, reorderedSubtasks);
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
            {isEditing ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') {
                    setEditText(todo.text);
                    setIsEditing(false);
                  }
                }}
                className={`w-full px-3 py-2 text-[15.5px] font-semibold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkTheme
                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                autoFocus
              />
            ) : (
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
            )}
            
            {mode === 'advanced' && !isEditing && (
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
                {todo.tag && (
                  <span className="priority-badge text-xs font-medium px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
                    #{todo.tag}
                  </span>
                )}
              </div>
            )}

            {/* Add subtask button */}
            {!isAddingSubtask && !isEditing && (
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

      {/* Render subtasks with drag-and-drop */}
      {hasSubtasks && isExpanded && (
        <div className="mt-3 space-y-2 pl-12">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (over && active.id !== over.id) {
                handleReorderSubtasks(active.id, over.id);
              }
            }}
          >
            <SortableContext items={todo.subtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {todo.subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  parentId={todo.id}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onEditSubtask={onEditSubtask}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export default function TodoApp() {
  const [lists, setLists] = useState([{ id: 'default', name: 'My Tasks', todos: [] }]);
  const [currentListId, setCurrentListId] = useState('default');
  const [inputText, setInputText] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tag, setTag] = useState('');
  const [theme, setTheme] = useState('rose-gold');
  const [font, setFont] = useState('inter');
  const [mode, setMode] = useState('basic');
  const [layout, setLayout] = useState('grid');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('all');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isEditingList, setIsEditingList] = useState(null);
  const [editListName, setEditListName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get current list and its todos
  const currentList = lists.find(list => list.id === currentListId) || lists[0];
  const todos = currentList.todos;

  // Get unique tags from current list
  const allTags = ['all', ...new Set(todos.filter(t => t.tag).map(t => t.tag))];

  // Filter todos by selected tag
  const filteredTodos = selectedTag === 'all' 
    ? todos 
    : todos.filter(t => t.tag === selectedTag);

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
    const savedLists = localStorage.getItem('doneAndDustedLists');
    const savedCurrentListId = localStorage.getItem('doneAndDustedCurrentListId');
    const savedTheme = localStorage.getItem('doneAndDustedTheme');
    const savedFont = localStorage.getItem('doneAndDustedFont');
    const savedMode = localStorage.getItem('doneAndDustedMode');
    const savedLayout = localStorage.getItem('doneAndDustedLayout');
    
    if (savedLists) setLists(JSON.parse(savedLists));
    if (savedCurrentListId) setCurrentListId(savedCurrentListId);
    if (savedTheme) setTheme(savedTheme);
    if (savedFont) setFont(savedFont);
    if (savedMode) setMode(savedMode);
    if (savedLayout) setLayout(savedLayout);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('doneAndDustedLists', JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem('doneAndDustedCurrentListId', currentListId);
  }, [currentListId]);

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
      dueDate: mode === 'advanced' && dueDateTime ? dueDateTime : null,
      priority: mode === 'advanced' ? priority : 'medium',
      tag: mode === 'advanced' && tag ? tag : null,
      createdAt: new Date().toISOString(),
    };

    setLists(lists.map(list => 
      list.id === currentListId 
        ? { ...list, todos: [...list.todos, newTodo] }
        : list
    ));
    setInputText('');
    setDueDateTime('');
    setPriority('medium');
    setTag('');
  };

  const toggleTodo = (id) => {
    setLists(lists.map(list => {
      if (list.id !== currentListId) return list;
      
      const updatedTodos = list.todos.map(todo => {
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
      return { ...list, todos: updatedTodos };
    }));
  };

  const deleteTodo = (id) => {
    setLists(lists.map(list => 
      list.id === currentListId
        ? { ...list, todos: list.todos.filter(todo => todo.id !== id) }
        : list
    ));
  };

  const editTodo = (id, newText) => {
    setLists(lists.map(list => 
      list.id === currentListId
        ? { ...list, todos: list.todos.map(todo => todo.id === id ? { ...todo, text: newText } : todo) }
        : list
    ));
  };

  const addSubtask = (parentId, subtaskText) => {
    setLists(lists.map(list => {
      if (list.id !== currentListId) return list;
      
      const updatedTodos = list.todos.map(todo => {
        if (todo.id === parentId) {
          const newSubtask = {
            id: Date.now().toString(),
            text: subtaskText,
            completed: false,
            subtasks: [],
          };
          return {
            ...todo,
            subtasks: [...(todo.subtasks || []), newSubtask],
          };
        }
        return todo;
      });
      return { ...list, todos: updatedTodos };
    }));
  };

  const toggleSubtask = (parentId, subtaskId, updatedSubtask = null, reorderedSubtasks = null) => {
    setLists(lists.map(list => {
      if (list.id !== currentListId) return list;
      
      const updatedTodos = list.todos.map(todo => {
        if (todo.id === parentId) {
          if (reorderedSubtasks) {
            return { ...todo, subtasks: reorderedSubtasks };
          }
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
      return { ...list, todos: checkParentCompletion(updatedTodos) };
    }));
  };

  const deleteSubtask = (parentId, subtaskId) => {
    setLists(lists.map(list => {
      if (list.id !== currentListId) return list;
      
      const updatedTodos = list.todos.map(todo => {
        if (todo.id === parentId) {
          return {
            ...todo,
            subtasks: todo.subtasks.filter(s => s.id !== subtaskId),
          };
        }
        return todo;
      });
      return { ...list, todos: checkParentCompletion(updatedTodos) };
    }));
  };

  const editSubtask = (parentId, subtaskId, newText) => {
    setLists(lists.map(list => {
      if (list.id !== currentListId) return list;
      
      const updatedTodos = list.todos.map(todo => {
        if (todo.id === parentId) {
          return {
            ...todo,
            subtasks: todo.subtasks.map(s =>
              s.id === subtaskId ? { ...s, text: newText } : s
            ),
          };
        }
        return todo;
      });
      return { ...list, todos: updatedTodos };
    }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLists(lists.map(list => {
      if (list.id !== currentListId) return list;
      
      const oldIndex = list.todos.findIndex((item) => item.id === active.id);
      const newIndex = list.todos.findIndex((item) => item.id === over.id);
      return { ...list, todos: arrayMove(list.todos, oldIndex, newIndex) };
    }));
  };

  // List management functions
  const addList = (e) => {
    e.preventDefault();
    if (newListName.trim() === '') return;

    const newList = {
      id: Date.now().toString(),
      name: newListName,
      todos: [],
    };

    setLists([...lists, newList]);
    setCurrentListId(newList.id);
    setNewListName('');
    setIsAddingList(false);
  };

  const deleteList = (listId) => {
    if (lists.length === 1) return; // Don't delete if it's the only list
    
    const filteredLists = lists.filter(list => list.id !== listId);
    setLists(filteredLists);
    
    if (currentListId === listId) {
      setCurrentListId(filteredLists[0].id);
    }
  };

  const editList = (listId, newName) => {
    setLists(lists.map(list => 
      list.id === listId ? { ...list, name: newName } : list
    ));
    setIsEditingList(null);
  };

  // Export functions
  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const exportAsJSON = () => {
    const exportData = {
      exportDate: formatDate(),
      todos: filteredTodos,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const exportAsMarkdown = () => {
    let markdown = `# Todo List\n\n**${formatDate()}**\n\n`;
    
    const renderSubtasks = (subtasks, level = 0) => {
      let md = '';
      subtasks.forEach(subtask => {
        const indent = '  '.repeat(level + 1);
        md += `${indent}- [${subtask.completed ? 'x' : ' '}] ${subtask.text}\n`;
        if (subtask.subtasks && subtask.subtasks.length > 0) {
          md += renderSubtasks(subtask.subtasks, level + 1);
        }
      });
      return md;
    };

    filteredTodos.forEach(todo => {
      markdown += `- [${todo.completed ? 'x' : ' '}] **${todo.text}**`;
      if (mode === 'advanced') {
        if (todo.tag) markdown += ` #${todo.tag}`;
        if (todo.dueDate) markdown += ` (Due: ${new Date(todo.dueDate).toLocaleDateString()})`;
        markdown += ` [${todo.priority} priority]`;
      }
      markdown += '\n';
      
      if (todo.subtasks && todo.subtasks.length > 0) {
        markdown += renderSubtasks(todo.subtasks);
      }
      markdown += '\n';
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const exportAsText = () => {
    let text = `TODO LIST\n${formatDate()}\n${'='.repeat(50)}\n\n`;
    
    const renderSubtasks = (subtasks, level = 0) => {
      let txt = '';
      subtasks.forEach(subtask => {
        const indent = '  '.repeat(level + 1);
        txt += `${indent}${subtask.completed ? '✓' : '○'} ${subtask.text}\n`;
        if (subtask.subtasks && subtask.subtasks.length > 0) {
          txt += renderSubtasks(subtask.subtasks, level + 1);
        }
      });
      return txt;
    };

    filteredTodos.forEach(todo => {
      text += `${todo.completed ? '✓' : '○'} ${todo.text}`;
      if (mode === 'advanced') {
        if (todo.tag) text += ` [#${todo.tag}]`;
        if (todo.dueDate) text += ` (Due: ${new Date(todo.dueDate).toLocaleDateString()})`;
        text += ` [${todo.priority.toUpperCase()}]`;
      }
      text += '\n';
      
      if (todo.subtasks && todo.subtasks.length > 0) {
        text += renderSubtasks(todo.subtasks);
      }
      text += '\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const copyToClipboard = () => {
    let text = `TODO LIST - ${formatDate()}\n${'='.repeat(50)}\n\n`;
    
    const renderSubtasks = (subtasks, level = 0) => {
      let txt = '';
      subtasks.forEach(subtask => {
        const indent = '  '.repeat(level + 1);
        txt += `${indent}${subtask.completed ? '✓' : '○'} ${subtask.text}\n`;
        if (subtask.subtasks && subtask.subtasks.length > 0) {
          txt += renderSubtasks(subtask.subtasks, level + 1);
        }
      });
      return txt;
    };

    filteredTodos.forEach(todo => {
      text += `${todo.completed ? '✓' : '○'} ${todo.text}`;
      if (mode === 'advanced') {
        if (todo.tag) text += ` [#${todo.tag}]`;
        if (todo.dueDate) text += ` (Due: ${new Date(todo.dueDate).toLocaleDateString()})`;
        text += ` [${todo.priority.toUpperCase()}]`;
      }
      text += '\n';
      
      if (todo.subtasks && todo.subtasks.length > 0) {
        text += renderSubtasks(todo.subtasks);
      }
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
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
    total: filteredTodos.length,
    active: filteredTodos.filter(t => !t.completed).length,
    completed: filteredTodos.filter(t => t.completed).length,
    completion: filteredTodos.length ? Math.round((filteredTodos.filter(t => t.completed).length / filteredTodos.length) * 100) : 0,
  };

  // Group todos into 3 columns for grid layout
  const columns = [[], [], []];
  filteredTodos.forEach((todo, index) => {
    columns[index % 3].push(todo);
  });

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentFont.class} transition-all duration-500 flex`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden`}>
        <div className={`h-full border-r shadow-xl p-6 overflow-y-auto ${
          isDarkTheme 
            ? 'bg-gray-900/95 border-gray-700/50' 
            : 'bg-white/95 border-gray-200/50'
        }`}>
          <div className="mb-6">
            <h2 className={`text-xl font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              My Lists
            </h2>
            
            {/* List items */}
            <div className="space-y-2">
              {lists.map(list => (
                <div
                  key={list.id}
                  className={`group rounded-xl transition-all ${
                    currentListId === list.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : `${isDarkTheme ? 'hover:bg-gray-800/70 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`
                  }`}
                >
                  {isEditingList === list.id ? (
                    <div className="p-3">
                      <input
                        type="text"
                        value={editListName}
                        onChange={(e) => setEditListName(e.target.value)}
                        onBlur={() => {
                          if (editListName.trim()) {
                            editList(list.id, editListName);
                          } else {
                            setIsEditingList(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editListName.trim()) {
                            editList(list.id, editListName);
                          }
                          if (e.key === 'Escape') {
                            setIsEditingList(null);
                          }
                        }}
                        className={`w-full px-2 py-1 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkTheme
                            ? 'bg-gray-700 border-gray-600 text-gray-100'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3">
                      <button
                        onClick={() => setCurrentListId(list.id)}
                        className="flex-1 text-left font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11l3 3L22 4"/>
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                          </svg>
                          <span>{list.name}</span>
                        </div>
                        <div className={`text-xs mt-1 ${
                          currentListId === list.id
                            ? 'text-blue-100'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {list.todos.length} {list.todos.length === 1 ? 'task' : 'tasks'}
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingList(list.id);
                            setEditListName(list.name);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            currentListId === list.id 
                              ? 'text-white hover:bg-white/20' 
                              : isDarkTheme
                                ? 'text-gray-400 hover:bg-gray-700'
                                : 'text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Rename list"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        
                        {lists.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteList(list.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              currentListId === list.id 
                                ? 'text-white hover:bg-white/20' 
                                : isDarkTheme
                                  ? 'text-gray-400 hover:bg-gray-700'
                                  : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Delete list"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new list */}
            {isAddingList ? (
              <form onSubmit={addList} className="mt-3">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkTheme
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                  }`}
                  autoFocus
                  onBlur={() => {
                    setTimeout(() => {
                      if (newListName.trim() === '') {
                        setIsAddingList(false);
                      }
                    }, 150);
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-md"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListName('');
                    }}
                    className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg ${
                      isDarkTheme
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className={`w-full mt-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md ${
                  isDarkTheme
                    ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                New List
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed top-6 z-50 glass rounded-xl p-3 shadow-lg hover:shadow-xl transition-all ${
            isSidebarOpen ? 'left-[19.5rem]' : 'left-4'
          } ${isDarkTheme ? 'bg-gray-800/90' : 'bg-white/90'}`}
          title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isDarkTheme ? 'text-gray-200' : 'text-gray-700'}>
            {isSidebarOpen ? (
              <>
                <path d="M9 18l-6-6 6-6"/>
                <line x1="21" y1="12" x2="3" y2="12"/>
              </>
            ) : (
              <>
                <rect x="3" y="4" width="18" height="3" rx="1"/>
                <rect x="3" y="10" width="18" height="3" rx="1"/>
                <rect x="3" y="16" width="18" height="3" rx="1"/>
              </>
            )}
          </svg>
        </button>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-5xl font-bold mb-3">
                <span className="gradient-text">Done and Dusted</span>
              </h1>
              <p className={`text-lg ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                Stay organized, stay productive • {formatDate()}
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

              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="glass rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  <span className={`font-semibold text-sm ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
                    Export
                  </span>
                </button>

                {isExportOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsExportOpen(false)}
                    />
                    <div className="dropdown-menu absolute right-0 mt-2 w-56 glass rounded-xl shadow-2xl z-20 border border-gray-200/50 dark:border-gray-700/50 p-2">
                      <button
                        onClick={() => { exportAsJSON(); setIsExportOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        <div className="font-semibold">JSON</div>
                        <div className="text-xs text-gray-500">For data backup</div>
                      </button>
                      <button
                        onClick={() => { exportAsMarkdown(); setIsExportOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        <div className="font-semibold">Markdown</div>
                        <div className="text-xs text-gray-500">For documentation</div>
                      </button>
                      <button
                        onClick={() => { exportAsText(); setIsExportOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        <div className="font-semibold">Plain Text</div>
                        <div className="text-xs text-gray-500">Simple format</div>
                      </button>
                      <button
                        onClick={() => { copyToClipboard(); setIsExportOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        <div className="font-semibold">Copy to Clipboard</div>
                        <div className="text-xs text-gray-500">Quick share</div>
                      </button>
                    </div>
                  </>
                )}
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

          {/* Tag Filter */}
          {mode === 'advanced' && allTags.length > 1 && (
            <div className="glass rounded-2xl p-4 shadow-lg mb-6">
              <div className="flex flex-wrap gap-2">
                {allTags.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedTag === t
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                        : `${isDarkTheme ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50' : 'bg-white/50 text-gray-700 hover:bg-gray-100/50'}`
                    }`}
                  >
                    {t === 'all' ? 'All Tasks' : `#${t}`}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              placeholder="What needs to be done? (Double-click tasks to edit)"
              className={`${
                mode === 'advanced' ? 'lg:col-span-5' : 'flex-1'
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
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Tag (work, home...)"
                  className={`lg:col-span-2 px-4 py-3.5 ${
                    isDarkTheme 
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-400' 
                      : 'bg-white/50 border-gray-200/50 text-gray-900 placeholder:text-gray-600'
                  } border-2 rounded-xl text-sm font-medium`}
                />
                
                <input
                  type="date"
                  value={dueDateTime}
                  onChange={(e) => setDueDateTime(e.target.value)}
                  className={`lg:col-span-2 px-4 py-3.5 ${
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
        {filteredTodos.length === 0 ? (
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
              {selectedTag === 'all' ? 'No tasks yet' : `No tasks in #${selectedTag}`}
            </h3>
            <p className={`text-lg ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedTag === 'all' ? 'Add your first task above to get started' : 'Try selecting a different tag or add new tasks'}
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
                          onEdit={editTodo}
                          onAddSubtask={addSubtask}
                          onToggleSubtask={toggleSubtask}
                          onDeleteSubtask={deleteSubtask}
                          onEditSubtask={editSubtask}
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
                items={filteredTodos.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4 max-w-4xl mx-auto">
                  {filteredTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onEdit={editTodo}
                      onAddSubtask={addSubtask}
                      onToggleSubtask={toggleSubtask}
                      onDeleteSubtask={deleteSubtask}
                      onEditSubtask={editSubtask}
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
    </div>
  );
}