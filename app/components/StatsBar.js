'use client';

export default function StatsBar({
  stats,
  allTags,
  selectedTag,
  setSelectedTag,
  mode,
  isDarkTheme,
}) {
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

      {/* Tag filters — advanced mode only */}
      {mode === 'advanced' && allTags.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedTag === t
                  ? 'bg-gray-700 text-white shadow-md'
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
  );
}

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
