'use client';
import { useState } from 'react';

export default function RoomSection({
  rooms,
  activeRoomId,
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onDeleteRoom,
  username,
  loading,
  error,
  onClearError,
  isDarkTheme,
}) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [inputVal, setInputVal] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const room = await onCreateRoom(inputVal.trim());
    if (room) { setMode(null); setInputVal(''); }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const room = await onJoinRoom(inputVal.trim());
    if (room) { setMode(null); setInputVal(''); onSelectRoom(room); }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const labelCls = `text-xl font-bold mb-5 block ${isDarkTheme ? 'text-white' : 'text-gray-900'}`;
  const btnBase = `flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDarkTheme ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-black/6 text-gray-700 hover:bg-black/10'}`;

  return (
    <div className="mt-6 pt-5 border-t border-black/25 dark:border-white/20">
      <span className={labelCls}>Rooms</span>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-2">
          {error}
          <button onClick={onClearError} className="shrink-0 hover:opacity-70">✕</button>
        </div>
      )}

      <div className="space-y-1">
        {rooms.map((room) => {
          const isActive = room.id === activeRoomId;
          const isOwner = room.owner === username;
          const isConfirming = confirmId === room.id;

          return (
            <div
              key={room.id}
              className={`group rounded-xl transition-all ${isActive ? (isDarkTheme ? 'bg-white/10' : 'bg-black/8') : (isDarkTheme ? 'hover:bg-white/5' : 'hover:bg-black/4')}`}
            >
              {isConfirming ? (
                <div className="p-3">
                  <p className={`text-xs font-medium mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
                    {isOwner ? `Delete "${room.name}"? This removes it for everyone.` : `Leave "${room.name}"?`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (isOwner) await onDeleteRoom(room.id);
                        else await onLeaveRoom(room.id);
                        setConfirmId(null);
                      }}
                      className="flex-1 px-2 py-1 text-xs font-bold rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                    >
                      {isOwner ? 'Delete' : 'Leave'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className={`flex-1 px-2 py-1 text-xs font-bold rounded-lg ${isDarkTheme ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5">
                  <button onClick={() => onSelectRoom(room)} className="flex-1 text-left min-w-0">
                    <div className={`text-sm font-semibold truncate ${isDarkTheme ? 'text-gray-100' : 'text-gray-800'}`}>
                      {room.name}
                    </div>
                    <div className={`text-xs mt-0.5 font-mono tracking-widest ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {room.code}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button
                      onClick={() => copyCode(room.code)}
                      title="Copy join code"
                      className={`p-1.5 rounded-lg ${isDarkTheme ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-black/8'}`}
                    >
                      {copiedCode === room.code ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmId(room.id)}
                      title={isOwner ? 'Delete room' : 'Leave room'}
                      className={`p-1.5 rounded-lg ${isDarkTheme ? 'text-gray-400 hover:bg-white/10 hover:text-rose-400' : 'text-gray-500 hover:bg-black/8 hover:text-rose-500'}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        {isOwner
                          ? <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></>
                          : <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                        }
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="mt-3 space-y-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Room name…"
            autoFocus
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-gray-500 ${isDarkTheme ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold rounded-lg disabled:opacity-50">
              {loading ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => { setMode(null); setInputVal(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${isDarkTheme ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="mt-3 space-y-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Enter 6-char code…"
            maxLength={8}
            autoFocus
            className={`w-full px-3 py-2 text-sm font-mono rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-gray-500 ${isDarkTheme ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold rounded-lg disabled:opacity-50">
              {loading ? 'Joining…' : 'Join'}
            </button>
            <button type="button" onClick={() => { setMode(null); setInputVal(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${isDarkTheme ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!mode && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => setMode('create')} className={btnBase}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            New room
          </button>
          <button onClick={() => setMode('join')} className={btnBase}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
            Join
          </button>
        </div>
      )}
    </div>
  );
}
