import '@testing-library/jest-dom/vitest';

// Recharts' ResponsiveContainer needs ResizeObserver, which jsdom does not provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = ResizeObserverStub;

// jsdom's Blob/File lack .text() and .arrayBuffer(), which every modern browser has.
if (typeof Blob !== 'undefined' && typeof FileReader !== 'undefined') {
  const read = (blob: Blob, as: 'text' | 'buffer') =>
    new Promise<string | ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string | ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      if (as === 'text') reader.readAsText(blob);
      else reader.readAsArrayBuffer(blob);
    });
  if (!Blob.prototype.text) Blob.prototype.text = function () { return read(this, 'text') as Promise<string>; };
  if (!Blob.prototype.arrayBuffer) Blob.prototype.arrayBuffer = function () { return read(this, 'buffer') as Promise<ArrayBuffer>; };
}

// Newer Node versions (25+) hide jsdom's localStorage behind their own, which is
// switched off unless a file is given. Every real browser has localStorage, so the
// simulated browser gets a simple in-memory one (cleared after each test).
if (typeof window !== 'undefined' && !window.localStorage) {
  class MemoryStorage {
    private data = new Map<string, string>();
    get length() { return this.data.size; }
    key(i: number) { return [...this.data.keys()][i] ?? null; }
    getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
    setItem(k: string, v: string) { this.data.set(k, String(v)); }
    removeItem(k: string) { this.data.delete(k); }
    clear() { this.data.clear(); }
  }
  Object.defineProperty(window, 'localStorage', { value: new MemoryStorage(), configurable: true });
}

// jsdom does not implement scrolling. (Some tests run without a browser window.)
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.scrollTo = () => {};
}

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
