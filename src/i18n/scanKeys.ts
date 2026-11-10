/**
 * Finds every English text marked for translation in the source code:
 * t('…'), tx('…') and plural(n, '…', '…'). Used by the dictionary test so a
 * missing French translation can never slip through.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STRING = String.raw`(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|\x60((?:\\.|[^\x60\\$])*)\x60)`;
const T_CALL = new RegExp(String.raw`\b(?:t|tx)\(\s*${STRING}`, 'g');
/** Field names passed to parseAmount(raw, 'offered price per unit') are shown in messages. */
const PARSE_NAME = new RegExp(String.raw`\bparseAmount\([^,()]+,\s*${STRING}`, 'g');
const PLURAL = new RegExp(String.raw`\bplural\(\s*[^,]+,\s*${STRING}\s*,\s*${STRING}`, 'g');

const unescape = (s: string) => s.replace(/\\(['"\\`])/g, '$1').replace(/\\n/g, '\n');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'test' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && !/scanKeys\.ts$/.test(name) && !/fr\.ts$/.test(name) ? [path] : [];
  });
}

export function findTranslationKeys(srcDir: string): Map<string, string> {
  const keys = new Map<string, string>(); // key → first file it appears in
  for (const file of sourceFiles(srcDir)) {
    const code = readFileSync(file, 'utf8');
    for (const m of code.matchAll(T_CALL)) {
      const key = unescape(m[1] ?? m[2] ?? m[3] ?? '');
      if (!keys.has(key)) keys.set(key, file);
    }
    for (const m of code.matchAll(PARSE_NAME)) {
      const key = unescape(m[1] ?? m[2] ?? m[3] ?? '');
      if (!keys.has(key)) keys.set(key, file);
    }
    for (const m of code.matchAll(PLURAL)) {
      for (const key of [m[1] ?? m[2] ?? m[3], m[4] ?? m[5] ?? m[6]].map((k) => unescape(k ?? ''))) if (!keys.has(key)) keys.set(key, file);
    }
  }
  return keys;
}
