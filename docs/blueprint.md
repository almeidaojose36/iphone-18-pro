# Deep Teardown (@deepteardown) — iPhone camera video blueprint, v2

Reviewed and tightened version of the original 12-minute blueprint. The narration in
[`narration-script.md`](narration-script.md) and the 3D scenes in `src/scenes/` follow this version.

## What changed from v1, and why

| # | v1 said | Problem | v2 |
|---|---------|---------|----|
| 1 | Phone is "less than 8 mm thick"; title and thumbnail say `8 mm` | Recent Pro iPhones are thicker than 8 mm (16 Pro: 8.25 mm, 17 Pro: 8.75 mm), and the camera plateau adds more. I could not find a published thickness for the 18 Pro. A wrong headline number is the first thing commenters will correct. | "Under 9 mm" in narration and on screen. **Check Apple's spec page for the 18 Pro before locking the title/thumbnail number.** |
| 2 | "Bouncing light inside an 8 mm prism" | The prism is not 8 mm; that is (roughly) the phone. | Analogy kept (hallway folded into a closet), number dropped. |
| 3 | Voice-coil motors slide **lens elements** to focus the telephoto | On the tetraprism telephoto Apple moves the **sensor** for both focus and stabilisation ("autofocus 3D sensor-shift"). Lens-moving voice coils are the main camera. | Chapter 1 ends with the sensor moving in micron steps to focus. This also sets up Chapter 2. |
| 4 | Sensor "stays dead-still in world space" | Hand shake is mostly rotation, so the image slides across the sensor; the sensor has to **follow the image**, not stand still. | Narration: "the coils shove the sensor so that it follows the image". The visual still reads as "body shakes, sensor holds". |
| 5 | Four bounces, no detail | Worth one line of real physics: the two slanted faces are mirror-coated, the top and bottom bounces are total internal reflection. | Called out on bounces 1 and 2. |
| 6 | "Too few drops = dark noise" | The grain is shot noise (randomness of photon arrival), not darkness itself. | "It's down to luck which buckets they land in… that randomness is the grain." |
| 7 | Night shots come from the pre-tap buffer | The rolling zero-shutter-lag buffer is real, but in very dark scenes the phone keeps collecting **after** the tap for a second or more. Presenting night mode as instant is wrong. | Buffer first, then "adds a longer exposure… in very dark scenes it keeps collecting for a second or more". |
| 8 | "The Neural Engine aligns every frame" | Alignment and merging are shared between the ISP, GPU and neural engine; the ML part is deciding which frame to trust per pixel. | "The chip aligns them… machine learning models, running on the neural engine, decide pixel by pixel which frame to trust." |
| 9 | Stacking has no "why" | The payoff is easy to state: signal is the same every frame, noise is random, so averaging N frames cuts noise by √N. | "Nine frames, about a third of the noise." |
| 10 | "All in less time than it takes to blink" | Capture is that fast; fusion often is not. | "In about the time it takes you to blink." |
| 11 | Title B: "…in 1/1000th of a Second?" | The whole pipeline does not run in a millisecond; only a daylight exposure does. | Reworded below. |
| 12 | Thumbnail C text `FAKE PHYSICS?` | Reads as "phone photos are fake", which the video argues against, and invites the wrong comments. | `CHEATING PHYSICS?` |
| 13 | Hook: "hold up a professional camera lens" | Needs a host on camera; the rest of the video is 3D. | Opens on a 3D cut-away telephoto barrel instead. |
| 14 | Running time | v1 beats at a natural pace came out short in some chapters and long in others. | Script is written to the timings below; generated audio runs **12:25**. |

Simplifications the script makes on purpose (fine for this audience, good pinned-comment material):

- Current iPhone sensors use a **quad-Bayer** layout (2×2 groups of the same colour, binned in low light). The video shows a plain RGGB grid.
- White balance is shown after demosaicing; real pipelines usually apply gains before or during it.
- The stabilisation visual moves the phone side to side; real shake is mostly tilt.
- The iPhone 18 Pro's variable aperture on the main camera is not covered. It would make a strong Short or a line in Chapter 3 ("how wide the tap is open").

