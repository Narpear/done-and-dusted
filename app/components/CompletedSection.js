'use client';

import { useState } from 'react';
import TodoItem from './TodoItem';

export default function CompletedSection({
  todos,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onUpdateNotes,
  mode,
  isDarkTheme,
  confettiCanvasRef,
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (todos.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center gap-2 text-sm font-semibold mb-3 px-3 py-2 rounded-lg transition-colors backdrop-blur-md border ${
          isDarkTheme
            ? 'text-gray-300 bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50 hover:text-gray-200'
            : 'text-gray-600 bg-white/30 border-gray-200/60 hover:bg-white/50 hover:text-gray-800'
        }`}
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span>Completed</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          isDarkTheme ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
        }`}>
          {todos.length}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 opacity-75">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onEditSubtask={onEditSubtask}
              onUpdateNotes={onUpdateNotes}
              mode={mode}
              isDarkTheme={isDarkTheme}
              confettiCanvasRef={confettiCanvasRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}