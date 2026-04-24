'use client';

import { useState } from 'react';

export default function Sidebar({
  lists,
  currentListId,
  setCurrentListId,
  onAddList,
  onDeleteList,
  onEditList,
  isDarkTheme,
}) {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function handleAdd(e) {
    e.preventDefault();
    if (!newListName.trim()) return;
    onAddList(newListName.trim());
    setNewListName('');
    setIsAddingList(false);
  }

  function handleEdit(listId) {
    if (!editName.trim()) { setEditingId(null); return; }
    onEditList(listId, editName.trim());
    setEditingId(null);
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <h2 className={`text-xl font-bold mb-5 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
        My Lists
      </h2>

      <div className="space-y-1.5">
        {lists.map((list) => {
          const isActive = list.id === currentListId;
          const completedCount = list.todos.filter((t) => t.completed).length;
          const totalCount = list.todos.length;
          const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isConfirming = confirmDeleteId === list.id;

          return (
            <div
              key={list.id}
              className={`group rounded-xl transition-all ${
                isActive
                  ? isDarkTheme
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-black/8 text-gray-800 shadow-sm'
                  : isDarkTheme
                  ? 'hover:bg-white/10 text-gray-200'
                  : 'hover:bg-black/5 text-gray-700'
              }`}
            >
              {editingId === list.id ? (
                <div className="p-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleEdit(list.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEdit(list.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className={`w-full px-2 py-1 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkTheme ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    autoFocus
                  />
                </div>
              ) : isConfirming ? (
                /* Inline delete confirmation */
                <div className="p-3">
                  <p className={`text-xs font-medium mb-2 ${isActive ? 'text-blue-100' : isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                    Delete &ldquo;{list.name}&rdquo;? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDeleteList(list.id); setConfirmDeleteId(null); }}
                      className="flex-1 px-2 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className={`flex-1 px-2 py-1 text-xs font-bold rounded-lg ${
                        isDarkTheme ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3">
                  <button onClick={() => setCurrentListId(list.id)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                      </svg>
                      <span className="font-semibold truncate">{list.name}</span>
                    </div>
                    <div className={`text-xs mt-0.5 ${
                      isActive
                        ? isDarkTheme ? 'text-gray-300' : 'text-gray-500'
                        : isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {totalCount === 0 ? 'No tasks' : `${completedCount}/${totalCount} done`}
                    </div>
                    {/* Progress bar */}
                    {totalCount > 0 && (
                      <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${
                        isDarkTheme ? 'bg-gray-700' : 'bg-black/10'
                      }`}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isDarkTheme ? 'bg-gray-400' : 'bg-gray-500/50'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(list.id); setEditName(list.name); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'text-white hover:bg-white/20' : isDarkTheme ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Rename list"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {lists.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(list.id); }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive ? 'text-white hover:bg-white/20' : isDarkTheme ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Delete list"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new list */}
      {isAddingList ? (
        <form onSubmit={handleAdd} className="mt-3">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="List name..."
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkTheme ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
            }`}
            autoFocus
            onBlur={() => setTimeout(() => { if (!newListName.trim()) setIsAddingList(false); }, 150)}
          />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-md">
              Add
            </button>
            <button
              type="button"
              onClick={() => { setIsAddingList(false); setNewListName(''); }}
              className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg ${
                isDarkTheme ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
            isDarkTheme ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New List
        </button>
      )}
    </div>
  );
}
