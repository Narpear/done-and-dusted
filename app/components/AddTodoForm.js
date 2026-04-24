'use client';

import { useState, forwardRef } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';

const AddTodoForm = forwardRef(function AddTodoForm({ onAdd, mode, isDarkTheme }, ref) {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tag, setTag] = useState('');
  const [recurrence, setRecurrence] = useState('none');

  const { isRecording, toggle: toggleVoice } = useVoiceInput((transcript) => setText(transcript));

  const inputClass = `px-4 py-3 border-2 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-0 ${
    isDarkTheme
      ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-400'
      : 'bg-white/50 border-gray-200/50 text-gray-900 placeholder:text-gray-600'
  }`;

  function handleSubmit(e) {
    e.preventDefault();
    submit(text);
  }

  function submit(value) {
    if (!value.trim()) return;
    onAdd({
      text: value.trim(),
      dueDate: mode === 'advanced' ? dueDate : null,
      priority: mode === 'advanced' ? priority : 'medium',
      tag: mode === 'advanced' ? tag : null,
      recurrence: mode === 'advanced' && recurrence !== 'none' ? recurrence : null,
    });
    setText('');
    setDueDate('');
    setPriority('medium');
    setTag('');
    setRecurrence('none');
  }

  function handleVoice() {
    toggleVoice((finalText) => {
      submit(finalText);
      setText('');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl shadow-xl p-5 mb-8">
      <div className={mode === 'advanced' ? 'grid grid-cols-1 lg:grid-cols-12 gap-3' : 'flex gap-3'}>
        <div className={`${mode === 'advanced' ? 'lg:col-span-4' : 'flex-1'} relative flex items-center`}>
          <input
            ref={ref}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecording ? 'Listening…' : 'What needs to be done?'}
            className={`w-full pr-10 ${inputClass} ${isRecording ? 'ring-2 ring-rose-400' : ''}`}
          />
          <button
            type="button"
            onClick={handleVoice}
            title={isRecording ? 'Stop (or wait 3 s)' : 'Voice input — auto-submits on silence'}
            className={`absolute right-3 transition-all ${
              isRecording
                ? 'text-rose-500 animate-pulse scale-110'
                : isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {isRecording ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" />
              </svg>
            )}
          </button>
        </div>

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
              className={`lg:col-span-1 ${inputClass}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className={`lg:col-span-2 ${inputClass}`}
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </>
        )}

        <button
          type="submit"
          className={`${mode === 'advanced' ? 'lg:col-span-1' : ''} btn-primary px-5 py-3 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 whitespace-nowrap`}
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
