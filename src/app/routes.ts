import { useEffect, useState } from 'react';

export const SECTIONS = [
  { id: 'my-business', emoji: '🏠', label: 'My Business' },
  { id: 'dashboard', emoji: '💰', label: 'Profit Dashboard' },
  { id: 'pricing', emoji: '🎯', label: 'Pricing Lab' },
  { id: 'inventory', emoji: '📦', label: 'Smart Inventory Hub' },
  { id: 'planner', emoji: '🏆', label: 'Production Planner' },
  { id: 'decisions', emoji: '🧭', label: 'Decisions' },
  { id: 'challenge', emoji: '🎮', label: 'Business Challenge' },
  { id: 'report', emoji: '📊', label: 'Business Report' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'] | 'home';

const valid = new Set<string>(['home', ...SECTIONS.map((s) => s.id)]);
const read = (): SectionId => {
  const h = window.location.hash.replace(/^#/, '');
  return (valid.has(h) ? h : 'home') as SectionId;
};

/** The current section comes from the address (#dashboard), so Back/Forward and bookmarks work. */
export function useRoute(): [SectionId, (id: SectionId) => void] {
  const [route, setRoute] = useState<SectionId>(read);
  useEffect(() => {
    const onHash = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (id: SectionId) => {
    if (window.location.hash === `#${id}`) return;
    window.location.hash = id;
  };
  return [route, go];
}
