'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useCalendarEvents } from '../hooks/useCalendarEvents';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const PALETTE = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#6366f1'];
function hashColor(str) {
  if (!str) return '#6b7280';
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}
function eventColor(ev, categoryColors = {}) {
  if (ev.color) return ev.color;
  if (ev.type) return categoryColors[ev.type] || hashColor(ev.type);
  return '#6b7280';
}

function pad(n) { return String(n).padStart(2, '0'); }
function toDateStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

const BLANK = { title: '', date: '', time: '', endDate: '', type: '', tags: '', notes: '', color: '' };

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}, ${y}`;
}

// ── Shared dropdown shell ───────────────────────────────────────────────────
function FilterDropdown({ label, icon, count, isDarkTheme, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`glass rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-all ${
          count > 0
            ? isDarkTheme ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-800'
            : isDarkTheme ? 'text-gray-300' : 'text-gray-600'
        }`}
      >
        {icon}
        <span className="hidden sm:inline">{count > 0 ? `${count} ${label}${count > 1 ? 's' : ''}` : label}</span>
        {count > 0 && <span className="sm:hidden text-xs font-bold">{count}</span>}
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
        </svg>
      </button>

      {open && (
        <div className={`absolute top-full left-0 mt-1 w-56 rounded-xl border shadow-2xl z-200 overflow-hidden ${
          isDarkTheme
            ? 'bg-gray-900/98 border-gray-700 backdrop-blur-xl'
            : 'bg-white/98 border-gray-200 backdrop-blur-xl'
        }`}>
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

// ── Category dropdown (with editable color per category) ───────────────────
function CategoryDropdown({ allCategories, filterTypes, onToggle, onClearAll, getCategoryColor, saveCategoryColor, isDarkTheme, muted }) {
  const [search, setSearch] = useState('');
  const visible = allCategories.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <FilterDropdown
      label="Category"
      count={filterTypes.length}
      isDarkTheme={isDarkTheme}
      icon={
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      }
    >
      {({ close }) => (
        <>
          <div className={`p-2 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
            <input
              autoFocus
              placeholder="Search categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full px-2.5 py-1.5 text-sm rounded-lg border focus:outline-none ${
                isDarkTheme
                  ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'
              }`}
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {visible.length === 0
              ? <p className={`text-sm px-3 py-2 ${muted}`}>No categories found</p>
              : visible.map(cat => {
                  const tc      = getCategoryColor(cat);
                  const checked = filterTypes.includes(cat);
                  return (
                    <div key={cat} className={`flex items-center gap-2 px-2 py-1.5 mx-1 rounded-lg transition-colors ${
                      isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-black/5'
                    }`} style={{ width: 'calc(100% - 8px)' }}>
                      <button onClick={() => onToggle(cat)} className="flex-1 flex items-center gap-2 text-left min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded shrink-0 border-2 flex items-center justify-center transition-colors"
                          style={{ borderColor: tc, backgroundColor: checked ? tc : 'transparent' }}
                        >
                          {checked && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>}
                        </span>
                        <span className="text-sm font-medium truncate" style={{ color: tc }}>{cat}</span>
                      </button>
                      <label className="relative cursor-pointer shrink-0" title={`Change color for ${cat}`}>
                        <span
                          className="w-3.5 h-3.5 rounded-full block ring-1 ring-black/10 hover:scale-110 transition-transform"
                          style={{ backgroundColor: tc }}
                        />
                        <input type="color" value={tc} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          onChange={e => saveCategoryColor(cat, e.target.value)} />
                      </label>
                    </div>
                  );
                })
            }
          </div>
          {filterTypes.length > 0 && (
            <div className={`p-2 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => { onClearAll(); close(); }}
                className="text-sm w-full text-center text-red-400 hover:text-red-300 transition-colors">
                Clear category filters
              </button>
            </div>
          )}
        </>
      )}
    </FilterDropdown>
  );
}

