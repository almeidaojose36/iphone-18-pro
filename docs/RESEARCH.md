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

Other figures shown on screen: 48MP Main at 24 mm, 48MP Ultra Wide at 13 mm, 48MP Telephoto at 100 mm
with a tetraprism (Apple specs); C2 modem and N1 wireless chip (Apple specs).

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

## Not shown, because the sources conflict or are silent

- Battery capacities of physical-SIM models and of the Pro Max.
- Which modem the US Pro Max uses.
- The amount of memory.
