// iPhone 18 Pro, modelled in millimetres. x runs across the phone as seen from the front, y toward the
// top edge, z toward the screen; the origin is the centre of the phone. Outer size, finishes and the part
// list follow Apple's specifications and iFixit's teardown; positions and sizes of internal parts are
// estimates from Apple's cutaway renders (docs/RESEARCH.md says which is which).
import * as THREE from 'three';
import { rrect, rpoly, circle, plate, box, cyl, ring, dome, group, flex, decal, textTexture, wallpaperTexture } from '../kit.js';

export const W = 71.9, H = 150.0, D = 8.75;
const ZB = -D / 2, ZF = D / 2;                      // back and front faces
const ZI = 3.4;                                     // top of the frame wall, where the display sits

// rear lenses as seen from the front (x mirrored from the familiar rear view)
export const LENS = { main: [19, 45.5], tele: [19, 62.5], ultra: [3.5, 54] };
export const STOPS = [1.48, 1.8, 2.8, 4.0];
export const FOCAL = 6.8;                           // mm; opening = focal length / f-number
const BATT = [[-8, -56], [30, -56], [30, 14], [-30, 14], [-30, -41], [-8, -41]];          // L-shaped cell outline
const VAPOR = [[-8.5, -56.5], [30.8, -56.5], [30.8, 15], [7, 15], [7, 34], [-30.8, 34], [-30.8, -41.5], [-8.5, -41.5]];
const BOARD = [[-31, 16.5], [8, 16.5], [8, 35], [-12.5, 35], [-12.5, 71], [-31, 71]];       // logic board outline
export const SOC = [-13, 25.8];

