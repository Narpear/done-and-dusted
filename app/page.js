'use client';

import { useRef, useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { THEMES, FONTS, KEYBOARD_SHORTCUTS } from './lib/constants';
import { formatDate } from './lib/utils';
import { useTodos } from './hooks/useTodos';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUser } from './hooks/useUser';
import { useRooms } from './hooks/useRooms';
import { useRoomTodos } from './hooks/useRoomTodos';
import { usePresence } from './hooks/usePresence';
import { useActivity } from './hooks/useActivity';

import Sidebar from './components/Sidebar';
import AddTodoForm from './components/AddTodoForm';
import StatsBar from './components/StatsBar';
import TodoItem from './components/TodoItem';
import CompletedSection from './components/CompletedSection';
import UserSetupModal from './components/UserSetupModal';
import ActivityPanel from './components/ActivityPanel';

export default function TodoApp() {
  const todoInputRef = useRef(null);
  const confettiCanvasRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('all');

  // Bulk selection
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  const {
    lists, currentListId, setCurrentListId,
    todos, theme, setTheme, font, setFont, mode, setMode, layout, setLayout,
    sortBy, setSortBy,
    deletedTodo, undoDelete, dismissUndo,
    addTodo, toggleTodo, deleteTodo, editTodo, updateTodoNotes,
    bulkDelete, bulkComplete, moveTodosToList,
    addSubtask, toggleSubtask, deleteSubtask, editSubtask,
    handleDragEnd,
    addList, deleteList, editList,
  } = useTodos();

  const currentTheme = THEMES[theme] || THEMES['rose-gold'];
  const currentFont = FONTS[font] || FONTS.inter;
  const isDarkTheme = currentTheme.dark || false;
  const isImageTheme = !!currentTheme.bgImage;

  // ── User identity ──────────────────────────────────────────────────────────
  const { username, color: userColor, ready: userReady, saveUser, needsSetup } = useUser();

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const [activeRoom, setActiveRoom] = useState(null);
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false);

  const { rooms, loading: roomsLoading, error: roomsError, setError: setRoomsError, createRoom, joinRoom, leaveRoom, deleteRoom } = useRooms(username);
  const roomTodos = useRoomTodos(activeRoom?.id, username);
  const { onlineUsers } = usePresence(activeRoom?.id, username);
  const { events: activityEvents } = useActivity(activeRoom?.id);

  const inRoomMode = !!activeRoom;

  // Effective todo data — room or local
  const effectiveTodos       = inRoomMode ? roomTodos.todos       : todos;
  const effectiveAddTodo     = inRoomMode ? roomTodos.addTodo     : addTodo;
  const effectiveToggleTodo  = inRoomMode ? roomTodos.toggleTodo  : toggleTodo;
  const effectiveDeleteTodo  = inRoomMode ? roomTodos.deleteTodo  : deleteTodo;
  const effectiveEditTodo    = inRoomMode ? roomTodos.editTodo    : editTodo;
  const effectiveNotes       = inRoomMode ? roomTodos.updateTodoNotes : updateTodoNotes;
  const effectiveAddSubtask  = inRoomMode ? roomTodos.addSubtask  : addSubtask;
  const effectiveToggleSub   = inRoomMode ? roomTodos.toggleSubtask : toggleSubtask;
  const effectiveDeleteSub   = inRoomMode ? roomTodos.deleteSubtask : deleteSubtask;
  const effectiveEditSub     = inRoomMode ? roomTodos.editSubtask   : editSubtask;

  function handleSelectRoom(room) {
    setActiveRoom(room);
    setIsActivityPanelOpen(true);
  }

  function handleExitRoom() {
    setActiveRoom(null);
    setIsActivityPanelOpen(false);
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  useKeyboardShortcuts({
    inputRef: todoInputRef,
    onEscape: () => {
      setIsSettingsOpen(false);
      setIsExportOpen(false);
      setIsShortcutsOpen(false);
      clearSelection();
    },
    onToggleHelp: () => setIsShortcutsOpen((o) => !o),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Bulk helpers ──────────────────────────────────────────────────────────
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setIsBulkMode(false);
    setIsMoveOpen(false);
  }

  function handleBulkDelete() {
    bulkDelete(selectedIds);
    clearSelection();
  }

  function handleBulkComplete() {
    bulkComplete(selectedIds);
    clearSelection();
  }

  function handleMoveTo(targetListId) {
    moveTodosToList(selectedIds, targetListId);
    clearSelection();
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  function applySortTo(todos) {
    if (sortBy === 'manual') return todos;
    return [...todos].sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
  }

  // ── Derived filter + sort state ────────────────────────────────────────────
  const allTags = ['all', ...new Set(effectiveTodos.filter((t) => t.tag).map((t) => t.tag))];

  const filteredTodos = effectiveTodos.filter((t) => selectedTag === 'all' || t.tag === selectedTag);

  const activeTodos = applySortTo(filteredTodos.filter((t) => !t.completed));
  const completedTodos = filteredTodos.filter((t) => t.completed);

  const stats = {
    total: filteredTodos.length,
    active: activeTodos.length,
    completed: completedTodos.length,
    completion: filteredTodos.length ? Math.round((completedTodos.length / filteredTodos.length) * 100) : 0,
  };

  const columns = [[], [], []];
  activeTodos.forEach((todo, i) => columns[i % 3].push(todo));

  const canDrag = sortBy === 'manual';
  const otherLists = lists.filter((l) => l.id !== currentListId);

  // ── Export helpers ──────────────────────────────────────────────────────────
  function renderSubtasksText(subtasks, level = 0) {
    return subtasks.reduce((acc, s) => {
      const indent = '  '.repeat(level + 1);
      acc += `${indent}${s.completed ? '✓' : '○'} ${s.text}\n`;
      if (s.subtasks?.length) acc += renderSubtasksText(s.subtasks, level + 1);
      return acc;
    }, '');
  }

  function buildTextExport() {
    let text = `TODO LIST\n${formatDate()}\n${'='.repeat(50)}\n\n`;
    filteredTodos.forEach((todo) => {
      text += `${todo.completed ? '✓' : '○'} ${todo.text}`;
      if (mode === 'advanced') {
        if (todo.tag) text += ` [#${todo.tag}]`;
        if (todo.dueDate) text += ` (Due: ${new Date(todo.dueDate).toLocaleDateString()})`;
        text += ` [${todo.priority.toUpperCase()}]`;
      }
      text += '\n';
      if (todo.notes) text += `  📝 ${todo.notes}\n`;
      if (todo.subtasks?.length) text += renderSubtasksText(todo.subtasks);
      text += '\n';
    });
    return text;
  }

  function exportAsJSON() {
    const blob = new Blob([JSON.stringify({ exportDate: formatDate(), todos: filteredTodos }, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `todos-${today()}.json`);
  }

  function exportAsMarkdown() {
    const renderMd = (subtasks, level = 0) =>
      subtasks.reduce((acc, s) => {
        acc += `${'  '.repeat(level + 1)}- [${s.completed ? 'x' : ' '}] ${s.text}\n`;
        if (s.subtasks?.length) acc += renderMd(s.subtasks, level + 1);
        return acc;
      }, '');

    let md = `# Todo List\n\n**${formatDate()}**\n\n`;
    filteredTodos.forEach((todo) => {
      md += `- [${todo.completed ? 'x' : ' '}] **${todo.text}**`;
      if (mode === 'advanced') {
        if (todo.tag) md += ` #${todo.tag}`;
        if (todo.dueDate) md += ` (Due: ${new Date(todo.dueDate).toLocaleDateString()})`;
        md += ` [${todo.priority} priority]`;
      }
      md += '\n';
      if (todo.subtasks?.length) md += renderMd(todo.subtasks);
      md += '\n';
    });
    triggerDownload(new Blob([md], { type: 'text/markdown' }), `todos-${today()}.md`);
  }

  function exportAsText() {
    triggerDownload(new Blob([buildTextExport()], { type: 'text/plain' }), `todos-${today()}.txt`);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(buildTextExport());
    alert('Copied to clipboard!');
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function today() { return new Date().toISOString().split('T')[0]; }

  // ── Shared todo item props ──────────────────────────────────────────────────
  const todoItemProps = {
    onToggle: effectiveToggleTodo,
    onDelete: effectiveDeleteTodo,
    onEdit: effectiveEditTodo,
    onAddSubtask: effectiveAddSubtask,
    onToggleSubtask: effectiveToggleSub,
    onDeleteSubtask: effectiveDeleteSub,
    onEditSubtask: effectiveEditSub,
    onUpdateNotes: effectiveNotes,
    mode,
    isDarkTheme,
    confettiCanvasRef,
    isBulkMode: inRoomMode ? false : isBulkMode,
    onSelect: toggleSelect,
    canDrag: inRoomMode ? false : canDrag,
    roomMembers: inRoomMode ? roomTodos.members : null,
    onAssign: inRoomMode ? roomTodos.assignTodo : null,
  };

  const SORT_OPTIONS = [
    { key: 'manual', label: 'Manual' },
    { key: 'priority', label: 'Priority' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'createdAt', label: 'Newest' },
  ];

  return (
    <div
      className={`h-screen overflow-hidden ${currentTheme.bgImage ? 'bg-image' : currentTheme.bg} ${currentFont.class} transition-all duration-500 flex`}
    >
      {/* Username setup modal */}
      {userReady && needsSetup && <UserSetupModal onSave={saveUser} isDarkTheme={isDarkTheme} />}

      {currentTheme.bgImage && (
        <div
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: `url('${currentTheme.bgImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: 0.7,
          }}
        />
      )}
      {/* Full-screen confetti canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* Keyboard shortcuts overlay */}
      {isShortcutsOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setIsShortcutsOpen(false)}
        >
          <div
            className={`glass rounded-2xl p-6 shadow-2xl w-80 ${isDarkTheme ? 'bg-gray-900/95' : 'bg-white/95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Keyboard Shortcuts
            </h3>
            <div className="space-y-3">
              {KEYBOARD_SHORTCUTS.map(({ keys, description }) => (
                <div key={description} className="flex items-center justify-between gap-4">
                  <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>{description}</span>
                  <div className="flex gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md border ${
                        isDarkTheme ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                      }`}>
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="mt-5 w-full py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 shrink-0 overflow-hidden`}>
        <div className={`h-full border-r overflow-y-auto backdrop-blur-xl ${
          isDarkTheme ? 'bg-gray-900/50 border-gray-700/20' : 'bg-white/30 border-white/20'
        }`}>
          <Sidebar
            lists={lists}
            currentListId={currentListId}
            setCurrentListId={setCurrentListId}
            onAddList={addList}
            onDeleteList={deleteList}
            onEditList={editList}
            isDarkTheme={isDarkTheme}
            isImageTheme={isImageTheme}
            rooms={rooms}
            activeRoomId={activeRoom?.id}
            onSelectRoom={handleSelectRoom}
            onExitRoom={handleExitRoom}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onLeaveRoom={async (id) => { await leaveRoom(id); if (activeRoom?.id === id) handleExitRoom(); }}
            onDeleteRoom={async (id) => { await deleteRoom(id); if (activeRoom?.id === id) handleExitRoom(); }}
            roomsLoading={roomsLoading}
            roomsError={roomsError}
            onClearRoomsError={() => setRoomsError(null)}
            username={username}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="px-30 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-6">
              <div>
                <h1 className="text-5xl font-bold mb-2">
                  <span className="gradient-text" style={isImageTheme ? { WebkitTextFillColor: currentTheme.titleColor } : undefined}>Done and Dusted</span>
                </h1>
                <div className="flex items-center gap-3">
                  <p
                    className={`text-base font-bold ${isDarkTheme ? 'text-white/80' : isImageTheme ? '' : 'text-gray-600'}`}
                    style={isImageTheme ? { color: currentTheme.textColor } : undefined}
                  >
                    {formatDate()}
                  </p>
                  {inRoomMode && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-black/20 dark:bg-white/10 dark:text-gray-200"
                      style={isImageTheme ? { color: currentTheme.textColor } : undefined}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                      {activeRoom.name} · {activeRoom.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Activity panel toggle — only in room mode */}
                {inRoomMode && (
                  <button
                    onClick={() => setIsActivityPanelOpen((o) => !o)}
                    className={`glass rounded-xl px-3 py-2.5 shadow-lg flex items-center gap-2 hover:shadow-xl transition-all font-semibold text-sm ${
                      isActivityPanelOpen
                        ? 'bg-indigo-600 text-white'
                        : isDarkTheme ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    <span className="font-semibold text-sm">Activity</span>
                  </button>
                )}

                {/* Layout toggle */}
                <div className="glass rounded-xl p-1.5 shadow-lg">
                  <button onClick={() => setLayout('grid')} className={layoutBtnClass(layout === 'grid', isDarkTheme)} title="Grid view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </button>
                  <button onClick={() => setLayout('list')} className={layoutBtnClass(layout === 'list', isDarkTheme)} title="List view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="4" width="18" height="3" rx="1" /><rect x="3" y="10" width="18" height="3" rx="1" />
                      <rect x="3" y="16" width="18" height="3" rx="1" />
                    </svg>
                  </button>
                </div>

                {/* Export */}
                <div className="relative">
                  <button
                    onClick={() => setIsExportOpen((o) => !o)}
                    className={`glass rounded-xl px-3 py-2.5 shadow-lg flex items-center gap-2 hover:shadow-xl transition-all ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    <span className="font-semibold text-sm">Export</span>
                  </button>
                  {isExportOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                      <div className={`dropdown-menu absolute right-0 mt-2 w-52 rounded-xl shadow-2xl z-20 border p-2 ${
                        isDarkTheme ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        {[
                          ['JSON', 'Data backup', exportAsJSON],
                          ['Markdown', 'Documentation', exportAsMarkdown],
                          ['Plain Text', 'Simple format', exportAsText],
                          ['Copy to Clipboard', 'Quick share', copyToClipboard],
                        ].map(([label, sub, fn]) => (
                          <button key={label} onClick={() => { fn(); setIsExportOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${
                              isDarkTheme
                                ? 'text-gray-200 hover:bg-gray-800'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}>
                            <div className="font-semibold text-sm">{label}</div>
                            <div className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Settings */}
                <div className="relative">
                  <button
                    onClick={() => setIsSettingsOpen((o) => !o)}
                    className={`glass rounded-xl px-3 py-2.5 shadow-lg flex items-center gap-2 hover:shadow-xl transition-all ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v4m0 14v4M1 12h4m14 0h4m-3.5-7.5-2.83 2.83M7.33 16.67l-2.83 2.83M20.5 19.5l-2.83-2.83M7.33 7.33 4.5 4.5" />
                    </svg>
                    <span className="font-semibold text-sm">Settings</span>
                  </button>
                  {isSettingsOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)} />
                      <div className="dropdown-menu settings-panel absolute right-0 mt-2 w-72 glass rounded-xl shadow-2xl z-20 border border-gray-200/50 dark:border-gray-700/50 p-4 space-y-5">

                        {/* Mode */}
                        <div>
                          <label className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                            Mode
                          </label>
                          <div className={`flex rounded-lg overflow-hidden border ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
                            {['basic', 'advanced'].map((m) => (
                              <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${
                                  mode === m
                                    ? 'bg-gray-700 text-white'
                                    : isDarkTheme ? 'text-gray-300 hover:bg-gray-700/60' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Theme swatches */}
                        <div className="space-y-3">
                          {/* Gradients */}
                          <div>
                            <label className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                              Color Gradients
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(THEMES).filter(([, t]) => !t.bgImage).map(([key, t]) => (
                                <SwatchButton key={key} themeKey={key} t={t} active={theme === key} onSelect={setTheme} isDarkTheme={isDarkTheme} />
                              ))}
                            </div>
                          </div>
                          {/* Backdrops */}
                          <div>
                            <label className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                              Backdrops
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(THEMES).filter(([, t]) => !!t.bgImage).map(([key, t]) => (
                                <SwatchButton key={key} themeKey={key} t={t} active={theme === key} onSelect={setTheme} isDarkTheme={isDarkTheme} />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Font list */}
                        <div>
                          <label className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                            Font
                          </label>
                          <div className={`rounded-lg border overflow-hidden ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
                            {Object.entries(FONTS).map(([key, f], i, arr) => (
                              <button
                                key={key}
                                onClick={() => setFont(key)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2 ${
                                  font === key
                                    ? 'bg-gray-700 text-white'
                                    : isDarkTheme ? 'text-gray-200 hover:bg-gray-700/60' : 'text-gray-800 hover:bg-gray-50'
                                } ${i < arr.length - 1 ? (isDarkTheme ? 'border-b border-gray-700/50' : 'border-b border-gray-100') : ''}`}
                                style={{ fontFamily: f.family }}
                              >
                                <span>{f.name}</span>
                                {font === key && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Keyboard shortcuts */}
                        <button
                          onClick={() => { setIsSettingsOpen(false); setIsShortcutsOpen(true); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                            isDarkTheme ? 'text-gray-300 hover:bg-gray-700/60' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01M8 15h8" strokeLinecap="round" />
                          </svg>
                          Keyboard Shortcuts
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded font-mono ${isDarkTheme ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>?</span>
                        </button>

                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <StatsBar
              stats={stats}
              allTags={allTags}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              mode={mode}
              isDarkTheme={isDarkTheme}
              isImageTheme={isImageTheme}
            />
          </div>

          {/* Room list tabs */}
          {inRoomMode && roomTodos.lists.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {roomTodos.lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => roomTodos.setCurrentListId(l.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                    roomTodos.currentListId === l.id
                      ? 'bg-gray-700 text-white shadow-sm'
                      : isDarkTheme || isImageTheme
                      ? 'bg-white/10 text-white/80 hover:bg-white/20'
                      : 'bg-white/70 text-gray-600 hover:bg-white/90'
                  }`}
                >
                  {l.name}
                </button>
              ))}
              <button
                onClick={() => { const n = prompt('New list name'); if (n) roomTodos.addList(n); }}
                className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all ${isDarkTheme || isImageTheme ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-white/70 text-gray-500 hover:bg-white/90'}`}
              >
                + list
              </button>
            </div>
          )}

          {/* Add todo form */}
          <AddTodoForm ref={todoInputRef} onAdd={effectiveAddTodo} mode={mode} isDarkTheme={isDarkTheme} />

          {/* Cards section — inset 0.5 inch extra on each side */}
          <div className="px-12">

          {/* Sort + bulk controls */}
          {(activeTodos.length > 0 || completedTodos.length > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              {/* Sort pills */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkTheme ? 'text-gray-400' : isImageTheme ? 'text-white drop-shadow' : 'text-gray-500'}`}>
                  Sort
                </span>
                {SORT_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      sortBy === key
                        ? 'bg-gray-700 text-white shadow-md'
                        : isDarkTheme
                        ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
                        : isImageTheme
                        ? 'bg-white/95 text-gray-800 hover:bg-white shadow-md backdrop-blur-sm'
                        : 'bg-white/70 text-gray-600 hover:bg-gray-100/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Select / cancel bulk mode */}
              <button
                onClick={() => { if (isBulkMode) clearSelection(); else setIsBulkMode(true); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isBulkMode
                    ? 'bg-rose-500 text-white'
                    : isDarkTheme
                    ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
                    : isImageTheme
                    ? 'bg-white/95 text-gray-800 hover:bg-white shadow-md backdrop-blur-sm'
                    : 'bg-white/70 text-gray-600 hover:bg-gray-100/80'
                }`}
              >
                {isBulkMode ? 'Cancel select' : 'Select'}
              </button>
            </div>
          )}

          {/* Empty state */}
          {activeTodos.length === 0 && completedTodos.length === 0 && (
            <div className="text-center py-20">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 floating-btn ${
                isDarkTheme ? 'bg-white/10' : isImageTheme ? 'bg-white/40' : 'bg-black/6'
              }`}>
                <svg
                  width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={isImageTheme ? { color: currentTheme.textColor } : undefined}
                  className={isDarkTheme ? 'text-white/70' : isImageTheme ? '' : 'text-gray-500'}
                >
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <h3
                className={`text-2xl font-bold mb-2 drop-shadow-lg ${isDarkTheme ? 'text-white' : isImageTheme ? '' : 'text-gray-900'}`}
                style={isImageTheme ? { color: currentTheme.textColor } : undefined}
              >
                {selectedTag === 'all' ? 'No tasks yet' : `No tasks in #${selectedTag}`}
              </h3>
            </div>
          )}

          {/* Active todos */}
          {activeTodos.length > 0 && (
            <DndContext
              sensors={canDrag ? sensors : []}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {layout === 'grid' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {columns.map((colTodos, colIdx) => (
                    <SortableContext key={colIdx} items={colTodos.map((t) => t.id)} strategy={rectSortingStrategy}>
                      <div className="space-y-3">
                        {colTodos.map((todo) => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            {...todoItemProps}
                            isSelected={selectedIds.has(todo.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  ))}
                </div>
              ) : (
                <SortableContext items={activeTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {activeTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        {...todoItemProps}
                        isSelected={selectedIds.has(todo.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </DndContext>
          )}

          {/* Completed tasks */}
          <CompletedSection
            todos={completedTodos}
            {...todoItemProps}
            isBulkMode={false}
          />

          </div>{/* end cards inset */}

        </div>
      </div>

      {/* Activity panel */}
      <ActivityPanel
        isOpen={isActivityPanelOpen && inRoomMode}
        onClose={() => setIsActivityPanelOpen(false)}
        onlineUsers={onlineUsers}
        events={activityEvents}
        currentUsername={username}
        isDarkTheme={isDarkTheme}
      />

      {/* ── Bulk action toolbar ────────────────────────────────────────────── */}
      {isBulkMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-3 glass rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <span className={`text-sm font-semibold mr-1 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleBulkComplete}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            Complete
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Delete
          </button>
          {otherLists.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsMoveOpen((o) => !o)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                  isDarkTheme ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Move to
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {isMoveOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMoveOpen(false)} />
                  <div className={`absolute bottom-full mb-2 left-0 rounded-xl shadow-2xl z-20 border overflow-hidden min-w-35 ${
                    isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    {otherLists.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => { handleMoveTo(l.id); setIsMoveOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          isDarkTheme ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Lists toggle (fixed bottom-left) ──────────────────────────────── */}
      <button
        onClick={() => setIsSidebarOpen((o) => !o)}
        title={isSidebarOpen ? 'Hide lists' : 'Show lists'}
        className={`fixed bottom-6 left-4 z-40 p-2.5 rounded-full transition-all hover:scale-110 shadow-md ${
          isDarkTheme ? 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/80 hover:text-gray-100' : 'bg-white/70 text-gray-500 hover:bg-white/90 hover:text-gray-700'
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={isSidebarOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
        </svg>
      </button>

      {/* ── Undo delete toast ──────────────────────────────────────────────── */}
      {deletedTodo && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 glass rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <span className={`text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
            Task deleted
          </span>
          <button
            onClick={undoDelete}
            className="px-3 py-1 bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Undo
          </button>
          <button
            onClick={dismissUndo}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function SwatchButton({ themeKey, t, active, onSelect, isDarkTheme, size = 28 }) {
  return (
    <div className="relative group/swatch">
      <button
        onClick={() => onSelect(themeKey)}
        className={`block rounded-lg transition-all relative overflow-hidden ${
          active ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : 'hover:scale-110 hover:brightness-90'
        }`}
        style={{ width: size, height: size, background: t.swatchGradient }}
        title={t.name}
      >
        {active && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" className="absolute inset-0 m-auto drop-shadow-md">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover/swatch:opacity-100 transition-opacity pointer-events-none z-30 ${
        isDarkTheme ? 'bg-gray-700 text-gray-100' : 'bg-gray-900 text-white'
      }`}>
        {t.name}
      </div>
    </div>
  );
}

function layoutBtnClass(active, isDarkTheme) {
  return `px-2.5 py-2 rounded-lg transition-all ${
    active
      ? 'bg-gray-700 text-white shadow-md'
      : isDarkTheme ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-700 hover:bg-white/50'
  }`;
}
