// The edit: for every chapter, which inserts (real footage, 2D cards, peeks into other scenes) cut into the
// 3D scene, and which headlines / tags are on screen. All times are seconds from the chapter start and are
// written relative to narration cues (c.<cue>), so they follow the voiceover if it is regenerated.
//
// ins:  { t, d, shot }                  hero shot of our own lens / phone models (src/scenes/hook.js)
//       { t, d, card, ...args }         full-screen 2D card (see src/ui.js)
//       { t, d, peek, at }              another chapter's scene, starting at its local time `at`
// text: { t, d, head, sub, pos }        condensed headline with a drawn underline (pos: tl | bl | c)
//       { t, d, tag, sub }              small mono tag with a typed-on cursor
// road: index of this chapter on the roadmap strip (shown at the chapter start)
// every: seconds between automatic camera cuts in the 3D scene

export const ROAD = ['FOLD', 'FLOAT', 'CATCH', 'DEVELOP', 'STACK'];

export const direction = {
  hook: (c, D, all) => ({
    every: 4,
    ins: [
      // a real lens first: front on, the hero spin, the macro pass, then what is inside it
      { t: 0, d: 2.6, shot: 'front' },
      { t: 2.6, d: 2.9, shot: 'spin' },
      { t: 5.5, d: 2.1, shot: 'macro' },
      { t: 7.6, d: c.phone - 7.7, shot: 'xray' },
      { t: c.phone - 0.1, d: c.sensor - c.phone + 0.1, shot: 'side' },
      { t: c.sensor, d: c.impossible - c.sensor, card: 'sensor' },
      { t: c.impossible, d: 3.1, shot: 'both' },
      { t: c.impossible + 3.1, d: 1.4, shot: 'rear' },
      { t: c.impossible + 4.5, d: c.dark - c.impossible - 4.5, shot: 'tremble' },
      { t: c.dark, d: c.yet - c.dark, card: 'photo', mode: 'dark' },
      { t: c.yet, d: c.how - c.yet, card: 'photo', mode: 'good' },
      { t: c.how, d: c.ray - c.how, shot: 'both' },
      { t: c.ray, d: 4.5, shot: 'rear' },
      { t: c.ray + 4.5, d: 3.6, peek: 'prism', at: all.prism.b1 - 0.5 },
      { t: c.ray + 8.1, d: 3.1, peek: 'shift', at: all.shift.counter + 4 },
      { t: c.ray + 11.2, d: 3.4, peek: 'photo', at: all.photo.filters + 14 },
      { t: c.twist, d: 3.5, peek: 'stack', at: all.stack.fuse - 1 },
      { t: c.twist + 3.5, d: 5.4, card: 'photo', mode: 'calc' },
      { t: c.twist + 8.9, d: 99, card: 'title' },
    ],
    text: [
      { t: 0.8, d: 4.4, head: 'OVER A KILOGRAM', sub: 'a professional telephoto zoom', pos: 'bl' },
      { t: 8.2, d: 3.7, head: 'PACKED WITH THICK GLASS', sub: 'because optics demands it', pos: 'bl' },
      { t: c.phone + 2.6, d: 2.2, head: 'UNDER 9 MM', sub: 'the whole phone', pos: 'tl' },
      { t: c.impossible + 0.4, d: 2.6, head: 'THIS SHOULDN’T WORK', pos: 'tl' },
      { t: c.impossible + 3.2, d: 1.2, head: 'ZOOM?', pos: 'bl' },
      { t: c.impossible + 4.6, d: 1.7, head: 'HOLD STEADY?', pos: 'bl' },
      { t: c.dark + 0.5, d: c.yet - c.dark - 0.6, tag: 'ONE SHORT EXPOSURE', sub: 'OUR SIMULATION ON A REAL PHOTO' },
      { t: c.yet + 1.6, d: c.how - c.yet - 1.7, head: 'HANDHELD. NO FLASH.', pos: 'bl' },
      { t: c.how + 0.1, d: 1.2, head: 'SO, HOW?', pos: 'c' },
      { t: c.ray + 1.2, d: 3.2, head: 'FOLLOW ONE RAY OF LIGHT', pos: 'tl' },
      { t: c.ray + 4.8, d: 3.2, tag: '01 · FOLDED AROUND FOUR CORNERS' },
      { t: c.ray + 8.4, d: 2.7, tag: '02 · A CHIP THAT FLOATS ON MAGNETS' },
      { t: c.ray + 11.5, d: 3, tag: '03 · WELLS A THOUSANDTH OF A MILLIMETRE WIDE' },
      { t: c.twist + 6.6, d: 2.2, head: 'NOT TAKEN. CALCULATED.', pos: 'bl' },
    ],
  }),

  prism: (c) => ({
    road: 0, every: 6,
    ins: [
      { t: 3.7, d: 5, shot: 'rearpush' },
      { t: 16.4, d: 4.8, shot: 'spin' },
      { t: c.fold - 2.4, d: 2.6, shot: 'side' },
      { t: c.b4 + 3.2, d: 2.6, shot: 'rear' },
      { t: 70.2, d: 11.4, card: 'hallway' },
      { t: 100.8, d: 3.8, shot: 'xray' },
      { t: c.focus + 16, d: 3, shot: 'rear' },
    ],
    text: [
      { t: c.focal + 9, d: 5, head: 'MORE ZOOM = MORE DISTANCE', sub: 'light needs room to travel before it focuses', pos: 'tl' },
      { t: 16.6, d: 4.4, head: 'LENSES THE SIZE OF A FOREARM', pos: 'bl' },
      { t: c.focal + 22, d: 6, head: 'OVER 1.5 CM OF TRAVEL', sub: 'it simply doesn’t fit', pos: 'tl' },
      { t: c.fold + 4, d: 5, head: 'THE TETRAPRISM', sub: 'one slab of glass under the lens', pos: 'tl' },
      { t: c.b4 + 0.4, d: 2.7, head: 'FOUR REFLECTIONS', sub: 'two mirror coatings · two total internal reflections', pos: 'tl' },
      { t: c.hallway + 15, d: 6, head: 'SAME JOURNEY. A FRACTION OF THE SPACE.', pos: 'tl' },
      { t: 101, d: 3.4, tag: 'A BIG LENS SLIDES ITS GLASS', sub: 'NO ROOM FOR THAT IN A PHONE' },
      { t: c.focus + 9, d: 6.5, head: 'FOCUS IN MICRONS', sub: 'the sensor moves, not the glass', pos: 'tl' },
    ],
  }),

  shift: (c) => ({
    road: 1, every: 6, soft: true,
    ins: [
      { t: 3.7, d: 4.6, shot: 'tremble' },
      { t: 8.3, d: 15.6, card: 'shake', zoom: 10.6 },
      { t: c.float, d: 4, shot: 'xray' },
      { t: 42.7, d: 4.6, shot: 'rearpush' },
      { t: c.counter, d: 3.4, shot: 'tremble' },
      { t: 96.2, d: 8.4, card: 'steady' },
      { t: 108.5, d: 8.5, card: 'expose' },
    ],
    text: [
      { t: 4.1, d: 4, head: 'THE SECOND PROBLEM IS YOU', pos: 'bl' },
      { t: 19, d: 4.6, head: 'ZOOM MAGNIFIES THE SHAKE', pos: 'tl' },
      { t: 25, d: 6, head: 'A POINT OF LIGHT BECOMES A SCRIBBLE', pos: 'tl' },
      { t: c.float + 0.4, d: 3.4, tag: 'BIG LENSES MOVE A GROUP OF GLASS', sub: 'HEAVY · SLOW' },
      { t: c.float + 17, d: 6, head: 'THE SENSOR FLOATS', sub: 'springs · copper coils · magnets', pos: 'tl' },
      { t: c.counter + 0.3, d: 3, head: 'A GYROSCOPE FEELS THE TILT', pos: 'bl' },
      { t: c.counter + 5, d: 6, head: 'SENSE IT. CANCEL IT.', sub: 'the sensor follows the image', pos: 'tl' },
      { t: c.rate + 3, d: 6.5, head: 'THOUSANDS OF TIMES A SECOND', sub: 'measure · move · check · repeat', pos: 'tl' },
      { t: 96.6, d: 7.6, head: 'STABILISED vs NOT', sub: 'our simulation on a real photo', pos: 'bl' },
      { t: 109, d: 3.4, head: 'LONGER EXPOSURE = MORE LIGHT', pos: 'tl' },
    ],
  }),

  photo: (c) => ({
    road: 2, every: 6, soft: true,
    ins: [
      { t: 3.7, d: 4.4, shot: 'rearpush' },
      { t: 15.8, d: 3, card: 'hair' },
      { t: 55, d: 3, shot: 'rear' },
      { t: 74.5, d: 5, card: 'wipe', a: { mono: true }, b: {}, la: 'BRIGHTNESS ONLY', lb: 'WITH COLOUR', at: 1.4 },
      { t: 101.5, d: 6.5, card: 'photo', mode: 'dark' },
      { t: 117.5, d: 5.6, card: 'wipe', a: {}, b: { gain: 3.6 }, la: 'EXPOSED RIGHT', lb: 'BUCKETS OVERFLOWED', at: 1 },
      { t: 128.2, d: 5.6, card: 'photo', mode: 'calc' },
    ],
    text: [
      { t: c.zoom + 8, d: 6, head: 'TENS OF MILLIONS OF CELLS', sub: 'each about a micron across', pos: 'tl' },
      { t: c.wells + 6, d: 5, head: 'ONE PHOTON IN. ONE ELECTRON OUT.', pos: 'tl' },
      { t: c.wells + 14.5, d: 4, head: 'A PIXEL IS A COUNTER', pos: 'tl' },
      { t: c.filters + 2.5, d: 6, head: 'SILICON IS COLOUR-BLIND', sub: 'so every well gets a filter', pos: 'tl' },
      { t: c.green + 4, d: 6, head: 'ONE RED · ONE BLUE · TWO GREEN', sub: 'your eyes are most sensitive to green', pos: 'tl' },
      { t: c.rain + 2.5, d: 6, head: 'BUCKETS IN A RAINSTORM', sub: 'every photon is a raindrop', pos: 'tl' },
      { t: c.dark + 0.6, d: 3.6, head: 'FEW DROPS = GRAIN', pos: 'tl' },
      { t: 102, d: 5.6, tag: 'THE GRAIN IN A NIGHT PHOTO', sub: 'OUR SIMULATION ON A REAL PHOTO' },
      { t: c.overflow + 2, d: 5, head: 'FULL BUCKET = BLOWN-OUT SKY', pos: 'tl' },
      { t: 129.2, d: 4.2, head: 'MILLIONS OF NUMBERS', sub: 'that is what leaves the sensor', pos: 'bl' },
    ],
  }),

  isp: (c) => ({
    road: 3, every: 6,
    ins: [
      { t: c.mosaic, d: 8.2, card: 'wipe', a: {}, b: { gain: 0.42, noise: 0.16, mono: true, seed: 4 }, la: 'WHAT YOU EXPECT', lb: 'WHAT THE SENSOR SENDS', at: 0.5 },
      { t: 27.9, d: 3.6, peek: 'stack', at: 30 },
      { t: 55.6, d: 8, card: 'wipe', a: { mosaic: true }, b: {}, la: 'ONE COLOUR PER PIXEL', lb: 'HOLES FILLED IN', at: 2 },
      { t: 80, d: 9, card: 'wipe', a: { cast: [1.3, 1, 0.62] }, b: {}, la: 'AS THE SENSOR SAW IT', lb: 'WHITE BALANCED', at: 3 },
      { t: 108.4, d: 8.2, card: 'wipe', a: { noise: 0.2, seed: 6 }, b: {}, la: 'GRAIN', lb: 'DENOISED', at: 2.5 },
      { t: c.done + 3.2, d: 5.5, card: 'photo', mode: 'good' },
    ],
    text: [
      { t: c.raw + 3.4, d: 1.4, head: 'NOT A PHOTO. NOT EVEN CLOSE.', pos: 'tl' },
      { t: c.mosaic + 14, d: 6, head: 'TWO-THIRDS OF THE COLOUR WAS NEVER RECORDED', pos: 'tl' },
      { t: 28.3, d: 3, tag: 'THE IMAGE SIGNAL PROCESSOR', sub: 'A BLOCK OF THE PHONE’S MAIN CHIP' },
      { t: c.demosaic + 0.8, d: 5, head: 'STEP 1 · PULL THE MOSAIC APART', pos: 'tl' },
      { t: c.fill + 1, d: 6, head: 'STEP 2 · FILL THE HOLES', sub: 'demosaicing: an educated guess, edge by edge', pos: 'tl' },
      { t: c.wb + 0.6, d: 3.6, head: 'STEP 3 · WHITE BALANCE', pos: 'tl' },
      { t: c.denoise + 0.6, d: 5, head: 'STEP 4 · REMOVE THE GRAIN', sub: 'then tone, contrast and sharpening', pos: 'tl' },
      { t: c.done + 0.5, d: 2.6, head: 'NOW IT’S A PHOTOGRAPH', pos: 'tl' },
      { t: c.done + 4, d: 4.4, head: '30–60 TIMES A SECOND', sub: 'just to draw the viewfinder', pos: 'bl' },
    ],
  }),

  stack: (c) => ({
    road: 4, every: 6,
    ins: [
      { t: 3.7, d: 4.2, card: 'photo', mode: 'dark' },
      { t: 23, d: 11.2, card: 'buffer' },
      { t: c.tap + 9.8, d: 5.6, card: 'expose' },
      { t: 68, d: 8, card: 'align' },
      { t: 96.5, d: 6.6, card: 'merge' },
            { t: c.final + 0.2, d: 5, card: 'photo', mode: 'good' },
    ],
    text: [
      { t: 4.1, d: 3.7, tag: 'ONE SHORT EXPOSURE', sub: 'OUR SIMULATION ON A REAL PHOTO' },
      { t: c.problem + 12, d: 6, head: 'ONE EXPOSURE IS ALWAYS A COMPROMISE', pos: 'tl' },
      { t: 23.6, d: 6, head: 'IT’S ALREADY SHOOTING', sub: 'from the moment you open the camera', pos: 'tl' },
      { t: c.tap + 3, d: 6, head: 'YOU ONLY PICK THE MOMENT', pos: 'tl' },
      { t: c.align + 2, d: 4.6, head: 'NONE OF THEM LINE UP', pos: 'tl' },
      { t: c.fuse + 4, d: 6, head: 'THE PICTURE ADDS UP. THE NOISE CANCELS.', pos: 'tl' },
      { t: c.final + 1, d: 4, head: 'MEASURED MANY TIMES', sub: 'the best of every measurement', pos: 'bl' },
    ],
  }),

  outro: (c, D, all) => ({
    every: 4,
    ins: [
      { t: c.phone, d: 3.4, shot: 'rear' },
      { t: c.phone + 4.4, d: 2, peek: 'prism', at: all.prism.b4 + 4 },
      { t: c.phone + 6.4, d: 3, peek: 'shift', at: all.shift.rate + 4 },
      { t: c.phone + 9.4, d: 2.4, peek: 'photo', at: all.photo.rain + 6 },
      { t: c.phone + 11.8, d: c.lens - c.phone - 11.8, peek: 'stack', at: all.stack.fuse + 2 },
      { t: c.lens, d: 2.9, shot: 'spin' },
      { t: c.lens + 2.9, d: c.made - c.lens - 2.9, shot: 'xray' },
      { t: c.made, d: 3.2, shot: 'side' },
      { t: c.made + 3.2, d: c.ask - c.made - 3.2, card: 'versus' },
      { t: D - 8.2, d: 99, card: 'sources' },
    ],
    text: [
      { t: c.phone + 3.5, d: 0.9, head: 'ONE TAP', pos: 'c' },
      { t: c.phone + 4.6, d: 1.7, head: 'FOLDED FOUR TIMES', pos: 'bl' },
      { t: c.phone + 6.6, d: 2.7, head: 'STEADIED THOUSANDS OF TIMES A SECOND', pos: 'bl' },
      { t: c.phone + 9.6, d: 2.1, head: 'TENS OF MILLIONS OF BUCKETS', pos: 'bl' },
      { t: c.phone + 12, d: 4, head: 'BILLIONS OF CALCULATIONS', sub: 'in about a blink', pos: 'bl' },
      { t: c.lens + 0.4, d: 4.6, head: 'THE BIG LENS STILL WINS ON RAW LIGHT', pos: 'bl' },
    ],
  }),
};