// ── Tags dropdown (filter only, no colors) ─────────────────────────────────
function TagsDropdown({ allTags, filterTags, onToggle, onClearAll, isDarkTheme, muted }) {
  const [search, setSearch] = useState('');
  const visible = allTags.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <FilterDropdown
      label="Tag"
      count={filterTags.length}
      isDarkTheme={isDarkTheme}
      icon={
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
          <circle cx="7" cy="7" r="1" fill="currentColor"/>
        </svg>
      }
    >
      {({ close }) => (
        <>
          <div className={`p-2 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
            <input
              autoFocus
              placeholder="Search tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full px-2.5 py-1.5 text-sm rounded-lg border focus:outline-none ${
                isDarkTheme
                  ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'
              }`}
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {visible.length === 0
              ? <p className={`text-sm px-3 py-2 ${muted}`}>No tags found</p>
              : visible.map(tag => {
                  const checked = filterTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onToggle(tag)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 mx-1 rounded-lg text-left transition-colors ${
                        isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-black/5'
                      }`}
                      style={{ width: 'calc(100% - 8px)' }}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded shrink-0 border-2 flex items-center justify-center transition-colors ${
                          isDarkTheme ? 'border-gray-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: checked ? (isDarkTheme ? '#9ca3af' : '#6b7280') : 'transparent' }}
                      >
                        {checked && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>}
                      </span>
                      <span className={`text-sm font-medium truncate ${muted}`}>#{tag}</span>
                    </button>
                  );
                })
            }
          </div>
          {filterTags.length > 0 && (
            <div className={`p-2 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => { onClearAll(); close(); }}
                className="text-sm w-full text-center text-red-400 hover:text-red-300 transition-colors">
                Clear tag filters
              </button>
            </div>
          )}
        </>
      )}
    </FilterDropdown>
  );
}

