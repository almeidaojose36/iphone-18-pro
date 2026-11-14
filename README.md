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

## Watch it

```bash
node tools/serve.mjs
```

Then open http://localhost:8080 and press Play. (Any static server works, but one without HTTP Range
support, such as `python3 -m http.server`, cannot seek the narration.)

Keys: `Space` play/pause · `←` `→` 5 s · `Shift+←` `Shift+→` chapter · `C` captions · `M` mute · `H` hide controls.

URL options: `?clean` hides the control bar for screen recording, `?cc=0` hides captions, `?t=96` starts at 96 s.

## Render to video

```bash
node tools/render.mjs
```

Steps the timeline frame by frame in headless Chromium and writes `out/deep-teardown.mp4`
(1920×1080, 30 fps, voiceover muxed in). Needs `playwright` and `ffmpeg`. Useful flags:
`--from 55 --to 75`, `--width 3840`, `--fps 60`, `--cc 0`, `--shots 10,80,200` for stills.

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
`src/main.js` owns the master timeline, captions, labels and audio sync. three.js r187 is vendored
in `vendor/` so the page runs offline.
