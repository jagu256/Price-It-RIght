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
