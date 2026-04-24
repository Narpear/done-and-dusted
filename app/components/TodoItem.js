'use client';

import { useState, useRef, useEffect } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PRIORITY_STYLES } from '../lib/constants';
import { calcProgressPct, getDueDateLabel, launchConfetti, getTagColorClass } from '../lib/utils';
import ProgressBar from './ProgressBar';
import SubtaskItem from './SubtaskItem';

export default function TodoItem({
  todo,
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
  isSelected,
  onSelect,
  isBulkMode,
  canDrag,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');
  const [editText, setEditText] = useState(todo.text);
  const [notesText, setNotesText] = useState(todo.notes || '');
  const prevPctRef = useRef(calcProgressPct(todo));

  const { isRecording: isSubtaskRecording, toggle: toggleSubtaskVoice } = useVoiceInput(
    (transcript) => setSubtaskText(transcript)
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const pStyle = PRIORITY_STYLES[todo.priority] || PRIORITY_STYLES.medium;
  const pct = calcProgressPct(todo);
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
  const dueInfo = getDueDateLabel(todo.dueDate);
  const tagColorClass = getTagColorClass(todo.tag);

  // Due-date driven card styling — overrides priority when overdue/today
  const cardBorder = dueInfo?.overdue
    ? 'border-l-rose-500'
    : dueInfo?.today
    ? 'border-l-amber-500'
    : mode === 'basic' ? 'border-l-transparent' : pStyle.border;

  const cardBg = dueInfo?.overdue
    ? 'bg-linear-to-r from-rose-50/60 to-transparent dark:from-rose-950/30'
    : dueInfo?.today
    ? 'bg-linear-to-r from-amber-50/40 to-transparent dark:from-amber-950/20'
    : mode === 'basic' ? '' : pStyle.bg;

  // Fire confetti when a task reaches 100%
  useEffect(() => {
    if (pct === 100 && prevPctRef.current < 100) {
      launchConfetti(confettiCanvasRef?.current);
    }
    prevPctRef.current = pct;
  }, [pct, confettiCanvasRef]);

  function handleAddSubtask(e) {
    e.preventDefault();
    if (!subtaskText.trim()) return;
    onAddSubtask(todo.id, subtaskText);
    setSubtaskText('');
    setIsAddingSubtask(false);
  }

  function handleEdit() {
    if (!editText.trim()) return;
    onEdit(todo.id, editText);
    setIsEditing(false);
  }

  function handleNotesSave() {
    onUpdateNotes(todo.id, notesText);
  }

  function handleReorderSubtasks(activeId, overId) {
    const oldIdx = todo.subtasks.findIndex((s) => s.id === activeId);
    const newIdx = todo.subtasks.findIndex((s) => s.id === overId);
    onToggleSubtask(todo.id, null, null, arrayMove(todo.subtasks, oldIdx, newIdx));
  }

  const showProgress = hasSubtasks && pct > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group relative card-hover glass rounded-xl border-l-4 ${cardBorder} ${cardBg} shadow-md ${
          isDragging ? 'opacity-50 scale-105 z-50 shadow-2xl' : ''
        } ${todo.completed ? 'opacity-60' : ''} ${
          isSelected ? (isDarkTheme ? 'ring-2 ring-blue-400' : 'ring-2 ring-blue-500') : ''
        }`}
      >
        <div className="flex items-start gap-3 p-4 sm:p-5">
          {/* Bulk select checkbox OR drag handle */}
          {isBulkMode ? (
            <button
              onClick={() => onSelect(todo.id)}
              className="flex-shrink-0 mt-1"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-blue-500 border-blue-500'
                  : isDarkTheme ? 'border-gray-500' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ) : canDrag ? (
            <button
              {...attributes}
              {...listeners}
              className="drag-handle flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing mt-1"
            >
              <DragDots />
            </button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}

          {/* Expand arrow */}
          {hasSubtasks && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1"
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <path d="M9 18l6-6-6-6" />
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

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') { setEditText(todo.text); setIsEditing(false); }
                }}
                className={`w-full px-3 py-2 text-sm font-semibold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkTheme ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                }`}
                autoFocus
              />
            ) : (
              <div
                className={`text-[15px] leading-snug font-semibold break-words ${
                  todo.completed ? 'line-through text-gray-500 dark:text-gray-600' : ''
                }`}
                style={!todo.completed ? { color: isDarkTheme ? '#f5f5f5' : '#0a0a0a' } : undefined}
                onDoubleClick={(e) => {
                  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') setIsEditing(true);
                }}
              >
                {todo.text}
                {hasSubtasks && (
                  <span className={`ml-2 text-xs font-medium ${
                    pct === 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {pct}%
                  </span>
                )}
              </div>
            )}

            {/* Progress bar */}
            {showProgress && (
              <ProgressBar
                pct={pct}
                colorClass={pct === 100 ? 'bg-green-500' : pStyle.bar}
                className="mt-2"
              />
            )}

            {/* Badges row */}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {/* Due date — always shown when present */}
                {dueInfo && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                    dueInfo.overdue
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800'
                      : dueInfo.today
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    {dueInfo.label}
                  </span>
                )}

                {/* Recurring badge */}
                {todo.recurrence && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M1 4v6h6M23 20v-6h-6"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    {todo.recurrence}
                  </span>
                )}

                {/* Priority + tag — advanced mode only */}
                {mode === 'advanced' && (
                  <>
                    <span className={`priority-badge inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${pStyle.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot} animate-pulse`} />
                      <span className="capitalize">{todo.priority}</span>
                    </span>
                    {todo.tag && (
                      <span className={`priority-badge text-xs font-medium px-2.5 py-1 rounded-full ${tagColorClass}`}>
                        #{todo.tag}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Notes section */}
            {isNotesOpen && (
              <div className="mt-3">
                <textarea
                  value={notesText}
                  onChange={(e) => {
                    setNotesText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 192) + 'px';
                  }}
                  onBlur={handleNotesSave}
                  placeholder="Add notes..."
                  style={{ minHeight: '3rem', maxHeight: '192px', overflowY: 'auto' }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkTheme
                      ? 'bg-gray-700/60 border-gray-600 text-gray-200 placeholder:text-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-700 placeholder:text-gray-400'
                  }`}
                />
              </div>
            )}

            {/* Action buttons row */}
            {!isEditing && (
              <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-xs font-medium hover:text-blue-600 dark:hover:text-blue-400"
                  style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                >
                  + subtask
                </button>
                <button
                  onClick={() => setIsNotesOpen((o) => !o)}
                  className={`text-xs font-medium ${
                    notesText ? 'text-amber-600 dark:text-amber-400' : ''
                  } hover:text-amber-600 dark:hover:text-amber-400`}
                  style={!notesText ? { color: isDarkTheme ? '#9ca3af' : '#6b7280' } : undefined}
                >
                  {isNotesOpen ? '↑ notes' : notesText ? '· notes' : '+ notes'}
                </button>
              </div>
            )}

            {/* Add subtask form */}
            {isAddingSubtask && (
              <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2">
                <div className="relative flex-1 min-w-0 flex items-center">
                  <input
                    type="text"
                    value={subtaskText}
                    onChange={(e) => setSubtaskText(e.target.value)}
                    placeholder={isSubtaskRecording ? 'Listening…' : 'Add a subtask…'}
                    className={`w-full pr-8 px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkTheme
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                    } ${isSubtaskRecording ? 'ring-2 ring-rose-400' : ''}`}
                    autoFocus
                    onBlur={() => setTimeout(() => { if (!subtaskText.trim()) setIsAddingSubtask(false); }, 150)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSubtaskVoice((finalText) => {
                      if (finalText.trim()) {
                        onAddSubtask(todo.id, finalText.trim());
                        setSubtaskText('');
                        setIsAddingSubtask(false);
                      }
                    })}
                    className={`absolute right-2 transition-all ${
                      isSubtaskRecording
                        ? 'text-rose-500 animate-pulse'
                        : isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isSubtaskRecording ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" />
                      </svg>
                    )}
                  </button>
                </div>
                <button type="submit" className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingSubtask(false); setSubtaskText(''); }}
                  className={`shrink-0 px-3 py-1.5 text-sm rounded-lg ${
                    isDarkTheme ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ✕
                </button>
              </form>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={() => onDelete(todo.id)}
            className="delete-btn flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 mt-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="mt-2 space-y-1.5 pl-10">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              if (over && active.id !== over.id) handleReorderSubtasks(active.id, over.id);
            }}
          >
            <SortableContext items={todo.subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {todo.subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  rootTodoId={todo.id}
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

function DragDots() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="4" cy="4" r="1.5" /><circle cx="4" cy="8" r="1.5" /><circle cx="4" cy="12" r="1.5" />
      <circle cx="12" cy="4" r="1.5" /><circle cx="12" cy="8" r="1.5" /><circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}
