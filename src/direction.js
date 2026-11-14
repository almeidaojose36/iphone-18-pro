// The edit: for every chapter, which inserts (real footage, 2D cards, peeks into other scenes) cut into the
// 3D scene, and which headlines / tags are on screen. All times are seconds from the chapter start and are
// written relative to narration cues (c.<cue>), so they follow the voiceover if it is regenerated.
//
// ins:  { t, d, clip, rate }            real footage (frame sequence in assets/clips/<clip>)
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
      { t: c.phone - 0.1, d: 2.6, clip: 'side', rate: 0.72 },
      { t: c.phone + 2.5, d: c.sensor - c.phone - 2.5, clip: 'thin', rate: 0.8 },
      { t: c.sensor, d: c.impossible - c.sensor, card: 'sensor' },
      { t: c.dark, d: c.yet - c.dark, card: 'photo', mode: 'dark' },
      { t: c.yet, d: c.how - c.yet, card: 'photo', mode: 'good' },
      { t: c.how, d: c.ray - c.how, clip: 'smoke', rate: 1 },
      { t: c.ray, d: 4.5, clip: 'beam', rate: 0.55 },
      { t: c.ray + 4.5, d: 3.6, peek: 'prism', at: all.prism.b1 - 0.5 },
      { t: c.ray + 8.1, d: 3.1, peek: 'shift', at: all.shift.counter + 4 },
      { t: c.ray + 11.2, d: 3.4, peek: 'photo', at: all.photo.filters + 14 },
      { t: c.twist, d: 3.5, peek: 'stack', at: all.stack.fuse - 1 },
      { t: c.twist + 3.5, d: 5.4, card: 'photo', mode: 'calc' },
      { t: c.twist + 8.9, d: 99, card: 'title' },
    ],
    text: [
      { t: 0.9, d: 4.2, head: 'OVER A KILOGRAM', sub: 'a professional telephoto zoom', pos: 'bl' },
      { t: 5.6, d: 5.8, head: 'A FOREARM OF GLASS', sub: 'because optics demands it', pos: 'bl' },
      { t: c.phone + 2.6, d: 2.2, head: 'UNDER 9 MM', sub: 'the whole phone', pos: 'tl' },
      { t: c.impossible + 0.4, d: 2.6, head: 'THIS SHOULDN’T WORK', pos: 'tl' },
      { t: c.dark + 0.5, d: c.yet - c.dark - 0.6, tag: 'ONE SHORT EXPOSURE', sub: 'OUR SIMULATION ON A REAL PHOTO' },
      { t: c.yet + 1.6, d: c.how - c.yet - 1.7, head: 'HANDHELD. NO FLASH.', pos: 'bl' },
      { t: c.how + 0.1, d: 1.2, head: 'SO, HOW?', pos: 'c' },
      { t: c.ray + 1.2, d: 3.2, head: 'FOLLOW ONE RAY OF LIGHT', pos: 'bl' },
      { t: c.ray + 4.8, d: 3.2, tag: '01 · FOLDED AROUND FOUR CORNERS' },
      { t: c.ray + 8.4, d: 2.7, tag: '02 · A CHIP THAT FLOATS ON MAGNETS' },
      { t: c.ray + 11.5, d: 3, tag: '03 · WELLS A THOUSANDTH OF A MILLIMETRE WIDE' },
      { t: c.twist + 6.6, d: 2.2, head: 'NOT TAKEN. CALCULATED.', pos: 'bl' },
    ],
  }),

  prism: (c) => ({
    road: 0, every: 6.5,
    ins: [{ t: c.fold - 2.2, d: 2.4, clip: 'macro', rate: 0.9 }],
    text: [
      { t: c.focal + 4.5, d: 5, head: 'MORE ZOOM = MORE DISTANCE', sub: 'light needs room to travel before it focuses', pos: 'tl' },
      { t: c.focal + 22, d: 6, head: 'OVER 1.5 CM OF TRAVEL', sub: 'it simply doesn’t fit', pos: 'tl' },
      { t: c.fold + 4, d: 5, head: 'THE TETRAPRISM', sub: 'one slab of glass under the lens', pos: 'tl' },
      { t: c.b4 + 0.6, d: 4.5, head: 'FOUR REFLECTIONS', sub: 'two mirror coatings · two total internal reflections', pos: 'tl' },
      { t: c.hallway + 2.2, d: 6, head: 'A HALLWAY, FOLDED INTO A CLOSET', pos: 'tl' },
      { t: c.hallway + 17, d: 6, head: 'SAME JOURNEY. A FRACTION OF THE SPACE.', pos: 'tl' },
      { t: c.focus + 12, d: 7, head: 'FOCUS IN MICRONS', sub: 'the sensor moves, not the glass', pos: 'tl' },
    ],
  }),

  shift: (c) => ({
    road: 1, every: 6.5, soft: true,
    ins: [],
    text: [
      { t: c.shake + 4, d: 4.5, head: 'THE SECOND PROBLEM IS YOU', pos: 'tl' },
      { t: c.shake + 17, d: 6, head: 'ZOOM MAGNIFIES THE SHAKE', sub: 'a point of light becomes a scribble', pos: 'tl' },
      { t: c.float + 10.5, d: 6, head: 'THE SENSOR FLOATS', sub: 'springs · copper coils · magnets', pos: 'tl' },
      { t: c.counter + 3.5, d: 6, head: 'SENSE IT. CANCEL IT.', sub: 'the sensor follows the image', pos: 'tl' },
      { t: c.rate + 3, d: 6.5, head: 'THOUSANDS OF TIMES A SECOND', sub: 'measure · move · check · repeat', pos: 'tl' },
      { t: c.rate + 14, d: 5.5, head: 'NOISE-CANCELLING, FOR LIGHT', pos: 'tl' },
      { t: c.result + 3, d: 7, head: 'LONGER EXPOSURE = MORE LIGHT', sub: 'several times longer, without blur', pos: 'tl' },
    ],
  }),

  photo: (c) => ({
    road: 2, every: 6.5, soft: true,
    ins: [],
    text: [
      { t: c.zoom + 7, d: 6, head: 'TENS OF MILLIONS OF CELLS', sub: 'each about a micron across', pos: 'tl' },
      { t: c.wells + 6, d: 5, head: 'ONE PHOTON IN. ONE ELECTRON OUT.', pos: 'tl' },
      { t: c.wells + 14.5, d: 4, head: 'A PIXEL IS A COUNTER', pos: 'tl' },
      { t: c.filters + 2.5, d: 6, head: 'SILICON IS COLOUR-BLIND', sub: 'so every well gets a filter', pos: 'tl' },
      { t: c.green + 4, d: 6, head: 'ONE RED · ONE BLUE · TWO GREEN', sub: 'your eyes are most sensitive to green', pos: 'tl' },
      { t: c.rain + 2.5, d: 6, head: 'BUCKETS IN A RAINSTORM', sub: 'every photon is a raindrop', pos: 'tl' },
      { t: c.dark + 3, d: 6, head: 'FEW DROPS = GRAIN', sub: 'it’s luck which buckets they land in', pos: 'tl' },
      { t: c.overflow + 3, d: 6, head: 'FULL BUCKET = BLOWN-OUT SKY', pos: 'tl' },
      { t: c.readout + 3, d: 6, head: 'MILLIONS OF NUMBERS', sub: 'that is what leaves the sensor', pos: 'tl' },
    ],
  }),

  isp: (c) => ({
    road: 3, every: 7,
    ins: [
      { t: 27.9, d: 3.6, clip: 'chip', rate: 0.48 },
      { t: c.done + 3.2, d: 5.5, card: 'photo', mode: 'good' },
    ],
    text: [
      { t: c.raw + 3.4, d: 3.4, head: 'NOT A PHOTO. NOT EVEN CLOSE.', pos: 'tl' },
      { t: c.mosaic + 14, d: 6, head: 'TWO-THIRDS OF THE COLOUR WAS NEVER RECORDED', pos: 'tl' },
      { t: 28.3, d: 3, tag: 'THE IMAGE SIGNAL PROCESSOR', sub: 'A BLOCK OF THE PHONE’S MAIN CHIP' },
      { t: c.demosaic + 0.8, d: 5, head: 'STEP 1 · PULL THE MOSAIC APART', pos: 'tl' },
      { t: c.fill + 1, d: 6, head: 'STEP 2 · FILL THE HOLES', sub: 'demosaicing: an educated guess, edge by edge', pos: 'tl' },
      { t: c.wb + 2, d: 6, head: 'STEP 3 · WHITE BALANCE', sub: 'scale the channels until neutral looks neutral', pos: 'tl' },
      { t: c.denoise + 1, d: 6, head: 'STEP 4 · REMOVE THE GRAIN', sub: 'then tone, contrast and sharpening', pos: 'tl' },
      { t: c.done + 0.5, d: 2.6, head: 'NOW IT’S A PHOTOGRAPH', pos: 'tl' },
      { t: c.done + 4, d: 4.4, head: '30–60 TIMES A SECOND', sub: 'just to draw the viewfinder', pos: 'bl' },
    ],
  }),

  stack: (c) => ({
    road: 4, every: 6.5,
    ins: [
      { t: 3.7, d: 4.2, card: 'photo', mode: 'dark' },
      { t: 96.5, d: 6.6, card: 'merge' },
      { t: c.final + 0.2, d: 5, card: 'photo', mode: 'good' },
    ],
    text: [
      { t: 4.1, d: 3.7, tag: 'ONE SHORT EXPOSURE', sub: 'OUR SIMULATION ON A REAL PHOTO' },
      { t: c.problem + 12, d: 6, head: 'ONE EXPOSURE IS ALWAYS A COMPROMISE', pos: 'tl' },
      { t: c.buffer + 2.5, d: 6, head: 'IT’S ALREADY SHOOTING', sub: 'from the moment you open the camera', pos: 'tl' },
      { t: c.tap + 3, d: 6, head: 'YOU ONLY PICK THE MOMENT', pos: 'tl' },
      { t: c.align + 3, d: 6, head: 'ALIGN, PATCH BY PATCH', sub: 'what moved too much is left out', pos: 'tl' },
      { t: c.fuse + 4, d: 6, head: 'THE PICTURE ADDS UP. THE NOISE CANCELS.', pos: 'tl' },
      { t: c.final + 1, d: 4, head: 'MEASURED MANY TIMES', sub: 'the best of every measurement', pos: 'bl' },
    ],
  }),

  outro: (c, D, all) => ({
    every: 5,
    ins: [
      { t: c.phone, d: 3.4, clip: 'rear', rate: 0.36 },
      { t: c.phone + 4.4, d: 2, peek: 'prism', at: all.prism.b4 + 4 },
      { t: c.phone + 6.4, d: 3, peek: 'shift', at: all.shift.rate + 4 },
      { t: c.phone + 9.4, d: 2.4, peek: 'photo', at: all.photo.rain + 6 },
      { t: c.phone + 11.8, d: c.lens - c.phone - 11.8, peek: 'stack', at: all.stack.fuse + 2 },
      { t: c.lens, d: c.made - c.lens, peek: 'hook', at: 3 },
      { t: c.made, d: 3.2, clip: 'macro', rate: 0.68 },
      { t: c.made + 3.2, d: c.ask - c.made - 3.2, card: 'versus' },
      { t: D - 8.2, d: 99, card: 'sources' },
    ],
    text: [
      { t: c.phone + 3.5, d: 0.9, head: 'ONE TAP', pos: 'c' },
      { t: c.phone + 4.6, d: 1.7, head: 'FOLDED FOUR TIMES', pos: 'bl' },
      { t: c.phone + 6.6, d: 2.7, head: 'STEADIED THOUSANDS OF TIMES A SECOND', pos: 'bl' },
      { t: c.phone + 9.6, d: 2.1, head: 'TENS OF MILLIONS OF BUCKETS', pos: 'bl' },
      { t: c.phone + 12, d: 4, head: 'BILLIONS OF CALCULATIONS', sub: 'in about a blink', pos: 'bl' },
      { t: c.lens + 0.4, d: 4.6, head: 'THE BIG LENS STILL WINS ON RAW LIGHT', pos: 'tl' },
    ],
  }),
};
