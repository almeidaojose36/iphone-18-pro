#!/usr/bin/env node
// Offline renderer: steps the timeline frame by frame in headless Chromium and encodes with ffmpeg.
//
//   node tools/render.mjs                         full video → out/deep-teardown.mp4 (1920×1080, 30 fps, with voiceover)
//   node tools/render.mjs --from 55 --to 75       just a section
//   node tools/render.mjs --width 960 --fps 15    quick preview
//   node tools/render.mjs --cc 0                  without burned-in captions
//   node tools/render.mjs --fx 0                  no bloom pass (faster)     --noaudio   video only
//   node tools/render.mjs --shots 10,80,200       PNG stills at those times → out/shots/
//
// Requires: playwright (with Chromium) and ffmpeg on PATH.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const width = +arg('width', 1920), height = Math.round(width * 9 / 16), fps = +arg('fps', 30);
const out = path.resolve(ROOT, arg('out', 'out/deep-teardown.mp4'));
const shots = arg('shots', null);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.hdr': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?record&cc=${arg('cc', '1')}&fx=${arg('fx', '1')}${arg('q', '')}`;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url);
await page.waitForFunction('window.ready === true', null, { timeout: 60000 }).catch(() => {});
if (errors.length) { console.error('Page errors:\n' + errors.join('\n')); process.exit(1); }
const total = await page.evaluate(() => window.timeline.total);
fs.mkdirSync(path.dirname(out), { recursive: true });

if (shots) {
  const dir = path.join(path.dirname(out), 'shots');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of shots.split(',')) {
    await page.evaluate((t) => window.renderAt(t), +s);
    await page.screenshot({ path: path.join(dir, `t${String(Math.round(+s * 10)).padStart(5, '0')}.png`) });
  }
  console.log(`wrote ${shots.split(',').length} stills to ${dir}`);
} else {
  const from = +arg('from', 0), to = Math.min(total, +arg('to', total));
  const audio = path.join(ROOT, 'audio/voiceover_full.mp3');
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    ...(fs.existsSync(audio) && !process.argv.includes('--noaudio') ? ['-ss', String(from), '-t', String(to - from), '-i', audio] : []),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', arg('crf', '18'), '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-shortest', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.floor((to - from) * fps), t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.renderAt(t), from + i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`\r${i}/${n} frames  ${((Date.now() - t0) / 1000 / (i + 1)).toFixed(2)} s/frame   `);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\nwrote ${out}`);
}
if (errors.length) console.error('Page errors:\n' + errors.join('\n'));
await browser.close();
server.close();