function badgeRefCb(node) {
  if (node) gsap.fromTo(node, { y: -3, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'back.out(2)', clearProps: 'all' });
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CalendarView({ username, isDarkTheme, isImageTheme, currentTheme, isSidebarOpen }) {
  const { events, addEvent, updateEvent, deleteEvent, toggleComplete } = useCalendarEvents(username);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const now      = new Date();
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const [year,           setYear]           = useState(now.getFullYear());
  const [month,          setMonth]          = useState(now.getMonth());
  const gridRef = useRef(null);
  const [selectedDay,    setSelectedDay]    = useState(null);
  const [filterTypes,    setFilterTypes]    = useState([]);
  const [filterTags,     setFilterTags]     = useState([]);
  const [showPanel,      setShowPanel]      = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [editId,         setEditId]         = useState(null);
  const [form,           setForm]           = useState(BLANK);
  const [categoryColors, setCategoryColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`categoryColors_${username}`) || '{}'); } catch { return {}; }
  });
  const [animateVersion, setAnimateVersion]   = useState(0);
  const sidePanelEventsRef                    = useRef(null);
  const touchStartX                           = useRef(null);
  const touchStartY                           = useRef(null);

  function getCategoryColor(cat) { return categoryColors[cat] || hashColor(cat); }
  function saveCategoryColor(cat, color) {
    const next = { ...categoryColors, [cat]: color };
    setCategoryColors(next);
    try { localStorage.setItem(`categoryColors_${username}`, JSON.stringify(next)); } catch {}
  }

  const allCategories = [...new Set(events.map(e => e.type).filter(Boolean))].sort();
  const allTags       = [...new Set(events.flatMap(e => e.tags || []))].sort();

  function filtered(arr) {
    return arr.filter(e => {
      if (filterTypes.length > 0 && !filterTypes.includes(e.type)) return false;
      if (filterTags.length  > 0 && !filterTags.every(t => (e.tags || []).includes(t))) return false;
      return true;
    });
  }

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells        = Array(firstWeekday).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const totalCells   = Math.ceil(cells.length / 7) * 7;
  const paddedCells  = [...cells, ...Array(totalCells - cells.length).fill(null)];
  const numRows      = totalCells / 7;

  function eventsForDay(day) {
    const ds = toDateStr(year, month, day);
    return filtered(events.filter(e => {
      if (e.date === ds) return true;
      if (e.endDate && e.endDate > e.date && ds > e.date && ds <= e.endDate) return true;
      return false;
    }));
  }

  function slideGrid(direction, changeFn) {
    if (!gridRef.current) { changeFn(); return; }
    const xOut = direction === 'next' ? -60 : 60;
    const xIn  = direction === 'next' ?  60 : -60;
    gsap.to(gridRef.current, {
      x: xOut, opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        changeFn();
        setAnimateVersion(v => v + 1);
        gsap.fromTo(gridRef.current,
          { x: xIn, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.22, ease: 'power2.out', clearProps: 'x,opacity' }
        );
      },
    });
  }

  // ── Stable callback refs for enter animations ─────────────────────────────
  const panelCallbackRef = useCallback((node) => {
    if (!node) return;
    if (isMobile) {
      gsap.fromTo(node, { y: 320, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: 'power3.out', clearProps: 'all' });
    } else {
      gsap.fromTo(node, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.22, ease: 'power2.out', clearProps: 'x,opacity' });
    }
  }, [isMobile]);

  const modalCallbackRef = useCallback((node) => {
    if (node) gsap.fromTo(node, { scale: 0.95, y: -10, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.2, ease: 'power2.out', clearProps: 'all' });
  }, []);

  // ── Cell stagger on initial mount ─────────────────────────────────────────
  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const cells = gridRef.current.querySelectorAll('[data-cell]');
    gsap.fromTo(cells, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2, stagger: 0.005, ease: 'power2.out', clearProps: 'all' });
  }, []);

  // ── Cell stagger after each month slide ───────────────────────────────────
  useLayoutEffect(() => {
    if (animateVersion === 0 || !gridRef.current) return;
    const cells = gridRef.current.querySelectorAll('[data-cell]');
    gsap.fromTo(cells, { y: 8 }, { y: 0, duration: 0.15, stagger: 0.005, ease: 'power2.out', clearProps: 'all', delay: 0.18 });
  }, [animateVersion]);

  // ── Event card stagger when selected day changes ───────────────────────────
  useEffect(() => {
    if (!sidePanelEventsRef.current) return;
    const cards = Array.from(sidePanelEventsRef.current.children);
    if (!cards.length) return;
    gsap.fromTo(cards, { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.15, stagger: 0.06, ease: 'power2.out', clearProps: 'all' });
  }, [selectedDay]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current || 0));
    if (Math.abs(dx) > 50 && dy < 40) {
      if (dx < 0) nextMonth();
      else prevMonth();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  function prevMonth() {
    slideGrid('prev', () => {
      if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
    });
  }
  function nextMonth() {
    slideGrid('next', () => {
      if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
    });
  }

  function openNew(day) {
    setEditId(null);
    setForm({ ...BLANK, date: day ? toDateStr(year, month, day) : todayStr });
    setShowForm(true);
  }
  function openEdit(ev) {
    setEditId(ev.id);
    setForm({
      title:   ev.title,
      date:    ev.date,
      time:    ev.time    || '',
      endDate: ev.endDate || '',
      type:    ev.type    || '',
      tags:    (ev.tags   || []).join(', '),
      notes:   ev.notes   || '',
      color:   ev.color   || '',
    });
    setShowForm(true);
  }
  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      tags:    form.tags.split(',').map(t => t.trim()).filter(Boolean),
      time:    form.time    || null,
      endDate: form.endDate || null,
      color:   form.color   || null,
    };
    if (editId) updateEvent(editId, payload);
    else        addEvent(payload);
    setShowForm(false);
    setEditId(null);
  }

  function toggleTypeFilter(t) { setFilterTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]); }
  function toggleTagFilter(t)  { setFilterTags(p  => p.includes(t) ? p.filter(x => x !== t) : [...p, t]); }

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const border      = isDarkTheme ? 'border-gray-700/50' : 'border-white/30';
  const text        = isDarkTheme ? 'text-white'    : 'text-gray-800';
  const muted       = isDarkTheme ? 'text-gray-300' : 'text-gray-600';
  const cellBg      = isDarkTheme ? 'bg-gray-800/78 hover:bg-gray-700/88' : 'bg-white/82 hover:bg-white/92';
  const glassBg     = isDarkTheme ? 'bg-gray-900/70 backdrop-blur-xl border-gray-700/40' : 'bg-white/55 backdrop-blur-xl border-white/30';
  const sidePanelBg = isDarkTheme ? 'bg-gray-900/80 backdrop-blur-xl' : 'bg-white/68 backdrop-blur-xl';
  const dayHeaderBg = isDarkTheme ? 'bg-gray-900/65 backdrop-blur-md'  : 'bg-white/55 backdrop-blur-md';
  const inputCls    = `w-full px-3 py-2 text-base rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/10 ${
    isDarkTheme ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-500' : 'bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400'
  }`;
  const labelCls = `text-sm font-semibold mb-1 block ${muted}`;
  const modalBg  = isDarkTheme ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200';
  const pillBase = 'truncate text-white text-xs font-semibold px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity';

  // Color in the form: custom override > auto from category
  const formEffectiveColor = form.color || (form.type ? getCategoryColor(form.type) : '#6b7280');

  const selectedDateStr = selectedDay ? toDateStr(year, month, selectedDay) : null;
  const selectedEvents  = selectedDateStr ? filtered(events.filter(e => e.date === selectedDateStr)) : [];
  const soon = filtered(
    events
      .filter(e => e.date >= todayStr && !e.completed)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 15)
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Top bar — z-20 so dropdowns sit above calendar body ── */}
      <div className={`shrink-0 border-b ${border} ${glassBg} z-20`}>
        {isMobile ? (
          /* Mobile: two-row layout so nav arrows are never covered */
          <>
            <div className="flex items-center justify-between px-5 pt-2.5 pb-1.5">
              <button onClick={prevMonth}
                className={`p-1.5 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-white/50 text-gray-600'}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span className={`text-base font-bold select-none ${text}`}>{MONTHS[month]} {year}</span>
              <button onClick={nextMonth}
                className={`p-1.5 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-white/50 text-gray-600'}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 pb-2">
              {allCategories.length > 0 && (
                <CategoryDropdown allCategories={allCategories} filterTypes={filterTypes} onToggle={toggleTypeFilter}
                  onClearAll={() => setFilterTypes([])} getCategoryColor={getCategoryColor}
                  saveCategoryColor={saveCategoryColor} isDarkTheme={isDarkTheme} muted={muted} />
              )}
              {allTags.length > 0 && (
                <TagsDropdown allTags={allTags} filterTags={filterTags} onToggle={toggleTagFilter}
                  onClearAll={() => setFilterTags([])} isDarkTheme={isDarkTheme} muted={muted} />
              )}
              <button onClick={() => setShowPanel(p => !p)}
                className={`glass rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-all ${
                  showPanel ? isDarkTheme ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-800'
                           : isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                }`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          /* Desktop: single row with absolute-centered nav */
          <div className="px-5 py-2.5 relative flex items-center">
            <div className={`flex-1 ${!isSidebarOpen ? 'pl-8' : ''}`} />
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button onClick={prevMonth}
                className={`p-1.5 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-white/50 text-gray-600'}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span className={`text-base font-bold w-36 text-center select-none ${text}`}>{MONTHS[month]} {year}</span>
              <button onClick={nextMonth}
                className={`p-1.5 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-white/50 text-gray-600'}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-end gap-2">
              {allCategories.length > 0 && (
                <CategoryDropdown allCategories={allCategories} filterTypes={filterTypes} onToggle={toggleTypeFilter}
                  onClearAll={() => setFilterTypes([])} getCategoryColor={getCategoryColor}
                  saveCategoryColor={saveCategoryColor} isDarkTheme={isDarkTheme} muted={muted} />
              )}
              {allTags.length > 0 && (
                <TagsDropdown allTags={allTags} filterTags={filterTags} onToggle={toggleTagFilter}
                  onClearAll={() => setFilterTags([])} isDarkTheme={isDarkTheme} muted={muted} />
              )}
              <button onClick={() => setShowPanel(p => !p)}
                className={`glass rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-all ${
                  showPanel ? isDarkTheme ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-800'
                           : isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                }`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span className="hidden sm:inline">Upcoming</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Calendar grid */}
        <div className={`${isMobile ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-hidden'} flex flex-col p-2 gap-1`}>
          <div className={`grid grid-cols-7 rounded-xl overflow-hidden ${dayHeaderBg}`}>
            {DAYS.map(d => (
              <div key={d} className={`py-1.5 text-center text-xs font-bold uppercase tracking-widest ${muted}`}>{d}</div>
            ))}
          </div>

          <div
            ref={gridRef}
            className={`${isMobile ? '' : 'flex-1'} grid grid-cols-7 gap-1`}
            style={{ gridTemplateRows: `repeat(${numRows}, ${isMobile ? '68px' : '1fr'})` }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {paddedCells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="rounded-xl" />;
              const ds      = toDateStr(year, month, day);
              const dayEvs  = eventsForDay(day);
              const isToday    = ds === todayStr;
              const isSelected = selectedDay === day;
              return (
                <div
                  key={`${day}-${idx}`}
                  data-cell
                  onClick={e => {
                    gsap.fromTo(e.currentTarget, { scale: 0.97 }, { scale: 1, duration: 0.22, ease: 'back.out(2)', clearProps: 'scale' });
                    const newDay = day === selectedDay ? null : day;
                    setSelectedDay(newDay);
                    if (isMobile && newDay !== null) setShowPanel(true);
                  }}
                  onDoubleClick={() => !isMobile && openNew(day)}
                  className={`rounded-xl p-1 cursor-pointer border transition-all flex flex-col overflow-hidden ${
                    isSelected
                      ? isDarkTheme ? 'border-white/50 bg-white/25' : 'border-black/25 bg-white/88'
                      : isToday
                      ? isDarkTheme ? 'bg-white/20 border-white/35' : 'bg-white/88 border-black/18'
                      : `${cellBg} border-transparent`
                  }`}
                >
                  {isMobile ? (
                    /* Mobile: day number + event count badge */
                    <>
                      <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mx-auto mt-0.5 ${
                        isToday ? isDarkTheme ? 'bg-white/25 text-white' : 'bg-black/20 text-white' : muted
                      }`}>{day}</span>
                      {dayEvs.length > 0 && (
                        <div className="flex-1 flex items-center justify-center mt-1">
                          <span
                            ref={dayEvs.length > 0 ? badgeRefCb : undefined}
                            className="text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none"
                            style={{ backgroundColor: eventColor(dayEvs[0], categoryColors) }}
                          >
                            {dayEvs.length}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Desktop: day number + event pills */
                    <>
                      <div className="flex items-center justify-between shrink-0">
                        <span className={`text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full ${
                          isToday ? isDarkTheme ? 'bg-white/25 text-white' : 'bg-black/20 text-white' : muted
                        }`}>
                          {day}
                        </span>
                        {dayEvs.length > 2 && (
                          <span ref={badgeRefCb} className={`text-xs font-semibold ${muted}`}>+{dayEvs.length - 2}</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                        {dayEvs.slice(0, 2).map(ev => (
                          <div
                            key={ev.id}
                            className={`text-white text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-1.5 transition-opacity ${ev.completed ? 'opacity-50' : ''}`}
                            style={{ backgroundColor: eventColor(ev, categoryColors) }}
                          >
                            <button
                              onClick={e => { e.stopPropagation(); toggleComplete(ev.id); }}
                              className="shrink-0 rounded-full border border-white/60 flex items-center justify-center hover:scale-125 transition-transform"
                              style={{ width: 8, height: 8, minWidth: 8, backgroundColor: ev.completed ? 'rgba(255,255,255,0.85)' : 'transparent' }}
                            >
                              {ev.completed && (
                                <svg width="4" height="4" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="4">
                                  <path d="M5 13l4 4L19 7"/>
                                </svg>
                              )}
                            </button>
                            <div
                              onClick={e => { e.stopPropagation(); openEdit(ev); }}
                              className={`truncate flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0 ${ev.completed ? 'line-through' : ''}`}
                            >
                              {ev.time && <span className="shrink-0 opacity-80">{ev.time.slice(0, 5)}</span>}
                              <span className="truncate">{ev.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel — right rail on desktop, bottom sheet on mobile */}
        {showPanel && (
          <>
            {isMobile && (
              <div
                className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowPanel(false)}
              />
            )}
            <div
              ref={panelCallbackRef}
              className={
                isMobile
                  ? `fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl overflow-hidden max-h-[72vh] border-t ${border} ${sidePanelBg}`
                  : `w-56 shrink-0 border-l ${border} ${sidePanelBg} flex flex-col overflow-hidden`
              }
            >
              {/* Mobile drag handle */}
              {isMobile && (
                <div className="flex flex-col items-center pt-3 pb-1 shrink-0">
                  <div className={`w-10 h-1 rounded-full mb-2 ${isDarkTheme ? 'bg-gray-600' : 'bg-gray-300'}`} />
                  <div className={`w-full flex items-center justify-between px-4 pb-2 border-b ${border}`}>
                    <span className={`text-sm font-bold ${text}`}>
                      {selectedDay ? `${MONTHS[month].slice(0, 3)} ${selectedDay}` : 'Upcoming'}
                    </span>
                    <button onClick={() => setShowPanel(false)} className={`${muted} hover:opacity-60 transition-opacity`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              )}

              {selectedDay ? (
                <div className={`shrink-0 p-3 ${isMobile ? '' : `border-b ${border}`}`}>
                  {!isMobile && (
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-bold ${text}`}>{MONTHS[month].slice(0, 3)} {selectedDay}</h3>
                      <button onClick={() => openNew(selectedDay)} className={`${muted} hover:opacity-60 transition-opacity`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                    </div>
                  )}
                  {isMobile && (
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>Events this day</span>
                      <button onClick={() => openNew(selectedDay)} className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${isDarkTheme ? 'bg-white/10 text-white' : 'bg-black/8 text-gray-700'}`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                        Add
                      </button>
                    </div>
                  )}
                  {selectedEvents.length === 0
                    ? <p className={`text-sm ${muted}`}>No events. Click + to add.</p>
                    : <div ref={sidePanelEventsRef} className="space-y-1.5">
                        {selectedEvents.map(ev => (
                          <EventCard key={ev.id} ev={ev} isDarkTheme={isDarkTheme} muted={muted} text={text}
                            onEdit={openEdit} onDelete={deleteEvent} onToggle={toggleComplete}
                            getCategoryColor={getCategoryColor} />
                        ))}
                      </div>
                  }
                </div>
              ) : (
                !isMobile && (
                  <div className={`shrink-0 p-3 border-b ${border}`}>
                    <p className={`text-sm ${muted}`}>Click a day to see events.</p>
                  </div>
                )
              )}
              <div className="flex-1 overflow-y-auto p-3">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${muted} mb-2`}>Upcoming</h3>
                {soon.length === 0
                  ? <p className={`text-sm ${muted}`}>Nothing coming up.</p>
                  : <div className="space-y-1.5">
                      {soon.map(ev => (
                        <EventCard key={ev.id} ev={ev} isDarkTheme={isDarkTheme} muted={muted} text={text}
                          onEdit={openEdit} onDelete={deleteEvent} onToggle={toggleComplete} showDate
                          getCategoryColor={getCategoryColor} />
                      ))}
                    </div>
                }
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit modal ──────────────────────────────────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setShowForm(false); setEditId(null); }}
        >
          <div
            ref={modalCallbackRef}
            className={`border shadow-2xl p-6 w-full ${modalBg} ${isMobile ? 'rounded-t-2xl fixed bottom-0 inset-x-0 max-h-[90vh] overflow-y-auto' : 'rounded-2xl max-w-md'}`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`text-base font-bold mb-4 ${text}`}>{editId ? 'Edit event' : 'New event'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required autoFocus placeholder="Title" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date *</label>
                  <input type="date" required value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Time</label>
                  <input type="time" value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <input placeholder="e.g. Quiz, Project, Exam…" value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End date</label>
                  <input type="date" value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tags (comma-separated)</label>
                <input placeholder="e.g. Course, Career Fair, General…" value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex items-center gap-2.5">
                  <label className="relative cursor-pointer shrink-0" title="Pick event color">
                    <span className="w-7 h-7 rounded-full block ring-2 ring-white/20 hover:scale-110 transition-transform shadow"
                      style={{ backgroundColor: formEffectiveColor }} />
                    <input type="color" value={formEffectiveColor}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
                  </label>
                  <span className={`text-sm flex-1 ${muted}`}>
                    {form.color
                      ? 'Custom color'
                      : form.type
                      ? `Auto from category "${form.type}"`
                      : 'Pick a category to auto-assign'}
                  </span>
                  {form.color && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, color: '' }))}
                      className={`text-xs font-medium ${muted} hover:text-red-400 transition-colors`}>
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} placeholder="Optional notes…" value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit"
                  className={`flex-1 py-2 text-base font-semibold rounded-lg transition-colors ${isDarkTheme ? 'bg-white/15 text-white hover:bg-white/22' : 'bg-black/8 text-gray-800 hover:bg-black/12'}`}>
                  {editId ? 'Save' : 'Add event'}
                </button>
                {editId && (
                  <button type="button"
                    onClick={() => { deleteEvent(editId); setShowForm(false); setEditId(null); }}
                    className="px-3 py-2 text-sm font-semibold text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg transition-colors">
                    Delete
                  </button>
                )}
                <button type="button"
                  onClick={() => { setShowForm(false); setEditId(null); }}
                  className={`px-4 py-2 text-base font-semibold rounded-lg border transition-colors ${isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:bg-black/5'}`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ ev, isDarkTheme, muted, text, onEdit, onDelete, onToggle, showDate, getCategoryColor }) {
  const color = ev.color || (ev.type && getCategoryColor ? getCategoryColor(ev.type) : null) || hashColor(ev.type);
  return (
    <div data-event-card className={`flex items-start gap-1.5 group ${ev.completed ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(ev.id)}
        className="mt-0.5 shrink-0 w-3 h-3 rounded-full border-2 transition-colors flex items-center justify-center"
        style={{ borderColor: color, backgroundColor: ev.completed ? color : 'transparent' }}
      >
        {ev.completed && (
          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className={`text-base font-semibold leading-tight truncate ${ev.completed ? 'line-through' : text}`}>{ev.title}</p>
          <div className="event-card-actions flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(ev)} className={`p-0.5 ${muted} hover:opacity-60 transition-opacity`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => onDelete(ev.id)} className={`p-0.5 ${muted} hover:text-red-400 transition-colors`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {showDate && <span className={`text-xs ${muted}`}>{formatDate(ev.date)}</span>}
          {ev.time   && <span className={`text-xs font-mono ${muted}`}>{ev.time.slice(0, 5)}</span>}
          {ev.type   && <span className="text-xs font-semibold" style={{ color }}>{ev.type}</span>}
          {(ev.tags || []).map(tag => (
            <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              isDarkTheme ? 'bg-white/10 text-gray-400' : 'bg-black/8 text-gray-500'
            }`}>
              #{tag}
            </span>
          ))}
        </div>
        {ev.notes && <p className={`text-xs mt-0.5 ${muted} truncate`}>{ev.notes}</p>}
      </div>
    </div>
  );
}