export function buildPhone(M) {
  const R = {};
  const phone = group('iPhone 18 Pro');

  // ------------------------------------------------------------ aluminium unibody
  const chassis = R.chassis = group('Aluminium unibody');
  const outer = rrect(W, H, 11.6), inner = rrect(W - 5, H - 5, 9.2, 0, 0, THREE.Path);
  chassis.add(plate(outer, ZB, ZI, M.body, { holes: [inner], bevel: 0.75, name: 'Frame', segs: 14, bsegs: 3 }));
  const lensHoles = Object.values(LENS).map(([x, y]) => circle(6.55, x, y));
  // rear wall under the camera plateau, and the plateau itself
  chassis.add(plate(rrect(W - 4.6, 37.8, [1, 1, 9.4, 9.4], 0, 53.9), ZB, ZB + 0.9, M.body, { holes: lensHoles, bevel: 0.05, name: 'Rear wall' }));
  chassis.add(plate(rrect(66, 35.6, 10.6, 0, 54.2), ZB - 2.5, ZB + 0.2, M.body, { holes: lensHoles, bevel: 0.7, name: 'Camera plateau', segs: 14, bsegs: 3 }));
  R.lensRings = []; R.lensCovers = [];
  for (const [k, [x, y]] of Object.entries(LENS)) {
    const r = ring(8.1, 6.5, ZB - 4.3, ZB - 2.4, M.body, x, y, `Lens ring (${k})`, 0.35, 72, 3);
    const g = cyl(6.5, ZB - 4.05, ZB - 3.8, M.lensCover, x, y, `Sapphire lens cover (${k})`);
    g.castShadow = false; g.renderOrder = 3;
    chassis.add(r, g); R.lensRings.push(r); R.lensCovers.push(g);
  }
  // flash, rear microphone, LiDAR window
  chassis.add(cyl(3.4, ZB - 2.56, ZB - 2.3, M.flash, -21.5, 63, 'True Tone flash'), cyl(0.45, ZB - 2.56, ZB - 2.3, M.black, -21.5, 54.4, 'Rear microphone'),
    cyl(3.3, ZB - 2.56, ZB - 2.3, M.glassBlack, -21.5, 45.5, 'LiDAR window'));
  // buttons: Action and volume on the left, side button and Camera Control on the right
  const btn = (x, y, len, name, mat = M.body) => { const b = plate(rrect(1.5, len, 0.7, x, y), -1.5, 1.5, mat, { bevel: 0.3, name }); chassis.add(b); return b; };
  btn(-W / 2 - 0.2, 43, 6.5, 'Action button'); btn(-W / 2 - 0.2, 27.4, 11.5, 'Volume up'); btn(-W / 2 - 0.2, 12.8, 11.5, 'Volume down');
  btn(W / 2 + 0.2, 26, 17.5, 'Side button'); btn(W / 2 + 0.05, -16, 15.5, 'Camera Control', M.glassBlack);
  // bottom edge: speaker and microphone holes, pentalobe screws, USB-C opening
  const edge = (x, r, mat, name) => { const m = cyl(r, -0.3, 0.3, mat, 0, 0, name); m.rotation.set(0, 0, 0); m.scale.set(r, 0.5, r); m.position.set(x, -H / 2 - 0.02, 0); chassis.add(m); };
  for (let i = 0; i < 5; i++) { edge(-25 + i * 3.1, 0.75, M.black, 'Microphone grille'); edge(12.6 + i * 3.1, 0.75, M.black, 'Speaker grille'); }
  edge(-8.2, 0.8, M.steel, 'Pentalobe screw'); edge(8.2, 0.8, M.steel, 'Pentalobe screw');
  const port = plate(rrect(8.6, 2.9, 1.45), 0, 0.5, M.black, { bevel: 0.1, name: 'USB-C opening' }); port.rotation.x = Math.PI / 2; port.position.set(0, -H / 2 + 0.3, 0); chassis.add(port);
  // inside the frame: screw bosses and ribs (these are what read through the glass look)
  const boss = (x, y, h = 2.2) => { chassis.add(ring(1.25, 0.5, ZB + 0.9, ZB + 0.9 + h, M.bodyInner, x, y, 'Screw boss', 0, 8)); };
  for (let i = 0; i < 9; i++) { const y = -62 + i * 15.2; boss(-31.6, y); boss(31.6, y); }
  for (let i = 0; i < 5; i++) { boss(-22 + i * 11, -70.4); boss(-24 + i * 12, 70.6, 1.4); }
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) chassis.add(box(0.7, 22, 1.6, M.bodyInner, sx * 32.6, -50 + i * 31, ZB + 1.9, 'Rib'));
  chassis.add(box(58, 0.7, 1.4, M.bodyInner, 0, -57.4, ZB + 1.7, 'Cross rib'), box(40, 0.7, 1.4, M.bodyInner, 10, 35.9, ZB + 1.7, 'Cross rib'));
  phone.add(chassis);

  // ------------------------------------------------------------ rear glass with the charging coil
  const back = R.back = group('Ceramic Shield back');
  back.add(plate(rrect(W - 5.3, 107.4, [8.9, 8.9, 2, 2], 0, -18.9), ZB, ZB + 0.85, M.backGlass, { bevel: 0.2, name: 'Rear glass panel' }));
  const coil = R.coil = group('Wireless charging coil');
  for (let i = 0; i < 9; i++) coil.add(ring(21.5 - i * 1.05, 20.7 - i * 1.05, ZB + 0.85, ZB + 1.1, M.copper, 0, -14, 'Coil winding', 0, 40));
  for (let i = 0; i < 16; i++) {                                         // magnet array around the coil
    const a = (i + 0.5) / 16 * Math.PI * 2; if (Math.abs(a - Math.PI * 1.5) < 0.25) continue;
    const m = box(8.2, 3.2, 0.5, M.magnet, Math.cos(a) * 26.4, -14 + Math.sin(a) * 26.4, ZB + 1.1, 'MagSafe magnet'); m.rotation.z = a + Math.PI / 2; coil.add(m);
  }
  coil.add(box(4.2, 10, 0.5, M.magnet, 0, -48.5, ZB + 1.1, 'Alignment magnet'), flex([[14, -29, ZB + 1.0], [22, -40, ZB + 1.0], [22, -52, ZB + 1.0]], 3, M.amber, 'Coil flex'));
  back.add(coil);
  phone.add(back);

  // ------------------------------------------------------------ vapor chamber
  const vapor = R.vapor = group('Vapor chamber');
  const vm = plate(rpoly(VAPOR, 2.2), -3.4, -2.92, M.vapor, { bevel: 0.1, name: 'Vapor chamber plate' });
  { const uv = vm.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4.4, uv.getY(i) / 4.4); M.vapor.map.wrapS = M.vapor.map.wrapT = M.vapor.bumpMap.wrapS = M.vapor.bumpMap.wrapT = THREE.RepeatWrapping; }
  vapor.add(vm, plate(rrect(15.5, 15.5, 1.6, SOC[0], SOC[1]), -2.95, -2.78, M.steel, { bevel: 0.06, name: 'Evaporator pad' }),
    plate(rrect(13.5, 13.5, 1.2, SOC[0], SOC[1]), -2.8, -2.7, M.pad, { bevel: 0.03, name: 'Thermal interface pad' }));
  phone.add(vapor);

  // ------------------------------------------------------------ battery: steel tray, cell, thirteen screws
  const battery = R.battery = group('Battery assembly');
  const tray = R.tray = group('Battery tray');
  const trayPts = BATT.map(([x, y]) => [x + Math.sign(x) * 0.55, y + Math.sign(y + 20) * 0.55]);
  tray.add(plate(rpoly(trayPts, 3), -2.9, -2.55, M.steel, { bevel: 0.08, name: 'Tray floor' }));
  tray.add(plate(rpoly(trayPts, 3), -2.6, -1.3, M.steel, { bevel: 0.05, holes: [rpoly(BATT.map(([x, y]) => [x + Math.sign(x) * 0.15, y + Math.sign(y + 20) * 0.15]), 2.8, THREE.Path)], name: 'Tray wall' }));
  const tabs = [[-31.6, 6], [-31.6, -14], [-31.6, -33], [31.6, 8], [31.6, -8], [31.6, -24], [31.6, -40], [31.6, -54], [-18, 15.6], [2, 15.6], [20, 15.6], [10, -57.6], [-19, -42.6]];
  R.screws = [];
  for (const [x, y] of tabs) {
    tray.add(plate(rrect(3.4, 3.4, 1.2, x, y), -2.9, -2.55, M.steel, { bevel: 0.06, holes: [circle(0.75, x, y)], name: 'Tray tab' }));
    const s = group('Tray screw', cyl(1.15, -2.55, -2.2, M.steelDark, 0, 0, 'Screw head'), cyl(0.55, -3.6, -2.55, M.steelDark, 0, 0, 'Screw thread'), box(1.3, 0.28, 0.1, M.black, 0, 0, -2.17), box(0.28, 1.3, 0.1, M.black, 0, 0, -2.17));
    s.position.set(x, y, 0); R.screws.push(s); phone.add(s);
  }
  const cell = R.cell = group('Battery cell');
  cell.add(plate(rpoly(BATT, 2.6), -2.5, 2.2, M.cell, { bevel: 0.45, name: 'Cell can' }));
  cell.add(decal(40, 12, textTexture([['Li-ion battery', 44, 500, '#8b8e94'], ['16.76 Wh    4288 mAh', 50, 600, '#a4a7ad']], { w: 1024, h: 300 }), 6, -14, 2.22, { transparent: true, roughness: 0.6 }));
  cell.add(flex([[-22, 12, 1.2], [-22, 17.5, 1.2]], 6, M.flex, 'Battery connector flex'), box(7, 2.4, 0.9, M.steelDark, -22, 18.2, 1.3, 'Battery connector'));
  battery.add(tray, cell);
  phone.add(battery);

  // ------------------------------------------------------------ bottom modules
  const taptic = R.taptic = group('Taptic Engine', box(19.5, 11.6, 3.6, M.steelDark, 0, 0, 0, 'Taptic Engine housing'), box(15, 7.5, 0.3, M.steel, 0, 0, 1.85, 'Housing lid'), box(3, 6, 0.4, M.amber, -9.2, 0, 1.4, 'Taptic flex'));
  taptic.position.set(-19.6, -49, -0.9);
  const speaker = R.speaker = group('Speaker', box(27, 11.8, 4.2, M.plastic, 0, 0, 0, 'Speaker enclosure'));
  for (let i = 0; i < 7; i++) speaker.add(box(0.5, 9.4, 0.5, M.black, -9 + i * 3, 0, 2.15, 'Enclosure rib'));
  speaker.add(box(8, 6, 0.4, M.steel, -9.5, 0, 2.2, 'Driver plate'));
  speaker.position.set(16.5, -64.2, -0.6);
  const usb = R.usb = group('USB-C port');
  usb.add(box(9.6, 7.4, 3.3, M.steel, 0, -68.6, -0.2, 'USB-C shell', 1.2), box(13, 2.2, 0.5, M.steelDark, 0, -65.2, 1.2, 'Port bracket'), box(14, 5, 0.3, M.pcb2, -10, -66.5, -1.9, 'Port board'),
    box(1.6, 1.6, 1.2, M.steelDark, -21, -70, -1.2, 'Bottom microphone'));
  usb.add(flex([[-12, -66.5, -2.2], [-32.2, -66.5, -2.2], [-32.2, 22, -2.2], [-29, 22, -2.2]], 2.6, M.flex, 'USB-C flex cable'));
  phone.add(taptic, speaker, usb);

  // ------------------------------------------------------------ logic board: two boards around an interposer
  const board = R.board = group('Logic board');
  const bShape = rpoly(BOARD, 1.6);
  const boardA = R.boardA = group('Board A (processor side)', plate(bShape, -2.0, -1.35, M.pcb, { bevel: 0.04, name: 'Board A' }));
  const soc = R.soc = group('A20 Pro', box(13, 13, 0.7, M.chip, 0, 0, -2.35, 'A20 Pro package'),
    decal(11, 11, textTexture([['A20', 150, 700, '#b8bcc4', 4], ['PRO', 74, 600, '#9a9ea6', 16]], { w: 512, h: 512 }), 0, 0, -2.71, { flip: true, transparent: true, roughness: 0.4 }));
  soc.position.set(SOC[0], SOC[1], 0);
  const ram = R.ram = group('Memory', box(10.5, 12, 0.7, M.chip, 0, 0, -2.35, 'LPDDR memory package'),
    decal(8.5, 5, textTexture([['MEMORY', 70, 600, '#8d9199', 10]], { w: 512, h: 300 }), 0, 0, -2.71, { flip: true, transparent: true }));
  ram.position.set(0.6, 25.8, 0);
  const nand = R.nand = group('Flash storage', box(12, 15, 0.9, M.chip, 0, 0, -0.46, 'NAND flash package'),
    decal(9, 5, textTexture([['NAND', 84, 600, '#8d9199', 10]], { w: 512, h: 300 }), 0, 0, -0.93, { flip: true, transparent: true }));
  nand.position.set(-21.5, 52, 0);
  boardA.add(soc, ram, box(5, 6, 0.6, M.chip, -26, 25, -2.3, 'Power management IC'), box(4, 4, 0.5, M.chip, -22.5, 40, -2.25, 'Chip'), box(6, 3, 0.5, M.chip, -22, 64, -2.25, 'Chip'));
  for (let i = 0; i < 14; i++) boardA.add(box(1.1, 0.6, 0.45, i % 3 ? M.amber : M.black, -29 + (i % 7) * 1.7, 31.5 + Math.floor(i / 7) * 1.3, -2.22, 'Capacitor'));
  for (let i = 0; i < 5; i++) boardA.add(box(3.4, 2.6, 0.6, M.chip, -27 + i * 6.6, 19, -1.05, 'Chip'));
  const inter = R.interposer = plate(bShape, -1.35, 0.0, M.amber, { bevel: 0.03, holes: [rpoly(BOARD.map(([x, y]) => [x + (x < -20 ? 1.1 : -1.1), y + (y < 30 ? 1.1 : -1.1)]), 1, THREE.Path)], name: 'Interposer frame' });
  const boardB = R.boardB = group('Board B (radio side)', plate(bShape, 0.0, 0.65, M.pcb2, { bevel: 0.04, name: 'Board B' }));
  const can = (w, h, x, y, name, t = 1.0) => { const c = box(w, h, t, M.shield, x, y, 0.65 + t / 2, name, 0.3); boardB.add(c); return c; };
  boardB.add(nand);
  R.modem = can(12, 11, -3, 26, 'C2 modem shield'); R.n1 = can(10, 9, -23.5, 26.5, 'N1 wireless shield'); can(15, 9, -22, 44, 'Shield'); can(13, 12, -22.5, 61, 'RF front-end shield');
  for (let i = 0; i < 6; i++) boardB.add(box(5.2, 1.5, 0.75, M.black, -27 + i * 6.2, 18.6, 1.0, 'Board connector'), box(4.2, 0.9, 0.2, M.gold, -27 + i * 6.2, 18.6, 1.42, 'Connector contacts'));
  board.add(boardA, inter, boardB);
  phone.add(board);

  // ------------------------------------------------------------ rear cameras
  const cams = R.cams = group('Rear camera system');
  const lensStack = (g, r0, zf, n = 3) => { for (let i = 0; i < n; i++) g.add(dome(r0 * (1 - i * 0.22), r0 * 0.28, i ? M.lensClear : M.lensGlass, 0, 0, zf + i * 0.9)); };
  // main: 48 MP Fusion Main with the variable aperture
  const main = R.main = group('48MP Fusion Main camera');
  const mSensor = R.mSensor = group('Image sensor', box(15.5, 15.5, 0.6, M.pcb, 0, 0, 2.3, 'Sensor board'), box(14.6, 14.6, 0.3, M.steelDark, 0, 0, 2.7, 'Sensor stiffener'), box(9.6, 7.2, 0.3, M.sensor, 0, 0, 1.85, 'Image sensor'), box(11.4, 9, 0.2, M.gold, 0, 0, 1.98, 'Sensor frame'));
  mSensor.add(flex([[-7.5, 0, 2.5], [-10.5, 0, 2.5]], 4, M.flex, 'Camera flex'));
  const mOis = R.mOis = group('Sensor-shift stabiliser', plate(rrect(15.5, 15.5, 1.4), -1.0, 1.6, M.steelDark, { bevel: 0.1, holes: [rrect(11.6, 11.6, 0.6, 0, 0, THREE.Path)], name: 'Stabiliser frame' }));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, m = box(8, 1.5, 1.6, M.magnet, Math.cos(a) * 6.75, Math.sin(a) * 6.75, 0.3, 'Stabiliser magnet'); m.rotation.z = a + Math.PI / 2; mOis.add(m); }
  const mCan = R.mCan = plate(rrect(15.5, 15.5, 1.4), -3.4, -1.0, M.shield, { bevel: 0.15, holes: [circle(5.5)], name: 'Camera shield can' });
  const mBarrel = R.mBarrel = group('Lens barrel', ring(5.2, 3.9, -6.6, -1.2, M.black, 0, 0, 'Barrel', 0.2, 40), ring(3.9, 3.3, -6.5, -6.2, M.blackGloss, 0, 0, 'Retainer', 0.05, 40));
  lensStack(mBarrel, 3.7, -6.35, 4);
  // variable aperture unit
  const ap = R.aperture = group('Variable aperture');
  const rotor = R.rotor = group('Rotor', ring(6.0, 3.0, -7.15, -6.75, M.blackGloss, 0, 0, 'Rotor ring', 0.06, 40));
  const Rp = 4.6;
  R.blades = [];
  for (let i = 0; i < 6; i++) {
    const phi = i / 6 * Math.PI * 2 + 0.3;
    rotor.add(cyl(0.32, -7.5, -7.1, M.steel, Math.cos(phi) * Rp, Math.sin(phi) * Rp, 'Blade pin'));
    const s = new THREE.Shape(); s.moveTo(-0.55, 0.38); s.lineTo(7.3, 0); s.quadraticCurveTo(4.4, -2.5, -0.5, -0.95); s.closePath();
    s.holes.push(circle(0.34), (() => { const p = new THREE.Path(); p.absarc(1.5, -0.62, 0.2, 0, Math.PI * 2); return p; })());
    const zb = -7.22 - i * 0.045;
    const b = plate(s, zb - 0.04, zb, M.blade, { bevel: 0, name: `Aperture blade ${i + 1}`, segs: 10 });
    const piv = group(`Blade pivot ${i + 1}`, b); piv.position.set(Math.cos(phi) * Rp, Math.sin(phi) * Rp, 0);
    piv.userData = { phi, Rp }; R.blades.push(piv); ap.add(piv);
  }
  const drive = R.drive = group('Magnetic drive');
  for (const s of [-1, 1]) {
    const mg = plate((() => { const sh = new THREE.Shape(); sh.absarc(0, 0, 5.9, -0.5, 0.5, false); sh.absarc(0, 0, 4.9, 0.5, -0.5, true); return sh; })(), -7.6, -7.15, M.magnet, { bevel: 0.04, name: 'Drive magnet' });
    mg.rotation.z = s > 0 ? 0.9 : 0.9 + Math.PI; drive.add(mg);
    const c = plate((() => { const sh = new THREE.Shape(); sh.absarc(0, 0, 6.42, -0.42, 0.42, false); sh.absarc(0, 0, 6.02, 0.42, -0.42, true); return sh; })(), -7.6, -6.8, M.copper, { bevel: 0.05, name: 'Drive coil' });
    c.rotation.z = mg.rotation.z; drive.add(c);
  }
  const apCover = R.apCover = ring(6.0, 3.3, -7.95, -7.62, M.blackMatte, 0, 0, 'Aperture cover', 0.08, 48);
  ap.add(rotor, drive, apCover);
  /** Set the iris to an opening of d millimetres across. */
  R.setAperture = (d) => {
    const al = Math.asin(Math.min(0.98, d / 2 / Rp));
    for (const p of R.blades) p.rotation.z = p.userData.phi + Math.PI - al;
    rotor.rotation.z = -al * 0.9;
  };
  R.setAperture(FOCAL / STOPS[0]);
  main.add(mSensor, mOis, mCan, mBarrel, ap);
  main.position.set(LENS.main[0], LENS.main[1], 0);
  // telephoto: tetraprism folded along the top edge
  const tele = R.tele = group('48MP Fusion Telephoto camera', box(15.5, 14, 6, M.shield, 0, 0, -0.4, 'Telephoto can', 0.9), box(19.5, 9, 3.9, M.shield, -17, 3.5, -1.45, 'Tetraprism housing', 0.7),
    ring(5.0, 3.2, -6.6, -3.3, M.black, 0, 0, 'Barrel', 0.2), box(8, 3.2, 0.15, M.flex, -17, -2, 0.6, 'Telephoto flex'));
  lensStack(tele, 3.3, -6.3, 2);
  tele.position.set(LENS.tele[0], LENS.tele[1], 0);
  const ultra = R.ultra = group('48MP Fusion Ultra Wide camera', box(12.6, 12.6, 5.6, M.shield, 0, 0, -0.6, 'Ultra Wide can', 0.9), ring(5.0, 3.4, -6.6, -3.3, M.black, 0, 0, 'Barrel', 0.2),
    box(4, 6, 0.15, M.flex, 0, -8.5, 1.9, 'Ultra Wide flex'));
  lensStack(ultra, 3.5, -6.3, 2);
  ultra.position.set(LENS.ultra[0], LENS.ultra[1], 0);
  cams.add(main, tele, ultra);
  phone.add(cams);
  const rearSmall = R.rearSmall = group('Flash and LiDAR', box(8, 8, 1.4, M.steelDark, -21.5, 45.5, -2.75, 'LiDAR Scanner'), box(7, 7, 1.2, M.steelDark, -21.5, 63, -2.85, 'Flash module'));
  phone.add(rearSmall);

  // ------------------------------------------------------------ front sensors
  const front = R.frontCam = group('Front camera array', box(21, 6.2, 1.5, M.steelDark, 0, 0, 0, 'Array bracket', 0.5),
    cyl(2.5, 0.6, 1.3, M.black, 4.2, 0, 'Center Stage front camera'), dome(1.7, 0.4, M.lensGlass, 4.2, 0, 1.3, 1), cyl(1.9, 0.6, 1.15, M.blackGloss, -4.2, 0, 'Dot projector'),
    flex([[9, 0, -0.6], [9, -7, -0.6]], 4, M.flex, 'Front camera flex'));
  front.position.set(0, 66.2, 1.95);
  const ir = R.irCam = group('Infrared camera', box(6.4, 6.4, 1.1, M.steelDark, 0, 0, 0, 'Infrared camera module', 0.4), cyl(1.8, 0.4, 0.75, M.blackGloss, 0, 0, 'Infrared camera lens'), dome(1.2, 0.3, M.lensGlass, 0, 0, 0.75, 1));
  ir.position.set(-22.5, 64, 2.25);
  const ear = R.earpiece = box(13, 2.2, 1.8, M.plastic, 0, 71.2, 1.9, 'Earpiece speaker');
  phone.add(front, ir, ear);

  // ------------------------------------------------------------ display
  const display = R.display = group('Display');
  const dShape = rrect(W - 1.5, H - 1.5, 10.9);
  display.add(plate(dShape, ZI, ZF, M.glassBlack, { bevel: 0.35, name: 'Ceramic Shield 2 cover glass', segs: 14, bsegs: 3 }));
  display.add(plate(rrect(W - 5.6, H - 5.6, 8.8), 2.95, ZI, M.oled, { bevel: 0.05, name: 'OLED panel' }));
  display.add(plate(rrect(W - 9, H - 30, 3, 0, -8), 2.85, 2.96, M.copper, { bevel: 0.02, name: 'Panel heat spreader' }));
  display.add(box(16, 8, 0.25, M.flex, 14, -66, 2.8, 'Display flex'), box(11, 3, 0.5, M.steelDark, 14, -62.5, 2.7, 'Display connector'));
  const screen = decal(W - 4.2, H - 4.2, wallpaperTexture(M.finish.tone), 0, 0, ZF + 0.012, { emissive: 1.0, roughness: 0.2 });
  { // round the corners of the picture with an alpha mask
    const c = document.createElement('canvas'); c.width = 512; c.height = 1100; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 512, 1100); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(0, 0, 512, 1100, 68); g.fill();
    screen.material.alphaMap = new THREE.CanvasTexture(c); screen.material.transparent = true; screen.material.alphaTest = 0;
  }
  screen.name = 'Lit display'; R.screen = screen;
  const island = plate(rrect(15.4, 4.9, 2.45, 0, 66.2), ZF + 0.05, ZF + 0.09, new THREE.MeshBasicMaterial({ color: 0x000000 }), { bevel: 0, name: 'Dynamic Island' });
  island.castShadow = false;
  display.add(screen, island, cyl(1.1, ZF + 0.09, ZF + 0.1, M.lensGlass, 4.2, 66.2, 'Front camera window'));
  phone.add(display);

  return { group: phone, refs: R };
}
