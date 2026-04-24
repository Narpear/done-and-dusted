'use client';

import { useState } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { calcProgressPct } from '../lib/utils';
import ProgressBar from './ProgressBar';

export default function SubtaskItem({
  subtask,
  rootTodoId,          // always the top-level todo's id
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
  isDarkTheme,
  level = 0,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingNested, setIsAddingNested] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nestedText, setNestedText] = useState('');
  const [editText, setEditText] = useState(subtask.text);

  const { isRecording: isNestedRecording, toggle: toggleNestedVoice } = useVoiceInput(
    (transcript) => setNestedText(transcript)
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const hasNested = subtask.subtasks && subtask.subtasks.length > 0;
  const pct = calcProgressPct(subtask);

  function handleAddNested(e) {
    e.preventDefault();
    if (!nestedText.trim()) return;
    const newNested = {
      id: Date.now().toString(),
      text: nestedText,
      completed: false,
      subtasks: [],
    };
    // Pass updatedSubtask so deepUpdateSubtask can merge it
    onToggleSubtask(rootTodoId, subtask.id, { ...subtask, subtasks: [...(subtask.subtasks || []), newNested] });
    setNestedText('');
    setIsAddingNested(false);
  }

  function handleEdit() {
    if (!editText.trim()) return;
    onEditSubtask(rootTodoId, subtask.id, editText);
    setIsEditing(false);
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`glass rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group ${
          isDragging ? 'opacity-50 scale-105 z-50' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing"
          >
            <DragDots size={12} />
          </button>

          {/* Expand arrow */}
          {hasNested && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          {/* Checkbox */}
          <input
            type="checkbox"
            checked={subtask.completed}
            onChange={() => onToggleSubtask(rootTodoId, subtask.id)}
            className="checkbox-custom flex-shrink-0"
            style={{ width: '1rem', height: '1rem' }}
          />

          {/* Text + progress */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') { setEditText(subtask.text); setIsEditing(false); }
                }}
                className={`w-full px-2 py-1 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDarkTheme ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                }`}
                autoFocus
              />
            ) : (
              <div
                className={`text-sm font-semibold truncate ${
                  subtask.completed ? 'line-through text-gray-500 dark:text-gray-600' : ''
                }`}
                style={!subtask.completed ? { color: isDarkTheme ? '#f5f5f5' : '#0a0a0a' } : undefined}
                onDoubleClick={() => setIsEditing(true)}
                title={subtask.text}
              >
                {subtask.text}
                {hasNested && (
                  <span className="ml-1.5 text-xs text-gray-500 font-normal">
                    {pct}%
                  </span>
                )}
              </div>
            )}

            {/* Partial progress bar for subtask */}
            {hasNested && pct > 0 && pct < 100 && (
              <ProgressBar pct={pct} colorClass="bg-blue-400" className="mt-1" />
            )}

            {/* Add nested button */}
            {!isAddingNested && !isEditing && level < 3 && (
              <button
                onClick={() => setIsAddingNested(true)}
                className="opacity-0 group-hover:opacity-100 mt-1 text-xs font-medium transition-opacity hover:text-blue-600 dark:hover:text-blue-400"
                style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
              >
                + nested
              </button>
            )}

            {/* Add nested form */}
            {isAddingNested && (
              <form onSubmit={handleAddNested} className="mt-1.5 flex gap-1.5">
                <div className="relative flex-1 min-w-0 flex items-center">
                  <input
                    type="text"
                    value={nestedText}
                    onChange={(e) => setNestedText(e.target.value)}
                    placeholder={isNestedRecording ? 'Listening…' : 'Nested task…'}
                    className={`w-full pr-7 px-2 py-1 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDarkTheme ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                    } ${isNestedRecording ? 'ring-1 ring-rose-400' : ''}`}
                    autoFocus
                    onBlur={() => setTimeout(() => { if (!nestedText.trim()) setIsAddingNested(false); }, 150)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleNestedVoice((finalText) => {
                      if (!finalText.trim()) return;
                      const newNested = { id: Date.now().toString(), text: finalText.trim(), completed: false, subtasks: [] };
                      onToggleSubtask(rootTodoId, subtask.id, { ...subtask, subtasks: [...(subtask.subtasks || []), newNested] });
                      setNestedText('');
                      setIsAddingNested(false);
                    })}
                    className={`absolute right-1.5 transition-all ${
                      isNestedRecording
                        ? 'text-rose-500 animate-pulse'
                        : isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isNestedRecording ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" />
                      </svg>
                    )}
                  </button>
                </div>
                <button type="submit" className="shrink-0 px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                  Add
                </button>
              </form>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() => onDeleteSubtask(rootTodoId, subtask.id)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Nested subtasks */}
      {hasNested && isExpanded && (
        <div className="mt-1.5 pl-6 space-y-1.5">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              if (over && active.id !== over.id) {
                const oldIdx = subtask.subtasks.findIndex((s) => s.id === active.id);
                const newIdx = subtask.subtasks.findIndex((s) => s.id === over.id);
                onToggleSubtask(rootTodoId, subtask.id, {
                  ...subtask,
                  subtasks: arrayMove(subtask.subtasks, oldIdx, newIdx),
                });
              }
            }}
          >
            <SortableContext items={subtask.subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {subtask.subtasks.map((nested) => (
                <SubtaskItem
                  key={nested.id}
                  subtask={nested}
                  rootTodoId={rootTodoId}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onEditSubtask={onEditSubtask}
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

function DragDots({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <circle cx="4" cy="4" r="1.2" /><circle cx="4" cy="8" r="1.2" /><circle cx="4" cy="12" r="1.2" />
      <circle cx="12" cy="4" r="1.2" /><circle cx="12" cy="8" r="1.2" /><circle cx="12" cy="12" r="1.2" />
    </svg>
  );
}