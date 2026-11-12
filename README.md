# iPhone 18 Pro teardown

A procedural 3D teardown animation of the iPhone 18 Pro, built with three.js. The whole model is
code: there are no imported meshes. The animation runs in a browser and renders frame by frame to video.

The current edit is a narrated deep teardown of about eleven minutes, *Inside the iPhone 18 Pro*, in ten
chapters. It goes in the order a repair does: the outside and its seal → the rear glass and charging coil,
then the glued display → the display's layers and the Face ID parts → the screwed-in battery tray → the
speaker, Taptic Engine and USB-C port → the vapor chamber, its skins and wick → the logic board sandwich,
the thermal stack and the A20 Pro die → the three rear cameras and the folded telephoto → the six-blade
variable aperture → the repairability verdict.

Two things were combined to make it:

- **Model quality** follows the IBM z16 teardown project: physically based materials, bevelled edges,
  ambient occlusion, every part a named node, and a picture that is keyed to the narration.
- **Motion graphics** follow the product films in `reference/`: a black void, the phone floating flat,
  a glass "x-ray" body with bright edges, bands of light passing through it, centred lines of text whose
  words light up one after another, heat blooming across the vapor chamber, and macro shots of the iris.

The picture is keyed to the narration: each sentence is one "beat" in `content/script.js`, the recorded
length of each beat is in `content/timing.js`, and every move in `src/story.js` refers to beat ids.
Change the script, re-record, and the edit follows.

## Run it

Needs Node.js 20 or newer.

```bash
npm install
```

```bash
npm start
```

Then open <http://localhost:8080>. The bar at the bottom plays, pauses and scrubs. **Free camera** lets
you orbit at any moment. **Export .glb** saves the model as it stands at the current time. `?t=542` in
the address opens paused at that second, and `?finish=black` (or `white`, `blue`, `burgundy`) changes the colour.

## Make the video

**Rendering on your own machine? Follow [docs/RENDERING.md](docs/RENDERING.md).** The outline below is the short version.

Needs `ffmpeg`, Python 3 with numpy, and Playwright's Chromium:

```bash
npm install --no-save playwright
```

```bash
npx playwright install chromium
```

The steps, in order. The audio files are already in `audio/`, so steps 1 and 2 are only needed after
changing the script, voice, music or effects.

1. **Narration** (ElevenLabs, needs `ELEVENLABS_API_KEY`). Re-records only the beats whose text changed,
   then rewrites `content/timing.js`:

   ```bash
   node tools/voice.mjs
   ```

2. **Music and effects** (ElevenLabs). Each file is skipped if it already exists; delete one to regenerate it:

   ```bash
   tools/music.sh && tools/sfx.sh
   ```

3. **Soundtrack**. Mixes narration, music (ducked under the voice) and effects into `out/audio.wav`,
   and writes `out/captions.srt`:

   ```bash
   node tools/cues.mjs && python3 tools/mix_audio.py
   ```

4. **Picture**. Renders in 20-second chunks to `out/chunks/` and can be stopped and re-run:

   ```bash
   tools/render-all.sh
   ```

   ```bash
   WIDTH=3840 HEIGHT=2160 tools/render-all.sh
   ```

   The first is 1080p at 30 fps on the GPU, the second 4K.

5. **Join**:

   ```bash
   tools/assemble.sh
   ```

`node tools/review.mjs` writes one labelled frame per narration beat to `out/review/`, and
`tools/sheet.sh out/review` tiles them into contact sheets: the quickest way to check an edit.
`node tools/render-video.mjs --from 507 --to 604` renders any part (here, the chapter on the iris).

Other tools:

- `node tools/stills.mjs --times 5,163,352,542` writes JPEG stills to `out/stills/`.
- `node tools/view.mjs --views "back:2:0.6,-2,-1.6:0,0,0.1"` renders the model from any camera, without text.
- `node tools/export-glb.mjs --t 5` writes `out/iphone-18-pro.glb` for Blender. Every part is a named node.

## Where things are

| File | What it holds |
|---|---|
| `content/script.js` | The narration, one beat per sentence or two |
| `content/timing.js` | Beat start times and lengths, generated from the recorded audio |
| `src/story.js` | The edit: every move, camera shot, label, number and sound cue, keyed to beat ids |
| `src/model/phone.js` | The phone: unibody, rear glass and coil, display, battery tray, vapor chamber, logic board, cameras, iris |
| `src/fx.js` | Motion-graphics effects: glass look and light sweep, heat map, vapour and liquid particles |
| `src/kit.js` | Shapes, geometry helpers, materials, canvas textures |
| `src/timeline.js` | Deterministic timeline and shot camera |
| `index.html` | The stage and the styles of the on-screen text |
| `audio/` | Narration clips, four music beds and sound effects |
| `reference/` | Apple's product films and stills, used to study the look and the motion |
| `docs/RESEARCH.md` | Hardware facts with sources, and what in the model is an estimate |

## Accuracy

Outer dimensions, finishes, camera specifications and chip names follow Apple's published specifications.
The order of disassembly and what was found inside follow iFixit's teardown. The position and size of
internal parts are estimates from Apple's cutaway renders, because neither source publishes mechanical
drawings. `docs/RESEARCH.md` lists which is which.

This is an independent educational model. It is not affiliated with or endorsed by Apple or iFixit.
iPhone, Ceramic Shield, MagSafe, Dynamic Island and Taptic Engine are trademarks of Apple Inc. The files
in `reference/` are Apple's and a reviewer's material, kept for study only; none of it appears in the video.
