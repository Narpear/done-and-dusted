'use client';

import { useState, useEffect, useRef } from 'react';
import { useStudyLog } from '../hooks/useStudyLog';
import { getRank, RANKS, UNRANKED } from '../lib/ranks';

const ASCENDING_RANKS = [...RANKS].reverse(); // iron → radiant

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextRankInfo(hours) {
  const h = Number(hours) || 0;
  for (let i = 0; i < ASCENDING_RANKS.length; i++) {
    if (h < ASCENDING_RANKS[i].minHours) {
      const prevMin = i === 0 ? 0 : ASCENDING_RANKS[i - 1].minHours;
      const span = ASCENDING_RANKS[i].minHours - prevMin;
      return {
        next: ASCENDING_RANKS[i],
        progress: Math.max(0, Math.min(100, ((h - prevMin) / span) * 100)),
        remaining: +(ASCENDING_RANKS[i].minHours - h).toFixed(2),
      };
    }
  }
  return null; // already Radiant
}

function computeStreak(logs) {
  const dates = new Set(logs.filter(l => Number(l.hours) > 0).map(l => l.date));
  if (dates.size === 0) return 0;
  const d = new Date();
  const asStr = () => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (!dates.has(asStr())) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (dates.has(asStr())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Rendered as a CSS background-image (not <img>) so a transient load hiccup can't
// permanently blank the icon via an onError handler — it just repaints on the next frame.
function RankIcon({ rank, size }) {
  return (
    <div
      role="img"
      aria-label={rank.name}
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: `${rank.color}22`,
        backgroundImage: `url(${rank.icon})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    />
  );
}

function RankBadge({ hours, size = 40 }) {
  const rank = getRank(hours);
  return (
    <div className="flex items-center gap-2">
      <RankIcon rank={rank} size={size} />
      <span className="font-bold" style={{ color: rank.color }}>{rank.name}</span>
    </div>
  );
}

function HistoryEntry({ log, textPrimary, textSecondary, onEdit }) {
  const rank = getRank(log.hours);
  return (
    <div className="glass rounded-xl shadow-md p-4 border-l-4" style={{ borderLeftColor: rank.color }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-bold ${textPrimary}`}>
          {new Date(log.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <div className="flex items-center gap-3">
          <RankBadge hours={log.hours} size={20} />
          <button
            onClick={() => onEdit(log.date)}
            className={`text-xs font-semibold underline decoration-dotted ${textSecondary}`}
          >
            Edit
          </button>
        </div>
      </div>
      <p className={`text-xs font-semibold mb-1.5 ${textSecondary}`}>{log.hours}h studied</p>
      {log.notes && (
        <ul className={`list-disc list-inside text-sm space-y-0.5 ${textSecondary}`}>
          {log.notes.split('\n').filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      )}
    </div>
  );
}

export default function StatsView({ username, isDarkTheme, isImageTheme, currentTheme }) {
  const { logs, saveLog } = useStudyLog(username);
  const [date, setDate] = useState(todayStr());
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const formRef = useRef(null);

  const subtleStyle    = isImageTheme ? { color: currentTheme?.textColor } : undefined;
  const textPrimary    = isImageTheme ? '' : isDarkTheme ? 'text-white' : 'text-gray-900';
  const textSecondary  = isImageTheme ? '' : isDarkTheme ? 'text-gray-400' : 'text-gray-500';
  const inputClass = `w-full px-3.5 py-2.5 border-2 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-0 outline-none ${
    isDarkTheme
      ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-500'
      : 'bg-white/60 border-gray-200/60 text-gray-900 placeholder:text-gray-500'
  }`;

  function loadEntryFor(newDate, fromLogs) {
    const existing = fromLogs.find(l => l.date === newDate);
    setHours(existing ? String(existing.hours) : '');
    setNotes(existing ? (existing.notes || '') : '');
    setSaved(false);
  }

  function handleDateChange(newDate) {
    setDate(newDate);
    loadEntryFor(newDate, logs);
  }

  function handleEditEntry(entryDate) {
    setDate(entryDate);
    loadEntryFor(entryDate, logs);
    setShowHistory(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Sync the form once the initial logs fetch resolves, in case today already has an entry.
  const didInitialLoad = useRef(false);
  useEffect(() => {
    if (didInitialLoad.current || logs.length === 0) return;
    didInitialLoad.current = true;
    loadEntryFor(date, logs);
  }, [logs, date]);

  async function handleSave(e) {
    e.preventDefault();
    if (!hours || Number(hours) < 0) return;
    await saveLog(date, Number(hours), notes.trim());
    setSaved(true);
  }

  const todayEntry = logs.find(l => l.date === todayStr());
  const todayHours = todayEntry?.hours || 0;
  const upcoming = nextRankInfo(todayHours);
  const todayRank = getRank(todayHours);

  const totalHours = logs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
  const daysLogged = logs.length;
  const streak = computeStreak(logs);
  const bestHours = logs.reduce((max, l) => Math.max(max, Number(l.hours) || 0), 0);
  const bestRank = daysLogged > 0 ? getRank(bestHours) : UNRANKED;

  return (
    <div className="px-4 sm:px-10 md:px-20 lg:px-30 py-6 md:py-10">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            <span className="gradient-text" style={isImageTheme ? { WebkitTextFillColor: currentTheme?.titleColor } : undefined}>
              Stats
            </span>
          </h1>
          <p className={`text-sm sm:text-base font-medium ${textSecondary}`} style={subtleStyle}>
            Log your study hours and climb the ranks.
          </p>
        </div>

        <button
          onClick={() => setShowHistory(true)}
          title="View history"
          className={`shrink-0 p-3 rounded-xl transition-all shadow-md ${
            isDarkTheme ? 'bg-white/10 text-white hover:bg-white/20' : isImageTheme ? 'bg-white/90 text-gray-800 hover:bg-white' : 'bg-white/70 text-gray-700 hover:bg-white'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
        </button>
      </div>

      <div className="max-w-3xl mt-6">
        {/* Hero — today's rank */}
        <div className="glass rounded-2xl shadow-xl p-6 mb-5 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle at 15% 20%, ${todayRank.color}, transparent 60%)` }}
          />
          <div className="relative flex items-center justify-between flex-wrap gap-5">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${todayRank.color}22`, boxShadow: `0 0 30px ${todayRank.color}44` }}
              >
                <RankIcon rank={todayRank} size={52} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Today&apos;s rank</p>
                <p className="text-2xl font-extrabold" style={{ color: todayRank.color }}>{todayRank.name}</p>
                <p className="text-xs font-medium opacity-60 mt-0.5">
                  {todayHours > 0 ? `${todayHours}h studied today` : 'Nothing logged yet today'}
                </p>
              </div>
            </div>

            {upcoming && (
              <div className="flex-1 min-w-45">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5 opacity-70">
                  <span>Next: {upcoming.next.name}</span>
                  <span>{upcoming.remaining}h to go</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${upcoming.progress}%`, background: upcoming.next.color }}
                  />
                </div>
              </div>
            )}
            {!upcoming && (
              <p className="text-sm font-bold" style={{ color: todayRank.color }}>Max rank reached 🔥</p>
            )}
          </div>
        </div>

        {/* All-time stat tiles */}
        <div className="glass rounded-2xl shadow-lg p-5 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat value={totalHours.toFixed(1)} label="Total hours" color="#3b82f6" />
            <Stat value={daysLogged} label="Days logged" color="#8b5cf6" />
            <Stat value={streak} label="Day streak" color="#f97316" />
            <Stat value={bestRank.name} label="Best rank" color={bestRank.color} small />
          </div>
        </div>

        {/* Log entry form */}
        <form ref={formRef} onSubmit={handleSave} className="glass rounded-2xl shadow-xl p-6 mb-8">
          <h2 className={`text-sm font-bold mb-4 ${textPrimary}`}>Log a study session</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className={`block text-xs font-semibold mb-1.5 ${textSecondary}`}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-xs font-semibold mb-1.5 ${textSecondary}`}>Hours studied</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>

          {hours !== '' && (
            <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl w-fit ${isDarkTheme ? 'bg-white/5' : 'bg-black/5'}`}>
              <RankBadge hours={hours} size={24} />
            </div>
          )}

          <label className={`block text-xs font-semibold mb-1.5 ${textSecondary}`}>What did you study? (one point per line)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={'e.g.\nReviewed lecture 4 slides\nSolved 10 practice problems'}
            className={`${inputClass} mb-4 resize-none`}
          />

          <button
            type="submit"
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md ${
              saved
                ? 'bg-emerald-500 text-white'
                : isDarkTheme ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {saved ? 'Saved ✓' : 'Save entry'}
          </button>
        </form>

        <p className={`text-[11px] ${textSecondary} opacity-60`} style={subtleStyle}>
          Rank names and tier structure inspired by VALORANT, a trademark of Riot Games, Inc.
          This is a personal, non-commercial project and is not affiliated with, endorsed by, or sponsored by Riot Games.
        </p>
      </div>

      {/* Slide-in history panel */}
      {showHistory && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowHistory(false)} />
          <div className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 overflow-y-auto p-6 shadow-2xl ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className={`p-1.5 rounded-lg ${isDarkTheme ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-black/5'}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {logs.length === 0 && (
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>No entries yet — log your first session.</p>
              )}
              {logs.map((log) => (
                <HistoryEntry
                  key={log.date}
                  log={log}
                  textPrimary={isDarkTheme ? 'text-white' : 'text-gray-900'}
                  textSecondary={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}
                  onEdit={handleEditEntry}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ value, label, color, small }) {
  return (
    <div className="text-center">
      <div className={`${small ? 'text-lg' : 'text-2xl'} font-extrabold mb-0.5`} style={{ color }}>{value}</div>
      <div className="text-xs font-semibold opacity-60">{label}</div>
    </div>
  );
}
