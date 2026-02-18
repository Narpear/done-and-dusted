export const THEMES = {
  // ── Light themes ────────────────────────────────────────────────────────────
  'rose-gold': {
    name: 'Rose Gold',
    bg: 'bg-gradient-to-br from-rose-100 via-pink-100 to-amber-100',
    accent: '#be123c',
    swatchGradient: 'linear-gradient(135deg, #fb7185, #f472b6, #fbbf24)',
  },
  sage: {
    name: 'Sage',
    bg: 'bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100',
    accent: '#047857',
    swatchGradient: 'linear-gradient(135deg, #34d399, #2dd4bf, #22d3ee)',
  },
  lavender: {
    name: 'Lavender',
    bg: 'bg-gradient-to-br from-purple-100 via-violet-100 to-indigo-100',
    accent: '#6d28d9',
    swatchGradient: 'linear-gradient(135deg, #c084fc, #a78bfa, #818cf8)',
  },
  peach: {
    name: 'Peach',
    bg: 'bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100',
    accent: '#c2410c',
    swatchGradient: 'linear-gradient(135deg, #fb923c, #fbbf24, #facc15)',
  },
  'cotton-candy': {
    name: 'Cotton Candy',
    bg: 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100',
    accent: '#a21caf',
    swatchGradient: 'linear-gradient(135deg, #f472b6, #e879f9, #818cf8)',
  },
  slate: {
    name: 'Slate',
    bg: 'bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200',
    accent: '#334155',
    swatchGradient: 'linear-gradient(135deg, #94a3b8, #9ca3af, #a1a1aa)',
  },
  cream: {
    name: 'Cream',
    bg: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-lime-100',
    accent: '#92400e',
    swatchGradient: 'linear-gradient(135deg, #fcd34d, #fde68a, #bef264)',
  },
  // ── Dark themes ─────────────────────────────────────────────────────────────
  midnight: {
    name: 'Midnight Blue',
    bg: 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900',
    accent: '#1d4ed8',
    swatchGradient: 'linear-gradient(135deg, #0f172a, #1e3a8a, #312e81)',
    dark: true,
  },
  charcoal: {
    name: 'Charcoal',
    bg: 'bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900',
    accent: '#4338ca',
    swatchGradient: 'linear-gradient(135deg, #111827, #1e293b, #18181b)',
    dark: true,
  },
  forest: {
    name: 'Forest',
    bg: 'bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900',
    accent: '#065f46',
    swatchGradient: 'linear-gradient(135deg, #14532d, #064e3b, #134e4a)',
    dark: true,
  },
  aurora: {
    name: 'Aurora',
    bg: 'bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900',
    accent: '#0f766e',
    swatchGradient: 'linear-gradient(135deg, #0f172a, #134e4a, #064e3b)',
    dark: true,
  },
  'deep-purple': {
    name: 'Deep Purple',
    bg: 'bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900',
    accent: '#7e22ce',
    swatchGradient: 'linear-gradient(135deg, #2e1065, #581c87, #701a75)',
    dark: true,
  },
  'crimson-night': {
    name: 'Crimson Night',
    bg: 'bg-gradient-to-br from-gray-950 via-rose-950 to-red-900',
    accent: '#9f1239',
    swatchGradient: 'linear-gradient(135deg, #030712, #4c0519, #7f1d1d)',
    dark: true,
  },
};

export const FONTS = {
  // ── Sans-serif ───────────────────────────────────────────────────────────────
  inter:           { name: 'Inter',              class: 'font-inter',         family: "'Inter', sans-serif" },
  roboto:          { name: 'Roboto',             class: 'font-roboto',        family: "'Roboto', sans-serif" },
  poppins:         { name: 'Poppins',            class: 'font-poppins',       family: "'Poppins', sans-serif" },
  montserrat:      { name: 'Montserrat',         class: 'font-montserrat',    family: "'Montserrat', sans-serif" },
  'space-grotesk': { name: 'Space Grotesk',      class: 'font-space-grotesk', family: "'Space Grotesk', sans-serif" },
  syne:            { name: 'Syne',               class: 'font-syne',          family: "'Syne', sans-serif" },
  unbounded:       { name: 'Unbounded',          class: 'font-unbounded',     family: "'Unbounded', sans-serif" },
  // ── Serif ────────────────────────────────────────────────────────────────────
  playfair:        { name: 'Playfair Display',   class: 'font-playfair',      family: "'Playfair Display', serif" },
  lora:            { name: 'Lora',               class: 'font-lora',          family: "'Lora', serif" },
  crimson:         { name: 'Crimson Text',       class: 'font-crimson',       family: "'Crimson Text', serif" },
  cormorant:       { name: 'Cormorant Garamond', class: 'font-cormorant',     family: "'Cormorant Garamond', serif" },
  'dm-serif':      { name: 'DM Serif Display',   class: 'font-dm-serif',      family: "'DM Serif Display', serif" },
  fraunces:        { name: 'Fraunces',           class: 'font-fraunces',      family: "'Fraunces', serif" },
  baskerville:     { name: 'Libre Baskerville',  class: 'font-baskerville',   family: "'Libre Baskerville', serif" },
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