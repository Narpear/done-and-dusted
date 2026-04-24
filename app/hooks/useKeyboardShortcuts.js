'use client';

import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for the app.
 *
 * n / N   → focus the main task input
 * Escape  → close any open modal
 * ?       → toggle keyboard shortcut help overlay
 */
export function useKeyboardShortcuts({ inputRef, onEscape, onToggleHelp }) {
  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        onEscape?.();
        document.activeElement?.blur();
        return;
      }

      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        onToggleHelp?.();
        return;
      }

      if (isTyping) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        inputRef?.current?.focus();
        return;
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputRef, onEscape, onToggleHelp]);
}