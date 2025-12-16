"use client";

import { useEffect } from 'react';
import colors, { cssVars } from '../client-colors';

// Small client-side provider: writes CSS variables to :root on mount.
// This ensures runtime updates (HMR/dev) update visuals immediately
// and also provides a client-side source of truth for JS-driven styles.
export default function ThemeVarsProvider() {
  useEffect(() => {
    const root = document.documentElement;
  const set = (name: string, value: string) => root.style.setProperty(name, value);

  // Apply the canonical CSS variable defaults from client-colors.
  Object.entries(cssVars).forEach(([k, v]) => set(k, v));

    // Detect and neutralize full-viewport white overlays that sometimes appear
    // in dev (Next.js overlay, toasters, or other runtime-injected elements).
    // Strategy: find elements that cover the viewport (bounding rect >= window)
    // and have a computed white background; make them transparent and disable
    // pointer-events so the page underneath is visible. We keep a small safety
    // net (do not remove elements) and store previous inline styles in
    // data attributes so this can be reverted if needed.
    const neutralizeOverlays = () => {
      try {
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('body *'));
        const w = window.innerWidth;
        const h = window.innerHeight;
        const diagnostics: Array<any> = [];
        candidates.forEach((el) => {
          const cs = getComputedStyle(el);
          const pos = cs.position;
          if (!(pos === 'fixed' || pos === 'absolute' || pos === 'sticky')) return;
          const rect = el.getBoundingClientRect();
          // require element to cover (or nearly cover) viewport
          if (rect.width + 1 < w || rect.height + 1 < h) return;
          const bg = cs.backgroundColor || cs.background;
          if (!bg) return;
          // match white backgrounds (rgb/rgba white or explicit #fff)
          const isWhite = /rgba?\(\s*255\s*,\s*255\s*,\s*255(?:\s*,\s*1(?:\.0)?)?\s*\)/i.test(bg) || /(^|\s)#fff(f)?(\s|$)/i.test(bg) || /white/i.test(bg);
          // push a diagnostic entry regardless of white match so we can see candidates
          diagnostics.push({
            tag: el.tagName,
            id: el.id || null,
            className: el.className || null,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            background: bg,
            zIndex: cs.zIndex || null,
            isWhite,
            node: el,
          });
          if (!isWhite) return;

          // Save previous inline styles so we can restore if needed
          try {
            const prev = {
              background: el.style.getPropertyValue('background') || '',
              backgroundColor: el.style.getPropertyValue('background-color') || '',
              pointerEvents: el.style.getPropertyValue('pointer-events') || '',
              zIndex: el.style.getPropertyValue('z-index') || '',
            };
            el.dataset.__prevOverlayStyles = JSON.stringify(prev);
          } catch (e) {
            // ignore serialization errors
          }

          // Apply neutralizing styles
          el.style.setProperty('background', 'transparent', 'important');
          el.style.setProperty('background-color', 'transparent', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
          // If element had absurdly high z-index, lower it a bit to allow UI interaction
          try {
            const z = parseInt(cs.zIndex || '0', 10) || 0;
            if (z > 1000) el.style.setProperty('z-index', String(1000), 'important');
          } catch (e) {
            // ignore
          }
        });
        // expose diagnostics for manual inspection in the console
        try {
          // strip node references for JSON-safe storage, keep them in a separate window property
          (window as any).__overlayDiagnostics = diagnostics.map((d) => ({ ...d, node: undefined }));
          (window as any).__overlayDiagnosticsNodes = diagnostics.map((d) => d.node);
          if (diagnostics.length > 0) {
            // logging removed
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        // defensive: do not throw
        // console.error('overlay neutralizer error', err);
      }
    };

    // run now and a short time after to catch late-inserted overlays
    neutralizeOverlays();
    const t1 = setTimeout(neutralizeOverlays, 120);
    window.addEventListener('resize', neutralizeOverlays);

    // optional: return cleanup to remove listeners. We intentionally keep CSS vars
    // in place (removing them might flash), but we should clean up our listeners.
    return () => {
      clearTimeout(t1);
      window.removeEventListener('resize', neutralizeOverlays);
    };
  }, []);

  return null;
}
