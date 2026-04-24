export const THEMES = {
  // ── Light themes ────────────────────────────────────────────────────────────
  'rose-gold': {
    name: 'Rose Gold',
    bg: 'bg-linear-to-br from-rose-200 via-pink-200 to-amber-200',
    accent: '#be123c',
    swatchGradient: 'linear-gradient(135deg, #fb7185, #f472b6, #fbbf24)',
  },
  sage: {
    name: 'Sage',
    bg: 'bg-linear-to-br from-emerald-200 via-teal-200 to-cyan-200',
    accent: '#047857',
    swatchGradient: 'linear-gradient(135deg, #34d399, #2dd4bf, #22d3ee)',
  },
  lavender: {
    name: 'Lavender',
    bg: 'bg-linear-to-br from-purple-200 via-violet-200 to-indigo-200',
    accent: '#6d28d9',
    swatchGradient: 'linear-gradient(135deg, #c084fc, #a78bfa, #818cf8)',
  },
  peach: {
    name: 'Peach',
    bg: 'bg-linear-to-br from-orange-200 via-amber-200 to-yellow-200',
    accent: '#c2410c',
    swatchGradient: 'linear-gradient(135deg, #fb923c, #fbbf24, #facc15)',
  },
  'cotton-candy': {
    name: 'Cotton Candy',
    bg: 'bg-linear-to-br from-pink-200 via-purple-200 to-blue-200',
    accent: '#a21caf',
    swatchGradient: 'linear-gradient(135deg, #f472b6, #e879f9, #818cf8)',
  },
  slate: {
    name: 'Slate',
    bg: 'bg-linear-to-br from-slate-300 via-gray-200 to-zinc-300',
    accent: '#334155',
    swatchGradient: 'linear-gradient(135deg, #94a3b8, #9ca3af, #a1a1aa)',
  },
  cream: {
    name: 'Cream',
    bg: 'bg-linear-to-br from-amber-200 via-yellow-200 to-lime-200',
    accent: '#92400e',
    swatchGradient: 'linear-gradient(135deg, #fcd34d, #fde68a, #bef264)',
  },
  // ── Dark themes ─────────────────────────────────────────────────────────────
  midnight: {
    name: 'Midnight Blue',
    bg: 'bg-linear-to-br from-slate-950 via-blue-850 to-indigo-950',
    accent: '#1d4ed8',
    swatchGradient: 'linear-gradient(135deg, #0f172a, #1e3a8a, #312e81)',
    dark: true,
  },
  charcoal: {
    name: 'Charcoal',
    bg: 'bg-linear-to-br from-gray-950 via-slate-800 to-zinc-950',
    accent: '#4338ca',
    swatchGradient: 'linear-gradient(135deg, #111827, #1e293b, #18181b)',
    dark: true,
  },
  forest: {
    name: 'Forest',
    bg: 'bg-linear-to-br from-green-950 via-emerald-800 to-teal-950',
    accent: '#065f46',
    swatchGradient: 'linear-gradient(135deg, #14532d, #064e3b, #134e4a)',
    dark: true,
  },
  aurora: {
    name: 'Aurora',
    bg: 'bg-linear-to-br from-slate-950 via-teal-800 to-emerald-950',
    accent: '#0f766e',
    swatchGradient: 'linear-gradient(135deg, #0f172a, #134e4a, #064e3b)',
    dark: true,
  },
  'deep-purple': {
    name: 'Deep Purple',
    bg: 'bg-linear-to-br from-violet-950 via-purple-800 to-fuchsia-950',
    accent: '#7e22ce',
    swatchGradient: 'linear-gradient(135deg, #2e1065, #581c87, #701a75)',
    dark: true,
  },
  'crimson-night': {
    name: 'Crimson Night',
    bg: 'bg-linear-to-br from-gray-950 via-rose-900 to-red-950',
    accent: '#9f1239',
    swatchGradient: 'linear-gradient(135deg, #030712, #4c0519, #7f1d1d)',
    dark: true,
  },
  // ── Image themes ────────────────────────────────────────────────────────────
  'beach-sunset': {
    name: 'Beach Sunset',
    bg: '',
    bgImage: '/themes/beach sunset.jpg',
    accent: '#c2410c',
    swatchGradient: 'url(/themes/beach%20sunset.jpg) center/cover',
    dark: false,
  },
  'city-house': {
    name: 'City Lights',
    bg: '',
    bgImage: '/themes/city lights.jpg',
    accent: '#334155',
    swatchGradient: 'url(/themes/city%20lights.jpg) center/cover',
    dark: false,
  },
};

export const FONTS = {
  inter:    { name: 'Inter',            class: 'font-inter',    family: "'Inter', sans-serif" },
  playfair: { name: 'Playfair Display', class: 'font-playfair', family: "'Playfair Display', serif" },
  times:    { name: 'Times New Roman',  class: 'font-times',    family: "'Times New Roman', Times, serif" },
};

export const PRIORITY_STYLES = {
  low: {
    border: 'border-l-blue-500',
    bg: 'bg-gradient-to-r from-blue-50/60 to-transparent dark:from-blue-950/30',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
  },
  medium: {
    border: 'border-l-amber-500',
    bg: 'bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/30',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
  high: {
    border: 'border-l-rose-500',
    bg: 'bg-gradient-to-r from-rose-50/60 to-transparent dark:from-rose-950/30',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
  },
};

export const KEYBOARD_SHORTCUTS = [
  { keys: ['N'], description: 'Focus new task input' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['Esc'], description: 'Clear search / close modals' },
  { keys: ['?'], description: 'Toggle shortcut help' },
];