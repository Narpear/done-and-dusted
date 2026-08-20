'use client';

import { useState, useEffect, useRef } from 'react';
import { useStudyLog } from '../hooks/useStudyLog';
import { getRank } from '../lib/ranks';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function RankBadge({ hours, size = 40 }) {
  const rank = getRank(hours);
  return (
    <div className="flex items-center gap-2">
      <img
        src={rank.icon}
        alt={rank.name}
        width={size}
        height={size}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <span className="font-bold" style={{ color: rank.color }}>{rank.name}</span>
    </div>
  );
}

export default function StatsView({ username, isDarkTheme, isImageTheme, currentTheme }) {
  const { logs, saveLog } = useStudyLog(username);
  const [date, setDate] = useState(todayStr());
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const textPrimary   = isDarkTheme ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkTheme ? 'text-gray-300' : 'text-gray-700';
  const cardBg = isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/10';

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

  return (
    <div className="px-4 sm:px-10 md:px-20 lg:px-30 py-6 md:py-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">
        <span className="gradient-text" style={isImageTheme ? { WebkitTextFillColor: currentTheme?.titleColor } : undefined}>
          Stats
        </span>
      </h1>
      <p className={`text-sm mb-6 ${textSecondary}`}>Log your study hours and climb the ranks.</p>

      {/* Today's rank */}
      <div className={`rounded-2xl border p-5 mb-6 ${cardBg}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${textSecondary}`}>Today&apos;s rank</p>
        <RankBadge hours={todayEntry?.hours || 0} size={48} />
      </div>

      {/* Log entry form */}
      <form onSubmit={handleSave} className={`rounded-2xl border p-5 mb-8 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className={`block text-xs font-semibold mb-1 ${textSecondary}`}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkTheme ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div className="flex-1">
            <label className={`block text-xs font-semibold mb-1 ${textSecondary}`}>Hours studied</label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0"
              className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkTheme ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {hours && (
          <div className="mb-4">
            <RankBadge hours={hours} size={28} />
          </div>
        )}

        <label className={`block text-xs font-semibold mb-1 ${textSecondary}`}>What did you study? (one point per line)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder={'e.g.\nReviewed lecture 4 slides\nSolved 10 practice problems'}
          className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 ${
            isDarkTheme ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
          }`}
        />

        <button
          type="submit"
          className={`px-4 py-2 text-sm font-semibold rounded-lg ${
            isDarkTheme ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/8 text-gray-800 hover:bg-black/15'
          }`}
        >
          {saved ? 'Saved ✓' : 'Save entry'}
        </button>
      </form>

      {/* History */}
      <h2 className={`text-lg font-bold mb-3 ${textPrimary}`}>History</h2>
      <div className="space-y-3">
        {logs.length === 0 && <p className={`text-sm ${textSecondary}`}>No entries yet.</p>}
        {logs.map((log) => (
          <div key={log.date} className={`rounded-xl border p-4 ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-semibold ${textPrimary}`}>{log.date}</span>
              <RankBadge hours={log.hours} size={20} />
            </div>
            <p className={`text-xs mb-1 ${textSecondary}`}>{log.hours}h studied</p>
            {log.notes && (
              <ul className={`list-disc list-inside text-sm ${textSecondary}`}>
                {log.notes.split('\n').filter(Boolean).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <p className={`text-[11px] mt-10 ${textSecondary} opacity-60`}>
        Rank names and tier structure inspired by VALORANT, a trademark of Riot Games, Inc.
        This is a personal, non-commercial project and is not affiliated with, endorsed by, or sponsored by Riot Games.
      </p>
    </div>
  );
}
