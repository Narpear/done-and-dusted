// ─── Progress Calculation ────────────────────────────────────────────────────

/**
 * Recursively calculates weighted progress for a task.
 * Always recurses into subtasks if they exist — never shortcuts on completed flag.
 * Returns a value between 0 and 1.
 */
export function calcProgress(item) {
  const subtasks = item.subtasks;
  if (!subtasks || subtasks.length === 0) {
    return item.completed ? 1 : 0;
  }
  const total = subtasks.length;
  const sum = subtasks.reduce((acc, s) => acc + calcProgress(s), 0);
  return sum / total;
}

export function calcProgressPct(item) {
  return Math.round(calcProgress(item) * 100);
}

// ─── Due Date Labels ──────────────────────────────────────────────────────────

export function getDueDateLabel(dueDateStr) {
  if (!dueDateStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffMs = due - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return { label: abs === 1 ? 'Yesterday' : `${abs}d overdue`, overdue: true };
  }
  if (diffDays === 0) return { label: 'Today', overdue: false, today: true };
  if (diffDays === 1) return { label: 'Tomorrow', overdue: false };
  if (diffDays <= 7) return { label: `${diffDays} days`, overdue: false };

  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: false,
  };
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

export function launchConfetti(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#f43f5e', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    r: Math.random() * 8 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 6,
    opacity: 1,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }));

  let frame;
  let elapsed = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elapsed++;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.rot += p.rotSpeed;
      if (elapsed > 80) p.opacity -= 0.015;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    if (elapsed < 160) {
      frame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(frame);
    }
  }

  draw();
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}