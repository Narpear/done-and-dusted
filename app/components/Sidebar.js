'use client';

import { useState } from 'react';
import RoomSection from './RoomSection';

export default function Sidebar({
  lists,
  currentListId,
  setCurrentListId,
  onAddList,
  onDeleteList,
  onEditList,
  isDarkTheme,
  isImageTheme,
  // room props
  rooms,
  activeRoomId,
  onSelectRoom,
  onExitRoom,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onDeleteRoom,
  roomsLoading,
  roomsError,
  onClearRoomsError,
  username,
}) {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const textPrimary   = isDarkTheme ? 'text-white'     : 'text-gray-900';
  const textSecondary = isDarkTheme ? 'text-gray-300'  : 'text-gray-700';
  const activeBg      = isDarkTheme ? 'bg-white/10 text-white' : 'bg-black/8 text-gray-800';
  const hoverBg       = isDarkTheme ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-black/5 text-gray-700';

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
    <div className="h-full p-6 overflow-y-auto flex flex-col">
      <h2 className={`text-xl font-bold mb-5 ${textPrimary}`}>My Lists</h2>

      <div className="space-y-1.5">
        {lists.map((list) => {
          const isActive = list.id === currentListId && !activeRoomId;
          const completedCount = list.todos.filter((t) => t.completed).length;
          const totalCount = list.todos.length;
          const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isConfirming = confirmDeleteId === list.id;

          return (
            <div
              key={list.id}
              className={`group rounded-xl transition-all ${isActive ? activeBg : hoverBg}`}
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
                <div className="p-3">
                  <p className={`text-xs font-medium mb-2 ${textSecondary}`}>
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
                        isDarkTheme ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3">
                  <button
                    onClick={() => { setCurrentListId(list.id); onExitRoom?.(); }}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                      </svg>
                      <span className="font-semibold truncate">{list.name}</span>
                    </div>
                    <div className={`text-xs mt-0.5 ${textSecondary}`}>
                      {totalCount === 0 ? 'No tasks' : `${completedCount}/${totalCount} done`}
                    </div>
                    {totalCount > 0 && (
                      <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${isDarkTheme ? 'bg-white/10' : 'bg-black/10'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isDarkTheme ? 'bg-white/40' : 'bg-gray-400/60'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(list.id); setEditName(list.name); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'text-white hover:bg-white/20' : isDarkTheme ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
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
                          isActive ? 'text-white hover:bg-white/20' : isDarkTheme ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
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
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
              isDarkTheme ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
            }`}
            autoFocus
            onBlur={() => setTimeout(() => { if (!newListName.trim()) setIsAddingList(false); }, 150)}
          />
          <div className="flex gap-2 mt-2">
            <button type="submit" className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg ${isDarkTheme ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-black/6 text-gray-700 hover:bg-black/10'}`}>
              Add
            </button>
            <button
              type="button"
              onClick={() => { setIsAddingList(false); setNewListName(''); }}
              className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg ${
                isDarkTheme ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingList(true)}
          className={`w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDarkTheme ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-black/6 text-gray-700 hover:bg-black/10'}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New List
        </button>
      )}

      {/* Rooms section */}
      <RoomSection
        rooms={rooms || []}
        activeRoomId={activeRoomId}
        onSelectRoom={onSelectRoom}
        onCreateRoom={onCreateRoom}
        onJoinRoom={onJoinRoom}
        onLeaveRoom={onLeaveRoom}
        onDeleteRoom={onDeleteRoom}
        username={username}
        loading={roomsLoading}
        error={roomsError}
        onClearError={onClearRoomsError}
        isDarkTheme={isDarkTheme}
      />
    </div>
  );
}
