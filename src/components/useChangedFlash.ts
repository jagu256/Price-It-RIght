import { useEffect, useRef, useState } from 'react';

/** How long a changed number glows. */
export const FLASH_MS = 1600;

/**
 * True for a moment after `value` changes (not when it is first shown), so a
 * number that just moved – after Apply, Undo or an edit – briefly glows.
 */
export function useChangedFlash(value: string): boolean {
  const previous = useRef(value);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [value]);
  return flash;
}
