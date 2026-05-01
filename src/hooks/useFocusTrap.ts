import { useEffect, type RefObject } from 'react';

/**
 * Trap keyboard focus inside a container while it is mounted/active.
 *
 * Round-1 modals only moved focus IN on open and restored it OUT on
 * close. Tab could still escape the dialog into the page underneath —
 * a screen-reader user could land on a button behind a Crisis modal
 * with no visual indication their focus had left the surface.
 *
 * This hook intercepts Tab / Shift+Tab inside the container and
 * wraps focus to the opposite end. It does NOT use the inert
 * attribute (Safari support patchy as of 2026) or modify sibling
 * elements; it only manages focus inside the trap. That is enough
 * to keep Tab-cycling inside the dialog. Click + screen-reader
 * virtual-cursor escape is still possible — that is the OS layer's
 * job (aria-modal="true" tells the AT). For full inert isolation,
 * upgrade to focus-trap-react or similar; for the modals this app
 * ships today, the Tab-wrap is what was missing.
 *
 * Args:
 *   ref      — ref to the container element to trap focus inside
 *   active   — whether the trap is currently engaged
 *   onEscape — optional callback fired on Escape key press
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    function getFocusable(): HTMLElement[] {
      if (!node) return [];
      const sel =
        'a[href], button:not([disabled]), textarea:not([disabled]), ' +
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
        '[tabindex]:not([tabindex="-1"])';
      return Array.from(node.querySelectorAll<HTMLElement>(sel)).filter(
        (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
      );
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }

    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [ref, active, onEscape]);
}
