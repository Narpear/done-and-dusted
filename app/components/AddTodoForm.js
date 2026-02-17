'use client';

import { useState, forwardRef } from 'react';

const AddTodoForm = forwardRef(function AddTodoForm({ onAdd, mode, isDarkTheme }, ref) {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tag, setTag] = useState('');

  const inputClass = `px-4 py-3 border-2 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-0 ${
    isDarkTheme
      ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-400'
      : 'bg-white/50 border-gray-200/50 text-gray-900 placeholder:text-gray-600'
  }`;

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({
      text: text.trim(),
      dueDate: mode === 'advanced' ? dueDate : null,
      priority: mode === 'advanced' ? priority : 'medium',
      tag: mode === 'advanced' ? tag : null,
    });
    setText('');
    setDueDate('');
    setPriority('medium');
    setTag('');
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl shadow-xl p-5 mb-8">
      <div className={mode === 'advanced' ? 'grid grid-cols-1 lg:grid-cols-12 gap-3' : 'flex gap-3'}>
        <input
          ref={ref}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done? (Double-click tasks to edit)"
          className={`${mode === 'advanced' ? 'lg:col-span-5' : 'flex-1'} ${inputClass}`}
        />

        {mode === 'advanced' && (
          <>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag (work, home...)"
              className={`lg:col-span-2 ${inputClass}`}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`lg:col-span-2 ${inputClass}`}
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`lg:col-span-2 ${inputClass}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </>
        )}

        <button
          type="submit"
          className={`${mode === 'advanced' ? 'lg:col-span-1' : ''} btn-primary px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 whitespace-nowrap`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </form>
  );
});

export default AddTodoForm;