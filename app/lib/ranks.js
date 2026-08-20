// Valorant-style daily study ranks.
// Drop rank icon images in /public/ranks/<id>.png — see `icon` below.
export const RANKS = [
  { id: 'radiant',   name: 'Radiant',   minHours: 10, color: '#fef08a', icon: '/ranks/radiant.png' },
  { id: 'immortal',  name: 'Immortal',  minHours: 9,  color: '#dc2626', icon: '/ranks/immortal.png' },
  { id: 'ascendant', name: 'Ascendant', minHours: 8,  color: '#10b981', icon: '/ranks/ascendant.png' },
  { id: 'diamond',   name: 'Diamond',   minHours: 7,  color: '#c084fc', icon: '/ranks/diamond.png' },
  { id: 'platinum',  name: 'Platinum',  minHours: 6,  color: '#22d3ee', icon: '/ranks/platinum.png' },
  { id: 'gold',      name: 'Gold',      minHours: 5,  color: '#eab308', icon: '/ranks/gold.png' },
  { id: 'silver',    name: 'Silver',    minHours: 4,  color: '#cbd5e1', icon: '/ranks/silver.png' },
  { id: 'bronze',    name: 'Bronze',    minHours: 3,  color: '#c2853f', icon: '/ranks/bronze.png' },
  { id: 'iron',      name: 'Iron',      minHours: 2,  color: '#78716c', icon: '/ranks/iron.png' },
];

export const UNRANKED = { id: 'unranked', name: 'Unranked', minHours: 0, color: '#9ca3af', icon: '/ranks/unranked.png' };

export function getRank(hours) {
  const h = Number(hours) || 0;
  return RANKS.find(r => h >= r.minHours) || UNRANKED;
}
