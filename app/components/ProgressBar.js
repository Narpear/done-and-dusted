'use client';

export default function ProgressBar({ pct, colorClass = 'bg-blue-500', className = '' }) {
  if (pct === 0) return null;

  return (
    <div className={`w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass} ${
          pct === 100 ? 'opacity-100' : 'opacity-80'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}