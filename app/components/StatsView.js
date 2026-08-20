'use client';

export default function StatsView({ isDarkTheme }) {
  return (
    <div className="px-4 sm:px-10 md:px-20 lg:px-30 py-6 md:py-10">
      <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Stats</h1>
    </div>
  );
}
