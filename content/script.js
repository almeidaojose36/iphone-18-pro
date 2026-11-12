// Narration script. Each beat is one voice-over clip; visuals in src/story.js are keyed to beat ids,
// so the edit follows the recorded audio. `pause` is silence after the beat in seconds (default 0.8);
// `hold` is extra silent time for an animation to play out.
// Facts are from iFixit's teardown and Apple's published specifications; see docs/RESEARCH.md.
export const TITLE = 'Inside the iPhone 18 Pro';

export const CHAPTERS = [
  { id: 'hook', title: null, beats: [
    { id: 'h1', text: 'This is the iPhone 18 Pro. Seventy-two millimeters wide, and less than nine thick.' },
    { id: 'h2', text: 'Inside it: a two nanometer chip, a vapor chamber, and the first iPhone camera with an aperture that physically opens and closes.' },
    { id: 'h2b', text: 'Some of those parts lift out as modules. But inside the main camera, six tiny moving blades are built into a single assembly.' },
    { id: 'h3', text: 'So let\'s take it apart, layer by layer, and find out why.', pause: 1.0, hold: 3.4 },
  ] },

  { id: 'outside', title: 'The outside', beats: [
    { id: 'o1', text: 'Start with what you can touch. The body is a single piece of aluminum, a unibody. Apple says eighty-five percent of that aluminum is recycled.' },
    { id: 'o2', text: 'The front is a glass Apple calls Ceramic Shield two. The back has a Ceramic Shield panel of its own, set into the metal, below the camera plateau.' },
    { id: 'o3', text: 'On the left side, the Action button, and two volume buttons. On the right, the side button, and Camera Control.' },
    { id: 'o4', text: 'At the bottom, two grilles for the speaker and the microphone, two tiny screws, and a U S B C port that moves data at up to ten gigabits per second.' },
    { id: 'o5', text: 'The display measures six point three inches, refreshes up to a hundred and twenty times a second, and can reach three thousand nits outdoors. At the top, the Dynamic Island is smaller this year.' },
    { id: 'o6', text: 'And the whole phone is sealed. It is rated to survive six meters of water, for thirty minutes. That seal is the first thing any repair has to get past.', pause: 1.0 },
  ] },

  { id: 'in', title: 'The way in', beats: [
    { id: 'w1', text: 'The back is a panel of glass, and it comes away easily. But there is little to service behind it. Only the wireless charging coil, built into the panel itself.' },
    { id: 'w2', text: 'The real way in is through the front. The display is glued down, and has to be heated to around seventy degrees Celsius before it lets go.', hold: 1.0 },
    { id: 'w2b', text: 'Heat softens the adhesive around the edge. The display has to lift evenly, or the glass and its frame can start to separate.' },
    { id: 'w3', text: 'Almost every repair starts here. If the adhesive is still holding in one spot, lifting the screen can bend or crack its frame.' },
    { id: 'w3b', text: 'Apple used the same front-entry layout last year. The back panel opens separately, but the display is still the route to the main components.' },
    { id: 'w4', text: 'With the screen off, the whole layout is visible. Cameras and logic board at the top. Battery in the middle. Speaker, Taptic Engine and the U S B C port at the bottom.', pause: 1.0 },
  ] },

  { id: 'display', title: 'Display and Face ID', beats: [
    { id: 'd1', text: 'Before going deeper, look at the display itself. A cover of glass on top. Beneath it, the O LED panel, the layer that actually makes the light. And behind that, a thin sheet that spreads heat.', hold: 0.6 },
    { id: 'd2', text: 'At the top of the phone sits the front camera array. It disconnects, and lifts straight out, with no screws and no glue.' },
    { id: 'd3', text: 'It holds the eighteen megapixel selfie camera, and the dot projector, which throws a pattern of invisible infrared dots onto your face.', hold: 0.8 },
    { id: 'd4', text: 'The camera that reads those dots has moved. It now sits beneath the display, near the top left corner, and looks out through the screen.' },
    { id: 'd5', text: 'Under the panel, at that spot, is what appears to be a filter that lets infrared light pass. So the sensor can see through the display, and you cannot see the sensor.', pause: 1.0 },
  ] },

  { id: 'battery', title: 'The battery', beats: [
    { id: 'b1', text: 'The battery fills most of the phone. In this model it holds sixteen point seven six watt hours, and it sits in a metal tray.' },
    { id: 'b1b', text: 'The larger Pro Max holds more. Twenty-one point seven five watt hours.' },
    { id: 'b2', text: 'Thirteen screws hold the tray down. Remove them, and tray and cell lift out as one piece.', hold: 1.2 },
    { id: 'b2b', text: 'That matters. A battery wears out long before the rest of a phone does. And here, it comes out with a screwdriver.' },
    { id: 'b3', text: 'The cell is bonded to the tray with an adhesive that releases when a current runs through it. Twelve volts, for about ninety seconds.', hold: 0.8 },
    { id: 'b3b', text: 'But most repairs will never need that. A replacement comes as tray and cell together, so there is no adhesive to deal with at all.' },
    { id: 'b4', text: 'Apple says the cobalt in this battery is one hundred percent recycled. And with a sixty watt charger, it reaches half full in around fifteen minutes.', pause: 1.0 },
  ] },

  { id: 'bottom', title: 'The bottom end', beats: [
    { id: 'p1', text: 'Below the battery are three parts that do physical work. The speaker, in its sealed box. And the Taptic Engine, a weight driven back and forth by a magnet, which makes every tap you feel.' },
    { id: 'p2', text: 'Then the U S B C port. It is a separate part, which is good news, because ports wear out.' },
    { id: 'p3', text: 'But its cable is long. It runs all the way up the side of the phone to the logic board, with screws, adhesive, and other parts in the way.', pause: 1.0 },
  ] },

  { id: 'cool', title: 'Staying cool', beats: [
    { id: 'c1', text: 'Underneath lies the vapor chamber. A thin, sealed plate that spans much of the body. Apple says it has three times the surface area of last year\'s.' },
    { id: 'c1b', text: 'It is built like a very flat sandwich. Two metal skins, sealed around the edge, with a fine wick between them.', hold: 0.8 },
    { id: 'c2', text: 'Inside, a little liquid evaporates where the chip is hot. The vapor spreads out, condenses where the plate is cooler, and the wick draws the liquid back.', hold: 1.0 },
    { id: 'c2b', text: 'Nothing in it is powered. No pump, and no fan. The heat itself moves the liquid.' },
    { id: 'c2c', text: 'From there, the heat passes into the aluminum body. Apple claims up to forty percent better sustained performance than the generation before.', pause: 1.0 },
  ] },

  { id: 'brain', title: 'The brain', beats: [
    { id: 'c3', text: 'The heat comes from here. The logic board is two boards, stacked like a sandwich. The A twenty Pro sits on the outside, pressed toward the vapor chamber.' },
    { id: 'c3b', text: 'Between the chip and the chamber sit three layers: a fine metal mesh, a compressible pad, and a filler that conforms to the gap.', hold: 0.6 },
    { id: 'c4', text: 'And the memory has moved. Last year it was stacked on top of the processor. Now it sits beside it, out of the path of the heat.' },
    { id: 'c5', text: 'Inside the package is the processor itself. Six processor cores, two fast, and four efficient. Seven graphics cores. And two sixteen core neural engines.', hold: 0.6 },
    { id: 'c5b', text: 'All of it is built on a two nanometer process.' },
    { id: 'c6', text: 'The second board carries the radios. Apple\'s own C 2 modem for cellular. And the N 1 chip, for Wi-Fi seven, Bluetooth six, and Thread.' },
    { id: 'c6b', text: 'The U.S. version of the larger Pro Max uses a Qualcomm modem. The one shown here is the smaller Pro, with Apple\'s C 2.' },
    { id: 'c7', text: 'And the flash storage sits inside the sandwich. To reach it, the two boards have to be separated.', pause: 1.0, hold: 0.6 },
  ] },

  { id: 'cameras', title: 'Three cameras', beats: [
    { id: 'e1', text: 'Then the cameras. Three of them lift out as modules.' },
    { id: 'k2', text: 'The ultra wide. Forty-eight megapixels, with a field of view of a hundred and twenty degrees.' },
    { id: 'k3', text: 'The telephoto, also forty-eight megapixels. Its lens would be too long to fit in a phone this thin. So the light is folded, bouncing four times inside a prism before it reaches the sensor.', hold: 0.8 },
    { id: 'k4', text: 'That gives four times optical zoom, the equivalent of a hundred millimeter lens.' },
    { id: 'k5', text: 'Beside them sit the flash, and the LiDAR scanner, which measures depth with pulses of infrared light.' },
    { id: 'k6', text: 'And the main camera. Forty-eight megapixels, on a sensor a little under half an inch across. The sensor shifts to steady the image, and the whole camera lifts out as a module.', pause: 1.0 },
  ] },

  { id: 'eye', title: 'The eye', beats: [
    { id: 'e2', text: 'But the main camera has something new. In front of its lens sit six blades, each about as thin as a human hair. Together, they form an iris.' },
    { id: 'e2b', text: 'Each blade is a sliver of polymer composite. It has a round hole to pivot on, and a slot, where a pin slides to swing it in and out.', hold: 0.6 },
    { id: 'e2c', text: 'Next to one, a two millimeter screw looks enormous.' },
    { id: 'e3', text: 'Wide open, at f one point four eight, the opening is about four point six millimeters across. Watch how that circle changes as the blades turn.' },
    { id: 'e3b', text: 'Then it steps down. One point eight. Two point eight. Four.', pause: 1.0, hold: 1.0 },
    { id: 'e3c', text: 'A wide aperture lets in more light, and blurs the background. A narrow one keeps more of the scene sharp. Until now, an iPhone made that choice in software.' },
    { id: 'e4', text: 'The blades are moved by magnetism. Hold a magnet close, and the iris opens and closes.', hold: 1.0 },
    { id: 'e5', text: 'The iris is built into the camera assembly. If a blade is damaged, the repair is to replace the whole camera module.' },
    { id: 'e5b', text: 'For comparison, Apple listed the camera assembly for the iPhone seventeen Pro at two hundred and forty-nine dollars through Self Service Repair.' },
    { id: 'e5c', text: 'That gives you real control over how much of a shot stays in focus. It also puts a moving mechanism inside a camera you service as one piece.', pause: 1.0 },
  ] },

  { id: 'verdict', title: 'The verdict', beats: [
    { id: 'v1', text: 'How much work does a repair take? It depends on the part, and on what you have to remove to reach it.' },
    { id: 'v2', text: 'The battery tray is held by screws, and the cameras come out as modules. Reaching those parts means lifting the glued display first.', hold: 0.6 },
    { id: 'v2b', text: 'Apple provides repair support, including Repair Assistant, which calibrates supported replacement parts after installation.' },
    { id: 'v2c', text: 'So there are two things to consider before a repair: how you get to the part, and whether a replacement is available for your model.' },
    { id: 'v3', text: 'Less than nine millimeters thick. And all of this inside.', pause: 1.0, hold: 2.0 },
  ] },
];
