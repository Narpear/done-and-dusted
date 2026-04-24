'use client';

export default function StatsBar({
  stats,
  allTags,
  selectedTag,
  setSelectedTag,
  mode,
  isDarkTheme,
  isImageTheme,
}) {
  const labelColor = isDarkTheme ? 'text-gray-400' : 'text-gray-500';
  const totalColor = isDarkTheme ? 'text-white'   : 'text-gray-800';

  return (
    <div className="space-y-4 mb-8">
      <div className="glass rounded-2xl p-5 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat value={stats.total}            label="Total"     valueColor={totalColor}                                 labelColor={labelColor} />
          <Stat value={stats.active}           label="Active"    valueColor="text-sky-500 dark:text-sky-400"     extraClass="stat-color-sky"     labelColor={labelColor} />
          <Stat value={stats.completed}        label="Completed" valueColor="text-emerald-500 dark:text-emerald-400" extraClass="stat-color-emerald" labelColor={labelColor} />
          <Stat value={`${stats.completion}%`} label="Progress"  valueColor="text-violet-500 dark:text-violet-400"  extraClass="stat-color-violet"  labelColor={labelColor} />
        </div>
      </div>

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
                  : isImageTheme
                  ? 'bg-white/90 text-gray-700 hover:bg-white shadow-sm'
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

function Stat({ value, label, valueColor, labelColor, extraClass = '' }) {
  return (
    <div className="text-center">
      <div className={`stat-counter text-3xl font-bold mb-0.5 ${valueColor} ${extraClass}`}>{value}</div>
      <div className={`text-xs font-semibold ${labelColor}`}>{label}</div>
    </div>
  );
}
