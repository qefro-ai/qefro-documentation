#!/usr/bin/env node
/**
 * Lightweight internal link checker for built docs.
 * Usage: npm run build && npm run check:links
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, '..', 'build');

if (!fs.existsSync(buildDir)) {
  console.error('build/ not found. Run npm run build first.');
  process.exit(1);
}

const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.html')) htmlFiles.push(p);
  }
}
walk(buildDir);

const hrefRe = /href="(\/[^"#?]*)"/g;
const missing = new Set();
const existing = new Set(
  htmlFiles.map((f) => {
    let rel = '/' + path.relative(buildDir, f).split(path.sep).join('/');
    if (rel.endsWith('/index.html')) rel = rel.slice(0, -10) || '/';
    else if (rel.endsWith('.html')) rel = rel.slice(0, -5);
    return rel;
  }),
);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = hrefRe.exec(html))) {
    const href = m[1];
    if (
      href.startsWith('/assets') ||
      href.startsWith('/img') ||
      href.startsWith('/search') ||
      href.includes('.')
    ) {
      continue;
    }
    const candidates = [href, href.replace(/\/$/, ''), href + '/', href + '/index.html'];
    const ok = candidates.some(
      (c) =>
        existing.has(c) ||
        existing.has(c.replace(/\/$/, '')) ||
        fs.existsSync(path.join(buildDir, c.replace(/^\//, ''), 'index.html')) ||
        fs.existsSync(path.join(buildDir, c.replace(/^\//, '') + '.html')),
    );
    if (!ok) missing.add(`${path.relative(buildDir, file)} -> ${href}`);
  }
}

if (missing.size) {
  console.error('Broken internal links:');
  for (const x of [...missing].slice(0, 50)) console.error(' ', x);
  console.error(`Total: ${missing.size}`);
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files — no broken internal hrefs found.`);
