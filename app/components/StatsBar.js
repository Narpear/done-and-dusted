'use client';

import { forwardRef } from 'react';

const StatsBar = forwardRef(function StatsBar(
  { stats, allTags, selectedTag, setSelectedTag, searchQuery, setSearchQuery, mode, isDarkTheme },
  searchRef
) {
  return (
    <div className="space-y-4 mb-8">
      {/* Stats */}
      <div className="glass rounded-2xl p-5 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat value={stats.total} label="Total" isDarkTheme={isDarkTheme} />
          <Stat value={stats.active} label="Active" color="text-blue-600 dark:text-blue-400" isDarkTheme={isDarkTheme} />
          <Stat value={stats.completed} label="Completed" color="text-green-600 dark:text-green-400" isDarkTheme={isDarkTheme} />
          <Stat value={`${stats.completion}%`} label="Progress" color="text-purple-600 dark:text-purple-400" isDarkTheme={isDarkTheme} />
        </div>
      </div>

      {/* Search + tag filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks… ( / )"
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkTheme
                ? 'bg-gray-800/80 border-gray-700 text-gray-100 placeholder:text-gray-500'
                : 'bg-white/80 border-gray-200 text-gray-800 placeholder:text-gray-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tag filters (advanced mode only) */}
        {mode === 'advanced' && allTags.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedTag === t
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : isDarkTheme
                    ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    : 'bg-white/60 text-gray-700 hover:bg-gray-100/60'
                }`}
              >
                {t === 'all' ? 'All' : `#${t}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default StatsBar;

function Stat({ value, label, color = '', isDarkTheme }) {
  return (
    <div className="text-center">
      <div className={`stat-counter text-3xl font-bold mb-0.5 ${color || (isDarkTheme ? 'text-white' : 'text-gray-900')}`}>
        {value}
      </div>
      <div className={`text-xs font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>
    </div>
  );
}