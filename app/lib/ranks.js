// Valorant-style daily study ranks.
// Rank icon images live in /public/ranks/<id>.svg — see `icon` below.
export const RANKS = [
  { id: 'radiant',   name: 'Radiant',   minHours: 10, color: '#fef08a', icon: '/ranks/radiant.svg' },
  { id: 'immortal',  name: 'Immortal',  minHours: 9,  color: '#dc2626', icon: '/ranks/immortal.svg' },
  { id: 'ascendant', name: 'Ascendant', minHours: 8,  color: '#10b981', icon: '/ranks/ascendant.svg' },
  { id: 'diamond',   name: 'Diamond',   minHours: 7,  color: '#c084fc', icon: '/ranks/diamond.svg' },
  { id: 'platinum',  name: 'Platinum',  minHours: 6,  color: '#22d3ee', icon: '/ranks/platinum.svg' },
  { id: 'gold',      name: 'Gold',      minHours: 5,  color: '#eab308', icon: '/ranks/gold.svg' },
  { id: 'silver',    name: 'Silver',    minHours: 4,  color: '#cbd5e1', icon: '/ranks/silver.svg' },
  { id: 'bronze',    name: 'Bronze',    minHours: 3,  color: '#c2853f', icon: '/ranks/bronze.svg' },
  { id: 'iron',      name: 'Iron',      minHours: 2,  color: '#78716c', icon: '/ranks/iron.svg' },
];

export const UNRANKED = { id: 'unranked', name: 'Unranked', minHours: 0, color: '#9ca3af', icon: '/ranks/unranked.svg' };

export function getRank(hours) {
  const h = Number(hours) || 0;
  return RANKS.find(r => h >= r.minHours) || UNRANKED;
}
