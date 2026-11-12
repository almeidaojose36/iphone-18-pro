// Narration script. Each beat is one voice-over clip; visuals in src/story.js are keyed to beat ids,
// so the edit follows the recorded audio. `pause` is silence after the beat in seconds (default 0.8);
// `hold` is extra silent time for an animation to play out.
// Facts are from iFixit's teardown and Apple's published specifications; see docs/RESEARCH.md.
export const TITLE = 'Inside the iPhone 18 Pro';

export const CHAPTERS = [
  { id: 'hook', title: null, beats: [
    { id: 'h1', text: 'This is the iPhone 18 Pro. Seventy-two millimeters wide, and less than nine thick.' },
    { id: 'h2', text: 'Inside it: a two nanometer chip, a vapor chamber, and the first iPhone camera with an aperture that physically opens and closes.' },
    { id: 'h3', text: 'Let\'s take it apart, layer by layer.', pause: 1.0, hold: 3.2 },
  ] },

  { id: 'in', title: 'The way in', beats: [
    { id: 'w1', text: 'The back is a panel of glass, and it comes away easily. But there is little to service behind it. Only the wireless charging coil, built into the panel itself.' },
    { id: 'w2', text: 'The real way in is through the front. The display is glued down, and has to be heated to around seventy degrees Celsius before it lets go.', hold: 1.0 },
    { id: 'w3', text: 'Almost every repair starts here, and it is risky. When iFixit opened four of these phones, the display frame cracked or pulled away on three of them.' },
    { id: 'w4', text: 'With the screen off, the whole layout is visible. Cameras and logic board at the top. Battery in the middle. Speaker, Taptic Engine and the U S B C port at the bottom.' },
    { id: 'w5', text: 'The front cameras lift straight out, with no screws and no glue. iFixit also found the infrared camera for Face ID in a new place. Under the display itself, near the top left corner.', pause: 1.0 },
  ] },

  { id: 'battery', title: 'The battery', beats: [
    { id: 'b1', text: 'The battery fills most of the phone. In this model it holds sixteen point seven six watt hours, and it sits in a metal tray.' },
    { id: 'b2', text: 'Thirteen screws hold the tray down. Remove them, and tray and cell lift out as one piece.', hold: 1.2 },
    { id: 'b3', text: 'The cell is bonded to the tray with an adhesive that releases when a current runs through it. Twelve volts, for about ninety seconds.', pause: 1.0, hold: 0.8 },
  ] },

  { id: 'cool', title: 'Staying cool', beats: [
    { id: 'c1', text: 'Underneath lies the vapor chamber. A thin, sealed plate that spans much of the body. Apple says it has three times the surface area of last year\'s.' },
    { id: 'c2', text: 'Inside, a little liquid evaporates where the chip is hot. The vapor spreads out, condenses where the plate is cooler, and a wick draws the liquid back.', hold: 1.0 },
    { id: 'c3', text: 'The heat comes from here. The logic board is two boards, stacked like a sandwich. The A twenty Pro sits on the outside, pressed toward the vapor chamber.' },
    { id: 'c4', text: 'And the memory has moved. Last year it was stacked on top of the processor. Now it sits beside it. The flash storage is inside the sandwich.', pause: 1.0, hold: 0.6 },
  ] },

  { id: 'eye', title: 'The eye', beats: [
    { id: 'e1', text: 'Then the cameras. Three of them lift out as modules, and the main one is new.' },
    { id: 'e2', text: 'In front of its lens sit six blades, each about as thin as a human hair. Together, they form an iris.' },
    { id: 'e3', text: 'Wide open, at f one point four eight, the opening is four point six millimeters across. iFixit calls it the widest aperture on an iPhone camera, ever.' },
    { id: 'e3b', text: 'Then it steps down. One point eight. Two point eight. Four.', pause: 1.0, hold: 1.0 },
    { id: 'e4', text: 'The blades are moved by magnetism. Hold a magnet close, and the iris opens and closes.', hold: 1.0 },
    { id: 'e5', text: 'It is remarkable engineering. It is also, in iFixit\'s words, about as close as it gets to unrepairable. If it is damaged, the whole camera is replaced.', pause: 1.0 },
  ] },

  { id: 'verdict', title: 'The verdict', beats: [
    { id: 'v1', text: 'So how repairable is it? iFixit gives the iPhone 18 Pro a provisional seven out of ten.' },
    { id: 'v2', text: 'The screwed in battery tray and the removable cameras earn real credit. Having to go in through the screen takes it away.', hold: 0.6 },
    { id: 'v3', text: 'Less than nine millimeters thick. And all of this inside.', pause: 1.0, hold: 2.0 },
  ] },
];