Rights note: the repo holds Apple marketing clips and a third-party review video. Using those in a monetised upload carries copyright risk; the 3D scenes here use no Apple imagery. The studio HDRI and the night-street photograph are CC0 from Poly Haven (see `assets/CREDITS.md`).

Source check for rows 3 and 5: Yole Group's teardown comparison of the iPhone 15 Pro Max describes the telephoto as a 4-bounce glass tetraprism with an XYZ sensor-shift voice coil motor, which matches the script. Apple has not published the internals of the 18 Pro module, so treat the 18 Pro as assumed to follow the same design.

## Packaging: titles and thumbnails

**A — Impossible geometry (recommended)**

- Title: `How a Phone Fits a Telephoto Lens Into 9 Millimeters`
- Thumbnail: dark studio 3D cut-away of a phone camera bump, a translucent wireframe DSLR telephoto behind it for scale, a glowing cyan beam bouncing four times inside a folded glass prism. Text: `9 mm THIN` (confirm the number).

**B — Journey of one photon**

- Title: `What Happens Inside Your Phone Camera Before You See the Photo?`
- Thumbnail: extreme macro of golden rays striking a checkerboard of red, green and blue microlenses, electron sparks dropping into silicon wells. Text: `1 PHOTON`.

**C — Physics vs. computation**

- Title: `Why Phone Cameras Shouldn't Work (And How Silicon Fixes It)`
- Thumbnail: split screen. Left: a tiny lens casting a noisy, dark raw frame. Right: nine translucent frames stacking over a glowing chip into a sharp night city shot. Text: `CHEATING PHYSICS?`

## Outline (timings from the generated narration)

| Time | Section | Beat | 3D scene |
|------|---------|------|----------|
| 00:00 – 00:54 | Hook: The Physics Problem | Telephoto barrel vs. a phone under 9 mm. It shouldn't zoom, hold steady or see in the dark. Follow one ray. | `hook.js`: cut-away barrel, phone edge-on, ray enters the lens |
| 00:54 – 02:53 | 1 · Folding Light Around a Corner | Focal length needs distance; the straight path doesn't fit; the tetraprism folds it with four reflections; hallway-in-a-closet; the sensor moves to focus. | `prism.js`: straight path pokes out of the chassis, prism fades in, beam hits each bounce on the spoken count, unfolded path, focus hunt |
| 02:53 – 04:56 | 2 · The Floating Sensor | Tremor smears a point into a scribble; move the lightest part; coils, magnets, springs; closed loop thousands of times a second; payoff is exposure time. | `shift.js`: shaking housing, light trail on the sensor, lens lifts away, trail collapses to a dot when stabilisation engages |
| 04:56 – 07:11 | 3 · Catching Photons in Silicon Buckets | Micron-scale wells; photon in, electron held; colour filters and microlenses; why two greens; buckets in rain; grain; clipping; readout. | `photodiodes.js`: dive to the surface, wells fill, filters and lenses drop in, RGGB block, sparse rain, overflow, row readout |
| 07:11 – 09:29 | 4 · Why the Raw Image Looks Terrible | The raw frame; two thirds of colour missing; demosaic; white balance; denoise; tone. | `isp.js`: grey mosaic, tinted, split into three sheets, gaps filled, merged, colour cast removed, noise removed |
| 09:29 – 11:35 | 5 · How Silicon Cheats Darkness | One exposure is a compromise; rolling buffer; tap picks the moment; align; fuse (√N); best of every measurement. | `stack.js`: single noisy frame, conveyor of frames, flash, stack, frames snap into alignment, compress into the clean photo |
| 11:35 – 12:25 | Outro | Pull back out through wells, prism, phone; recap; ask what to tear down next. | reverse passes of `photodiodes.js`, `prism.js`, `hook.js` |

## Companion Shorts

1. **"How an iPhone Zooms Without a Long Lens"** — the four-count bounce (`?t=96` to `?t=122` in the player).
2. **"Why Your Hand Shake Doesn't Blur Photos"** — trail collapsing to a dot (`?t=236` to `?t=262`).
3. **"Why Phone Cameras Have Twice as Many Green Pixels"** — RGGB block close-up (`?t=360` to `?t=380`).
4. New: **"Your Phone Takes the Photo Before You Tap"** — the rolling buffer and flash (`?t=589` to `?t=615`). This is the most surprising fact in the video and the best funnel of the four.
