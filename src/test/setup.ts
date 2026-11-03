import '@testing-library/jest-dom/vitest';

// Recharts' ResponsiveContainer needs ResizeObserver, which jsdom does not provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = ResizeObserverStub;

// jsdom does not implement scrolling.
window.HTMLElement.prototype.scrollIntoView = function () {};
window.scrollTo = () => {};

// In jsdom, elements have no size, so Recharts' ResponsiveContainer would
// render nothing and print warnings. Give charts a fixed size during tests.
import { cloneElement, createElement, type ReactElement } from 'react';
import { vi } from 'vitest';

vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      createElement('div', { style: { width: 800, height: 300 } }, cloneElement(children, { width: 800, height: 300 } as never)),
  };
});
