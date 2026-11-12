// Model check: stills from arbitrary cameras with the overlay hidden.
// Usage: node tools/view.mjs --views "name:t:px,py,pz:lx,ly,lz;…" [--dir out/view] [--hide Display,Battery]
import fs from 'node:fs';
import path from 'node:path';
import { openStage, parseArgs } from './browser.mjs';

const o = parseArgs({ width: 1280, height: 720, views: '', dir: 'out/view', hide: '', gpu: false, headed: false, scale: 1, quality: 'high' });
fs.mkdirSync(o.dir, { recursive: true });
const { page, close } = await openStage(o);
if (o.hide) await page.evaluate((names) => { window.__scene.phone.group.traverse((n) => { if (names.includes(n.name)) n.visible = false; }); }, String(o.hide).split(','));
for (const v of String(o.views).split(';').filter(Boolean)) {
  const [name, t, pos, look] = v.split(':');
  const t0 = Date.now();
  await page.evaluate(({ t, pos, look }) => window.__view(t, pos, look), { t: Number(t), pos: pos.split(',').map(Number), look: look.split(',').map(Number) });
  const file = path.join(o.dir, `${name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
  console.log(file, `${Date.now() - t0} ms`);
}
await close();
