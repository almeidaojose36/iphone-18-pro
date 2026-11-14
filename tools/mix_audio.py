#!/usr/bin/env python3
"""Mix the narration with the music beds and sound effects → audio/mix.mp3 (what the renderer muxes in)."""
import json, subprocess
from pathlib import Path
R = Path(__file__).resolve().parent.parent
m = json.loads((R / "audio/manifest.json").read_text())
ch = {c["id"]: c for c in m["chapters"]}
T = m["duration"]
beds = [("a_open", 0, ch["prism"]["start"] + 0.5), ("b_inside", ch["prism"]["start"] - 0.5, ch["photo"]["start"] + 1),
        ("c_deep", ch["photo"]["start"] - 1, ch["stack"]["start"] + 1), ("d_close", ch["stack"]["start"] - 1, T)]
sfx = [("hit", ch["hook"]["cues"]["twist"] + 8.9, 0.9), ("shutter", ch["hook"]["cues"]["yet"], 0.6),
       ("shutter", ch["stack"]["start"] + ch["stack"]["cues"]["tap"] + 1.2, 0.6)]
sfx += [("whoosh", c["start"] - 0.2, 0.4) for c in m["chapters"][1:]]
ins, f, outs = ["-i", str(R / "audio/voiceover_full.mp3")], [], ["[0:a]"]
for i, (name, a, b) in enumerate(beds, 1):
    ins += ["-i", str(R / f"audio/music/{name}.mp3")]
    d = b - a
    f.append(f"[{i}:a]atrim=0:{d},afade=t=in:d=1.5,afade=t=out:st={d - 3}:d=3,volume=0.16,adelay={int(a * 1000)}:all=1[m{i}]")
    outs.append(f"[m{i}]")
for j, (name, t, vol) in enumerate(sfx, len(beds) + 1):
    ins += ["-i", str(R / f"audio/sfx/{name}.mp3")]
    f.append(f"[{j}:a]volume={vol},adelay={int(max(0, t) * 1000)}:all=1[s{j}]")
    outs.append(f"[s{j}]")
f.append("".join(outs) + f"amix=inputs={len(outs)}:normalize=0:duration=longest,alimiter=limit=0.95[out]")
subprocess.run(["ffmpeg", "-y", "-v", "error", *ins, "-filter_complex", ";".join(f), "-map", "[out]", "-t", str(T),
                "-b:a", "192k", str(R / "audio/mix.mp3")], check=True)
print("wrote audio/mix.mp3")
