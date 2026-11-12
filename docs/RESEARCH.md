# Research notes

What the model and the narration rest on, and what is an estimate.

## Sources

| Tag | Source |
|---|---|
| **iFixit** | [Inside the Tiny Unfixable Eye: iPhone 18 Pro and Pro Max Teardown](https://www.ifixit.com/News/119329/inside-the-tiny-unfixable-eye-iphone-18-pro-and-pro-max-teardown), 20 September 2026 |
| **Apple specs** | [iPhone 18 Pro – Tech Specs](https://support.apple.com/en-us/148590) |
| **Apple newsroom** | [Apple debuts iPhone 18 Pro and iPhone 18 Pro Max](https://www.apple.com/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/), 9 September 2026 |
| **Apple films** | The product films and stills in `reference/` (layout of the cutaway renders, exterior design) |

## Facts used in the narration

| Statement | Source |
|---|---|
| 71.9 mm wide, 150.0 mm tall, 8.75 mm thick, 211 g | Apple specs |
| A20 Pro, built on a 2 nm process | Apple newsroom |
| First iPhone with a variable aperture; stops ƒ/1.48, ƒ/1.8, ƒ/2.8, ƒ/4.0 | Apple specs, iFixit |
| Rear glass opens easily; the only part in it is the wireless charging coil | iFixit |
| Display is glued; heated to about 70 °C before it released | iFixit (15 minutes at 70 °C, then 10 at 72 °C) |
| Display frame cracked or pulled away in three of four openings | iFixit |
| Front camera array lifts out without screws or glue | iFixit |
| Infrared camera now under the display, toward the upper left | iFixit (Apple does not describe this) |
| Battery 16.76 Wh (4288 mAh) in the eSIM model, in a metal tray held by thirteen screws | iFixit |
| Cell bonded with electrically released adhesive: about 90 seconds at 12 V | iFixit |
| Vapor chamber spans much of the body; three times the surface area of iPhone 17 Pro's | iFixit; Apple newsroom (the 3× is Apple's claim) |
| Liquid evaporates at the hot end, condenses at the cool end, a wick returns it | iFixit |
| Logic board is a two-board sandwich; A20 Pro on the outside | iFixit |
| Memory beside the processor rather than stacked on it; flash storage inside the sandwich | iFixit, Apple newsroom |
| Six aperture blades, each about as thin as a human hair | iFixit |
| Wide open the iris is 4.6 mm across (6.8 mm focal length ÷ 1.48); widest on an iPhone | iFixit |
| The iris is moved by magnetism | iFixit |
| The aperture is "about as close as it gets" to unrepairable; damage means replacing the camera | iFixit |
| Provisional repairability score 7 out of 10, for both Pro and Pro Max | iFixit |
| Aluminum unibody; 85% recycled aluminum in the enclosure | Apple specs, Apple newsroom |
| Ceramic Shield 2 front, Ceramic Shield back | Apple specs |
| Action button, volume buttons, side button, Camera Control | Apple specs |
| USB-C at up to 10 Gb/s | Apple specs |
| 6.3-inch OLED, 2622 × 1206 at 460 ppi, up to 120 Hz, 3000 nits peak outdoors | Apple specs |
| Smaller Dynamic Island | Apple newsroom |
| IP68: 6 meters for 30 minutes | Apple specs |
| The one display that came off cleanly: 15 minutes at 70 °C, then 10 at 72 °C | iFixit |
| "Disappointed (but not surprised)" by the front-entry design carried over from last year | iFixit |
| 18MP Center Stage front camera; dot projector stays in the central opening | Apple specs, iFixit |
| "What appears to be an infrared-pass filter" under the OLED at the infrared camera | iFixit |
| Pro Max battery 21.751 Wh (5567 mAh) | iFixit |
| Battery replaced as a tray assembly, so no adhesive step | iFixit |
| 100% recycled cobalt in the battery; 50% charge in around 15 minutes with a 60 W adapter | Apple specs |
| USB-C port is a separate part; its long flex runs up the side to the logic board, with screws, adhesive and parts in the way | iFixit |
| Up to 40% better sustained performance than the previous generation | Apple newsroom (Apple's claim) |
| "Thermal chain mail" on the A20 Pro, a spongy pad, and a conformable gap filler | iFixit |
| 6-core CPU (2 performance, 4 efficiency), 7-core GPU, dual 16-core Neural Engine | Apple specs, Apple newsroom |
| C2 modem; N1 with Wi-Fi 7, Bluetooth 6 and Thread | Apple specs |
| Qualcomm modem in the US iPhone 18 Pro Max | iFixit |
| Flash storage inside the sandwich; the boards must be separated to reach it | iFixit |
| Ultra Wide: 48MP, 13 mm, ƒ/2.2, 120° field of view | Apple specs |
| Telephoto: 48MP, 100 mm (4×), ƒ/2.8, tetraprism | Apple specs |
| LiDAR Scanner | Apple specs |
| Main sensor "a little less than a half inch diagonal"; sensor-shift stabilization | iFixit, Apple specs |
| Main camera easy to access and "painless to swap out" on both models | iFixit |
| Blades of polymer composite, with a pivot hole and a slot that a pin slides in; shown beside a 2 mm screw | iFixit |
| $249 for the iPhone 17 Pro camera assembly; the new one expected to cost more | iFixit, citing Apple Self Service Repair |
| "Skip the upgrade"; "a lot of very tiny points of potential failure for very little benefit" | iFixit |
| Credit for Apple's repair support; Repair Assistant must finish calibration of parts | iFixit |
| Parts-availability and software-pairing checks still under way | iFixit |

General background that comes from neither source, kept deliberately plain: a battery wears out before
the rest of a phone; a Taptic Engine is a weight driven by a magnet; a dot projector throws an infrared
dot pattern; LiDAR measures depth with pulses of infrared light; a tetraprism folds the light through four
reflections; a wider aperture gathers more light and blurs the background, a narrower one keeps more in focus.

## What is modelled from evidence

- **Outer size and proportions**: Apple specs.
- **Exterior**: the full-width camera plateau, three lenses in a triangle, flash, microphone and LiDAR
  window; Action button and volume buttons on the left, side button and Camera Control on the right;
  the bottom edge with two grilles, two screws and the USB-C opening; the smaller Dynamic Island. All
  from the product stills in `reference/`.
- **Layout under the display**: rear cameras and logic board at the top, an L-shaped battery in the
  middle with its notch at the lower left, Taptic Engine in the notch, speaker at the lower right, the
  A20 Pro near the top centre, and a dimpled vapor chamber under the battery reaching up to the chip.
  From Apple's cutaway renders in `reference/`.
- **Which lens is the Main camera**: the lower of the two stacked lenses, where Apple's aperture still
  shows the blades.
- **Iris geometry**: six blades on pivots around a rotor, forming a hexagonal opening whose width is
  the focal length divided by the f-number.

## What is an estimate

- Every internal dimension and position: battery outline, tray tabs, board outline, shield cans, chip
  sizes, camera module sizes, coil and magnet sizes. They are sized to fit the published outer
  dimensions and to resemble Apple's renders.
- Wall thicknesses, corner radii, the height of the camera plateau and lens rings.
- The positions of the thirteen tray screws (only their number is published).
- The order of layers through the thickness of the phone.
- The shape of the aperture blades and the form of the magnetic drive (iFixit describes the principle:
  blades with holes and slots engaging pins, moved by a magnet).
- The interior of the camera modules (lens elements, stabiliser, sensor).
- The burgundy, black, white and blue finish colours, matched by eye to Apple's stills.
- The wallpaper on the display is original artwork, not Apple's.

- The floor plan of the A20 Pro die. Apple publishes core counts only, so the die is drawn as a schematic
  and labelled as one on screen.
- The construction of the vapor chamber (two skins around a wick) and of the thermal stack: the layers
  are named by iFixit, their order and thickness here are guesses.
- The display's three layers and the position of the infrared-pass filter.
- The inside of the telephoto module and the exact path of the light through the prism.
- The Pro Max outline: 78.0 × 163.4 mm as reported by Wikipedia (Apple's page for that model was not
  checked), scaled from the Pro's shape, with its battery drawn larger by eye.
- The hair and the 2 mm screw beside the blade are to scale (0.07 mm and 2 mm).

## Not shown, because the sources conflict or are silent

- Battery capacities of physical-SIM models.
- The amount of memory.
