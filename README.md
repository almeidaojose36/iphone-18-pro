# Deep Teardown — inside the phone camera

Production kit for the 12-minute @deepteardown video: reviewed blueprint, narration script,
generated voiceover with captions, and the Three.js scenes synced to that voiceover.

| What | Where |
|------|-------|
| Reviewed blueprint (fact-check, titles, thumbnails, Shorts) | [`docs/blueprint.md`](docs/blueprint.md) |
| Word-for-word narration with timestamps | [`docs/narration-script.md`](docs/narration-script.md) |
| Narration source (text + `[[cue]]` markers) | `narration/script.json` |
| Voiceover, one file per chapter + one full track | `audio/*.mp3`, `audio/voiceover_full.mp3` |
| Captions for YouTube | `audio/captions.srt` |
| 3D player | `index.html`, `src/` |
| HDRI and photograph (CC0) | `assets/` |

## Watch it

```bash
node tools/serve.mjs
```

Then open http://localhost:8080 and press Play. (Any static server works, but one without HTTP Range
support, such as `python3 -m http.server`, cannot seek the narration.)

Keys: `Space` play/pause · `←` `→` 5 s · `Shift+←` `Shift+→` chapter · `C` captions · `M` mute · `H` hide controls.

URL options: `?clean` hides the control bar for screen recording, `?cc=0` hides captions, `?t=96` starts at 96 s,
`?fx=0` turns off post-processing and `?bloom=0` just the bloom, for slow machines.

## Render to video

```bash
tools/render-parallel.sh 1280 24 4
```

Arguments are width, frames per second and worker count; this writes `out/deep-teardown-720p.mp4` with the
voiceover muxed in. It renders 20-second segments in headless Chromium and joins them, and it is safe to
re-run: finished segments are kept. Use `tools/render-parallel.sh 1920 30 4` for the 1080p master.
Software rendering is slow now that the scenes use transmissive glass and bloom (roughly 0.6 s per 720p
frame across four workers); on a machine with a GPU, screen-recording the player with `?clean` is quicker.

`node tools/render.mjs` renders a single range in one process. Useful flags: `--from 55 --to 75`,
`--width 3840`, `--fps 60`, `--cc 0`, `--fx 0` (no bloom), `--noaudio`, `--shots 10,80,200` for stills.
Both need `playwright` and `ffmpeg`.

## Change the narration

Edit `narration/script.json`, then:

```bash
python3 tools/generate_voiceover.py --speed 0.88
```

Pass chapter ids (`hook prism shift photo isp stack outro`) to regenerate only those. This needs an
ElevenLabs key in `ELEVENLABS_API_KEY`. It rewrites `audio/manifest.json`, which holds every
chapter's duration, caption timings and cue times. The scenes read their cue times from that file,
so the visuals stay in step with whatever the voice does: the tetraprism beam reaches each bounce
on the spoken "one, two, three, four".

## How the scenes are built

Each file in `src/scenes/` exports `build()` and returns `{ scene, camera, labels, update(t, cues) }`.
`update` is a pure function of time, so scrubbing and offline rendering give identical frames.
`src/main.js` owns the master timeline, captions, labels and audio sync. three.js r187 and the
post-processing addons are vendored in `vendor/` so the page runs offline.

Look: every scene is lit by a studio HDRI (`assets/`, CC0) plus rim lights; lenses, the tetraprism,
sapphire windows and microlenses are `MeshPhysicalMaterial` glass (transmission, ior 1.52, thin-film
iridescence); a low-strength `UnrealBloomPass` gives beams and bounce points their glow. The helpers
(`physGlass`, `lensGeo`, `brushedMetal`, `woundCoil`, `flexureGeo`, …) live in `src/util.js`.
Asset sources are listed in [`assets/CREDITS.md`](assets/CREDITS.md).
