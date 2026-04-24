'use client';

const ACTION_META = {
  add_task:      { color: 'text-sky-600',    label: 'added',        path: 'M12 5v14M5 12h14' },
  complete_task: { color: 'text-emerald-600',label: 'completed',    path: 'M5 13l4 4L19 7' },
  delete_task:   { color: 'text-rose-600',   label: 'deleted',      path: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6' },
  assign_task:   { color: 'text-violet-600', label: 'assigned',     path: 'M5 12h14M12 5l7 7-7 7' },
  join_room:     { color: 'text-indigo-600', label: 'joined',       path: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3' },
  add_list:      { color: 'text-amber-600',  label: 'created list', path: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  add_reaction:  { color: 'text-pink-600',   label: 'reacted to',   path: 'M12 2a10 10 0 110 20A10 10 0 0112 2zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01' },
};

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function Avatar({ username, color, size = 32 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
      style={{ width: size, height: size, backgroundColor: color || '#6366f1' }}
      title={username}
    >
      {username?.[0]?.toUpperCase()}
    </div>
  );
}

export default function ActivityPanel({ isOpen, onClose, onlineUsers, events, currentUsername, isDarkTheme }) {
  if (!isOpen) return null;

  const heading  = isDarkTheme ? 'text-white'      : 'text-gray-900';
  const label    = isDarkTheme ? 'text-gray-300'   : 'text-gray-700';
  const body     = isDarkTheme ? 'text-gray-200'   : 'text-gray-800';
  const muted    = isDarkTheme ? 'text-gray-400'   : 'text-gray-500';
  const divider  = isDarkTheme ? 'border-gray-600' : 'border-gray-400';
  const closeBtn = isDarkTheme ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200';

  return (
    <div className={`w-72 shrink-0 border-l overflow-y-auto flex flex-col ${isDarkTheme ? 'bg-gray-900/70 border-gray-700/30' : 'bg-white/75 border-gray-300/40'} backdrop-blur-xl`}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <span className={`text-xl font-bold ${heading}`}>Room Activity</span>
        <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${closeBtn}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Online now */}
      <div className="px-5 pb-4">
        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${label}`}>Online now</p>
        {onlineUsers.length === 0 ? (
          <p className={`text-xs ${muted}`}>Just you</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u) => (
              <div key={u.username} className="flex items-center gap-1.5">
                <div className="relative">
                  <Avatar username={u.username} color={u.color} size={28} />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <span className={`text-sm font-semibold ${u.username === currentUsername ? 'opacity-60' : ''} ${body}`}>
                  {u.username === currentUsername ? 'you' : u.username}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`mx-5 border-t ${divider}`} />

      {/* Activity feed */}
      <div className="px-5 pt-4 flex-1">
        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${label}`}>Activity</p>
        {events.length === 0 ? (
          <p className={`text-xs ${muted}`}>No activity yet</p>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const meta = ACTION_META[ev.action] || { color: 'text-gray-500', label: ev.action, path: 'M12 12h.01' };
              const isAssign = ev.action === 'assign_task';
              return (
                <div key={ev.id} className="flex gap-2.5">
                  <span className={`mt-1 shrink-0 ${meta.color}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d={meta.path}/>
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm leading-snug ${body}`}>
                      <span className="font-bold">{ev.username}</span>{' '}
                      {meta.label}
                      {ev.entity_text && (
                        <> &ldquo;<span className="italic">{ev.entity_text.length > 28 ? ev.entity_text.slice(0, 28) + '…' : ev.entity_text}</span>&rdquo;</>
                      )}
                      {isAssign && ev.details?.assigned_to && (
                        <> → <span className="font-bold">{ev.details.assigned_to}</span></>
                      )}
                    </p>
                    <p className={`text-xs mt-0.5 ${muted}`}>{timeAgo(ev.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
