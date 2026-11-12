# Rendering the video locally (1080p or 4K)

Instructions for a person or an AI agent rendering **"Inside the iPhone 18 Pro"** on a machine with a
graphics card. Everything needed is in this repository: the 3D scene is code, and the narration, music
and sound effects are committed under `audio/`. No API keys are needed to render.

The output is `out/iphone-18-pro-teardown.mp4` (about 10 min 56 s, 19,700 frames at 30 fps) plus `out/captions.srt`.

## 1. Requirements

| Tool | Version | Used for |
|---|---|---|
| Node.js | 20 or newer | scene, render tools |
| ffmpeg + ffprobe | any recent, on the PATH | encoding, audio |
| Python 3 + numpy | 3.9 or newer | soundtrack mix |
| A GPU | any recent discrete or Apple-silicon GPU | 4K needs about 4 GB of video memory |

The on-screen text uses Inter (or SF Pro on a Mac). Install [Inter](https://rsms.me/inter/) if neither is present.

## 2. Install

```bash
npm install
```

```bash
npm install --no-save playwright
```

```bash
npx playwright install chromium
```

```bash
python3 -m pip install numpy
```

## 3. Check that the GPU is used

```bash
node tools/stills.mjs --gpu --width 1920 --height 1080 --times 5,163,352,542 --dir out/test
```

The first line printed is `[renderer] …`. It must name your graphics card (for example
`ANGLE (NVIDIA …)`, `ANGLE (Apple, ANGLE Metal Renderer: Apple M2 …)`).
If it says **SwiftShader**, **llvmpipe** or "software", the GPU is not in use. Try, in this order:

1. Add `--headed` (shows a browser window; the most reliable way to get the GPU).
2. Linux: `TEARDOWN_ANGLE=vulkan node tools/stills.mjs --gpu …` or `TEARDOWN_ANGLE=gl …`.
3. Use an installed Chrome: `CHROME_PATH="/path/to/chrome" node tools/stills.mjs --gpu …`.

Open the four JPEGs in `out/test` and confirm they look right (the phone with its screen lit, the
glass body with the layout labelled, heat spreading over the vapor chamber, the iris at ƒ/1.48)
before starting the long render.

## 4. Build the soundtrack

```bash
node tools/cues.mjs
```

```bash
python3 tools/mix_audio.py
```

This writes `out/audio.wav` and `out/captions.srt`.

## 5. Render the picture

1080p at 30 fps:

```bash
tools/render-all.sh
```

4K:

```bash
WIDTH=3840 HEIGHT=2160 tools/render-all.sh
```

The film is rendered in 20-second chunks to `out/chunks/`. If it is interrupted, run the same command
again: finished chunks are skipped. Delete `out/chunks` before changing any setting.

Options, all as environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `WIDTH`, `HEIGHT` | 1920, 1080 | Frame size |
| `FPS` | 30 | Frames per second |
| `SCALE` | 1 | 2 renders the 3D at twice the size and scales down (cleanest edges); 0.8 is faster |
| `QUALITY` | high | `draft` turns off ambient occlusion, bloom and multisampling |
| `CRF` | 14 | x264 quality; lower is better and larger |
| `GPU` | 1 | 0 uses software rendering |
| `HEADED` | 0 | 1 shows the browser window |
| `WORKERS` | 1 | Parallel render processes |

Without a GPU it still renders, slowly: about 1.5 s a frame at 720p on four cores, so several hours for the whole film:

```bash
GPU=0 WIDTH=1280 HEIGHT=720 FPS=24 WORKERS=3 tools/render-all.sh
```

## 6. Join picture and sound

```bash
tools/assemble.sh
```

## Troubleshooting

- **Text looks different**: the fonts are missing; install Inter.
- **A chunk failed**: the reason is in `out/chunks/wN.log`. Delete any `*.part.mp4` and run the render again.
- **Edges shimmer**: use `SCALE=2`.
- **Glow too strong or too weak**: `TEARDOWN_QUERY="&bloom=0.1" tools/render-all.sh` (default 0.16; 0 turns it off).
