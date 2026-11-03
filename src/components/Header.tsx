import Logo from './Logo';

const LINKS = [
  { href: '#simulator', label: 'Simulator' },
  { href: '#results', label: 'Results' },
  { href: '#what-if', label: 'What-If' },
  { href: '#charts', label: 'Charts' },
  { href: '#learn', label: 'Learn' },
  { href: '#inventory', label: 'Inventory' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-sage-100/80 bg-cream-100/85 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <a href="#top" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-lg font-bold text-sage-900">
          <Logo className="h-8 w-8" />
          Price It Right
        </a>
        <ul className="flex min-w-0 gap-1 overflow-x-auto text-sm font-semibold text-sage-700">
          {LINKS.map((l) => (
            <li key={l.href} className={l.href === '#results' ? 'hidden sm:block' : undefined}>
              <a href={l.href} className="block whitespace-nowrap rounded-full px-3 py-1.5 transition hover:bg-sage-100">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
