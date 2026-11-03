/** Small line icons (decorative – always paired with a text label). */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const CoinsIcon = () => (
  <svg {...base}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3" /></svg>
);
export const TrendIcon = () => (
  <svg {...base}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
);
export const TrendDownIcon = () => (
  <svg {...base}><path d="M3 7l6 6 4-4 8 8" /><path d="M15 17h6v-6" /></svg>
);
export const ScaleIcon = () => (
  <svg {...base}><path d="M12 3v18" /><path d="M5 21h14" /><path d="M4 7h16" /><path d="M7 7l-3 7a3 3 0 0 0 6 0z" /><path d="M17 7l-3 7a3 3 0 0 0 6 0z" /></svg>
);
export const TagIcon = () => (
  <svg {...base}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.5" /></svg>
);
export const PieIcon = () => (
  <svg {...base}><path d="M21 12A9 9 0 1 1 12 3v9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></svg>
);
export const ShieldIcon = () => (
  <svg {...base}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
);
