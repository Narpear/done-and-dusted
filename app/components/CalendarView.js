'use client';

import { useState, useRef } from 'react';
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
function eventColor(ev) { return ev.color || hashColor(ev.type); }

function pad(n) { return String(n).padStart(2, '0'); }
function toDateStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

const BLANK = { title: '', date: '', time: '', endDate: '', type: '', tags: '', notes: '', color: '' };

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(m) - 1]}, ${y}`;
}

export default function CalendarView({ username, isDarkTheme, isImageTheme, currentTheme, isSidebarOpen }) {
  const { events, addEvent, updateEvent, deleteEvent, toggleComplete } = useCalendarEvents(username);

  const now      = new Date();
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const [year,        setYear]        = useState(now.getFullYear());
  const [month,       setMonth]       = useState(now.getMonth());
  const gridRef = useRef(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterTags,  setFilterTags]  = useState([]);
  const [showPanel,   setShowPanel]   = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(BLANK);

  const allCategories = [...new Set(events.map(e => e.type).filter(Boolean))].sort();
  const allTags       = [...new Set(events.flatMap(e => e.tags || []))].sort();
  const hasFilters    = filterTypes.length > 0 || filterTags.length > 0;

  function filtered(arr) {
    return arr.filter(e => {
      if (filterTypes.length > 0 && !filterTypes.includes(e.type)) return false;
      if (filterTags.length  > 0 && !filterTags.every(t => (e.tags || []).includes(t))) return false;
      return true;
    });
  }

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells = Array(firstWeekday).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  // pad to full rows so grid rows are even
  const totalCells = Math.ceil(cells.length / 7) * 7;
  const paddedCells = [...cells, ...Array(totalCells - cells.length).fill(null)];
  const numRows = totalCells / 7;

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
        gsap.fromTo(gridRef.current,
          { x: xIn, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.22, ease: 'power2.out', clearProps: 'x,opacity' }
        );
      },
    });
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
  function goToday() {
    slideGrid('next', () => {
      setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(now.getDate());
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

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const border      = isDarkTheme ? 'border-gray-700/50' : 'border-white/30';
  const text        = isDarkTheme ? 'text-white'     : 'text-gray-800';
  const muted       = isDarkTheme ? 'text-gray-300'  : 'text-gray-600';
  const cellBg      = isDarkTheme
    ? 'bg-gray-800/60 hover:bg-gray-700/70'
    : 'bg-white/62 hover:bg-white/75';
  const glassBg     = isDarkTheme
    ? 'bg-gray-900/50 backdrop-blur-xl border-gray-700/40'
    : 'bg-white/25 backdrop-blur-xl border-white/30';
  const sidePanelBg = isDarkTheme
    ? 'bg-gray-900/60 backdrop-blur-xl'
    : 'bg-white/40 backdrop-blur-xl';
  const dayHeaderBg = isDarkTheme
    ? 'bg-gray-900/50 backdrop-blur-md'
    : 'bg-white/30 backdrop-blur-md';
  const inputCls    = `w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/10 ${
    isDarkTheme
      ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-500'
      : 'bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400'
  }`;
  const labelCls    = `text-xs font-semibold mb-1 block ${muted}`;
  const modalBg     = isDarkTheme ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200';
  const pillBase    = 'truncate text-white text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity';

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

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className={`shrink-0 px-5 py-2.5 border-b ${border} ${glassBg} relative flex items-center`}>

        {/* Left — filters (offset right to clear the sidebar toggle arrow) */}
        <div className={`flex-1 flex items-center gap-1.5 min-w-0 flex-wrap ${!isSidebarOpen ? 'pl-8' : ''}`}>
          {(allCategories.length > 0 || allTags.length > 0) && (
            <>
              {allCategories.map(cat => (
                <button key={cat} onClick={() => toggleTypeFilter(cat)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg border transition-all ${
                    filterTypes.includes(cat)
                      ? 'text-white border-transparent'
                      : isDarkTheme ? 'border-gray-600 text-gray-400 hover:bg-white/10' : 'border-gray-300/60 text-gray-600 hover:bg-white/40'
                  }`}
                  style={{ borderColor: filterTypes.includes(cat) ? 'transparent' : hashColor(cat), backgroundColor: filterTypes.includes(cat) ? hashColor(cat) : undefined, color: filterTypes.includes(cat) ? 'white' : hashColor(cat) }}
                >{cat}</button>
              ))}
              {allTags.map(tag => (
                <button key={tag} onClick={() => toggleTagFilter(tag)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border transition-all ${
                    filterTags.includes(tag)
                      ? isDarkTheme ? 'bg-white/20 border-white/30 text-white' : 'bg-black/12 border-black/20 text-gray-800'
                      : isDarkTheme ? 'border-gray-600 text-gray-400 hover:bg-white/10' : 'border-gray-300/60 text-gray-600 hover:bg-white/40'
                  }`}
                >#{tag}</button>
              ))}
              {hasFilters && (
                <button onClick={() => { setFilterTypes([]); setFilterTags([]); }}
                  className={`text-[11px] ${muted} hover:text-red-400 transition-colors`}>Clear</button>
              )}
            </>
          )}
        </div>

        {/* Center — month nav, absolutely centered so it sits over Wed */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <button onClick={prevMonth}
            className={`p-1.5 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-white/50 text-gray-600'}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className={`text-sm font-bold w-32 text-center select-none ${text}`}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth}
            className={`p-1.5 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-white/50 text-gray-600'}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Right — Today + Upcoming panel toggle */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <button onClick={goToday}
            className={`glass rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all hover:shadow-md opacity-70 hover:opacity-90 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
            Today
          </button>

          <button
            onClick={() => setShowPanel(p => !p)}
            className={`glass rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all ${
              showPanel
                ? isDarkTheme ? 'bg-white/15 text-white' : 'bg-black/10 text-gray-800'
                : isDarkTheme ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            Upcoming
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Calendar grid — fills height exactly */}
        <div className="flex-1 overflow-hidden flex flex-col p-2 gap-1">

          {/* Day headers with frosted glass */}
          <div className={`grid grid-cols-7 rounded-xl overflow-hidden ${dayHeaderBg}`}>
            {DAYS.map(d => (
              <div key={d} className={`py-1.5 text-center text-[10px] font-bold uppercase tracking-widest ${muted}`}>{d}</div>
            ))}
          </div>

          {/* Cells — use CSS grid with equal rows filling remaining height */}
          <div
            ref={gridRef}
            className="flex-1 grid grid-cols-7 gap-1"
            style={{ gridTemplateRows: `repeat(${numRows}, 1fr)` }}
          >
            {paddedCells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="rounded-xl" />;
              const ds     = toDateStr(year, month, day);
              const dayEvs = eventsForDay(day);
              const isToday    = ds === todayStr;
              const isSelected = selectedDay === day;
              return (
                <div
                  key={`${day}-${idx}`}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  onDoubleClick={() => openNew(day)}
                  className={`rounded-xl p-1 cursor-pointer border transition-all flex flex-col overflow-hidden ${
                    isSelected
                      ? isDarkTheme ? 'border-white/50 bg-white/25' : 'border-black/25 bg-white/88'
                      : isToday
                      ? isDarkTheme ? 'bg-white/20 border-white/35' : 'bg-white/88 border-black/18'
                      : `${cellBg} border-transparent`
                  }`}
                >
                  <div className="flex items-center justify-between shrink-0">
                    <span className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ${
                      isToday
                        ? isDarkTheme ? 'bg-white/25 text-white' : 'bg-black/20 text-white'
                        : muted
                    }`}>
                      {day}
                    </span>
                    {dayEvs.length > 2 && (
                      <span className={`text-[9px] font-semibold ${muted}`}>+{dayEvs.length - 2}</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                    {dayEvs.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        className={`${pillBase} flex items-center gap-0.5 ${ev.completed ? 'opacity-50 line-through' : ''}`}
                        style={{ backgroundColor: eventColor(ev) }}
                      >
                        {ev.time && <span className="shrink-0 opacity-80 text-[9px]">{ev.time.slice(0,5)}</span>}
                        <span className="truncate text-[9px]">{ev.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible side panel */}
        {showPanel && (
          <div className={`w-56 shrink-0 border-l ${border} ${sidePanelBg} flex flex-col overflow-hidden`}>

            {selectedDay ? (
              <div className={`shrink-0 p-3 border-b ${border}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-xs font-bold ${text}`}>{MONTHS[month].slice(0,3)} {selectedDay}</h3>
                  <button onClick={() => openNew(selectedDay)} className={`${muted} hover:opacity-60 transition-opacity`}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                </div>
                {selectedEvents.length === 0 ? (
                  <p className={`text-[11px] ${muted}`}>No events. Click + to add.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedEvents.map(ev => (
                      <EventCard key={ev.id} ev={ev} isDarkTheme={isDarkTheme} muted={muted} text={text}
                        onEdit={openEdit} onDelete={deleteEvent} onToggle={toggleComplete} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`shrink-0 p-3 border-b ${border}`}>
                <p className={`text-[11px] ${muted}`}>Click a day to see events.</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
              <h3 className={`text-[10px] font-bold uppercase tracking-widest ${muted} mb-2`}>Upcoming</h3>
              {soon.length === 0 ? (
                <p className={`text-[11px] ${muted}`}>Nothing coming up.</p>
              ) : (
                <div className="space-y-1.5">
                  {soon.map(ev => (
                    <EventCard key={ev.id} ev={ev} isDarkTheme={isDarkTheme} muted={muted} text={text}
                      onEdit={openEdit} onDelete={deleteEvent} onToggle={toggleComplete} showDate />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit modal ─────────────────────────────────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setShowForm(false); setEditId(null); }}
        >
          <div
            className={`rounded-2xl border shadow-2xl p-6 w-full max-w-md ${modalBg}`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`text-sm font-bold mb-4 ${text}`}>{editId ? 'Edit event' : 'New event'}</h3>
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
                  <input placeholder="e.g. Exam, Deadline…" value={form.type}
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
                <input placeholder="e.g. midterm, 11-785, week4" value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} className={inputCls} />
              </div>
              {form.type && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hashColor(form.type) }} />
                  <span className={`text-[11px] ${muted}`}>Color assigned from category</span>
                </div>
              )}
              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} placeholder="Optional notes…" value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit"
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${isDarkTheme ? 'bg-white/15 text-white hover:bg-white/22' : 'bg-black/8 text-gray-800 hover:bg-black/12'}`}>
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
                  className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:bg-black/5'}`}>
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

function EventCard({ ev, isDarkTheme, muted, text, onEdit, onDelete, onToggle, showDate }) {
  const color = ev.color || hashColor(ev.type);
  return (
    <div className={`flex items-start gap-1.5 group ${ev.completed ? 'opacity-50' : ''}`}>
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
          <p className={`text-[11px] font-semibold leading-tight truncate ${ev.completed ? 'line-through' : text}`}>{ev.title}</p>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(ev)} className={`p-0.5 ${muted} hover:opacity-60 transition-opacity`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => onDelete(ev.id)} className={`p-0.5 ${muted} hover:text-red-400 transition-colors`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {showDate && <span className={`text-[9px] ${muted}`}>{formatDate(ev.date)}</span>}
          {ev.time   && <span className={`text-[9px] font-mono ${muted}`}>{ev.time.slice(0,5)}</span>}
          {ev.type   && <span className="text-[9px] font-semibold" style={{ color }}>{ev.type}</span>}
          {(ev.tags || []).map(tag => (
            <span key={tag} className={`text-[9px] px-1 rounded ${isDarkTheme ? 'bg-gray-700/60 text-gray-400' : 'bg-black/8 text-gray-500'}`}>#{tag}</span>
          ))}
        </div>
        {ev.notes && <p className={`text-[9px] mt-0.5 ${muted} truncate`}>{ev.notes}</p>}
      </div>
    </div>
  );
}
