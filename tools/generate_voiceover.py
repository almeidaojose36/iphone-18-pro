#!/usr/bin/env python3
"""Generate the narration with ElevenLabs and build the timing manifest.

Reads  narration/script.json  (text with [[cue]] markers)
Writes audio/<chapter>.mp3, audio/manifest.json, audio/captions.srt,
       audio/voiceover_full.mp3 and docs/narration-script.md

Usage:  ELEVENLABS_API_KEY=... python3 tools/generate_voiceover.py [chapter_id ...]
        --no-tts   rebuild manifest/captions from cached audio/.cache/*.json only
        --speed X  voice speed (0.7 - 1.2), default 1.0
"""
import base64, json, os, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
CACHE = AUDIO / ".cache"
CUE = re.compile(r"\[\[(\w+)\]\]")


def strip_cues(text):
    """Return (clean_text, {cue: char_index})."""
    out, cues, pos = [], {}, 0
    for m in CUE.finditer(text):
        out.append(text[pos:m.start()])
        cues[m.group(1)] = sum(len(s) for s in out)
        pos = m.end()
    out.append(text[pos:])
    return "".join(out), cues


def tts(script, text, prev_text, next_text, speed):
    body = {
        "text": text,
        "model_id": script["model_id"],
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0,
                           "use_speaker_boost": True, "speed": speed},
    }
    if prev_text:
        body["previous_text"] = prev_text[-600:]
    if next_text:
        body["next_text"] = next_text[:600]
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(body, f)
    url = (f"https://api.elevenlabs.io/v1/text-to-speech/{script['voice_id']}"
           "/with-timestamps?output_format=mp3_44100_128")
    res = subprocess.run(
        ["curl", "-sS", "--fail-with-body", "-X", "POST", url,
         "-H", "Content-Type: application/json",
         "-H", f"xi-api-key: {os.environ.get('ELEVENLABS_API_KEY', 'sk_dummy')}",
         "--data-binary", f"@{f.name}"],
        capture_output=True, text=True)
    os.unlink(f.name)
    if res.returncode != 0:
        sys.exit(f"ElevenLabs request failed: {res.stdout[:400]} {res.stderr[:400]}")
    return json.loads(res.stdout)


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(out.stdout.strip())


def captions(text, starts, ends, max_len=84):
    """Split into caption lines at sentence ends, then at commas if too long."""
    spans, a = [], 0
    for m in re.finditer(r"[.?!:]\s+", text):
        spans.append((a, m.start() + 1)); a = m.end()
    if a < len(text):
        spans.append((a, len(text)))
    out = []
    for a, b in spans:
        while b - a > max_len:
            cut = text.rfind(", ", a, a + max_len)
            if cut <= a + 20:
                cut = text.rfind(" ", a, a + max_len)
                if cut <= a:
                    break
                out.append((a, cut)); a = cut + 1
            else:
                out.append((a, cut + 1)); a = cut + 2
        out.append((a, b))
    return [{"start": round(starts[a], 3), "end": round(ends[b - 1], 3), "text": text[a:b]}
            for a, b in out if b > a]


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    args = sys.argv[1:]
    no_tts = "--no-tts" in args
    speed = float(args[args.index("--speed") + 1]) if "--speed" in args else 1.0
    only = [a for a in args if not a.startswith("--") and not re.fullmatch(r"[\d.]+", a)]
    script = json.loads((ROOT / "narration/script.json").read_text())
    CACHE.mkdir(parents=True, exist_ok=True)
    chapters = script["chapters"]
    clean = [strip_cues(c["text"]) for c in chapters]
    lead, tail = script["lead"], script["tail"]

    manifest = {"voice": script["voice_name"], "lead": lead, "tail": tail, "chapters": []}
    srt, md, offset, n = [], ["# Deep Teardown — narration script\n",
                              "Word-for-word voiceover. Times are from the generated audio; "
                              "`▸ cue` marks are the points the 3D scenes key off.\n"], 0.0, 1
    for i, ch in enumerate(chapters):
        text, cues = clean[i]
        cache, mp3 = CACHE / f"{ch['id']}.json", AUDIO / f"{ch['id']}.mp3"
        if not no_tts and (not only or ch["id"] in only):
            print(f"TTS {ch['id']} ({len(text)} chars)…", flush=True)
            r = tts(script, text, clean[i - 1][0] if i else "",
                    clean[i + 1][0] if i + 1 < len(chapters) else "", speed)
            mp3.write_bytes(base64.b64decode(r["audio_base64"]))
            cache.write_text(json.dumps({"text": text, "alignment": r["alignment"]}))
        if not cache.exists() or not mp3.exists():
            print(f"skip {ch['id']} (no audio yet)"); continue
        c = json.loads(cache.read_text())
        if c["text"] != text:
            sys.exit(f"{ch['id']}: script changed since audio was generated — regenerate it")
        al = c["alignment"]
        starts, ends = al["character_start_times_seconds"], al["character_end_times_seconds"]
        assert len(starts) == len(text), f"{ch['id']}: alignment length mismatch"
        dur = duration(mp3)
        total = lead + dur + tail
        cue_t = {k: round(lead + starts[min(v, len(starts) - 1)], 3) for k, v in cues.items()}
        caps = captions(text, starts, ends)
        for cp in caps:
            cp["start"] = round(cp["start"] + lead, 3); cp["end"] = round(cp["end"] + lead, 3)
            srt.append(f"{n}\n{srt_time(offset + cp['start'])} --> {srt_time(offset + cp['end'])}\n{cp['text']}\n")
            n += 1
        manifest["chapters"].append({
            "id": ch["id"], "label": ch["label"], "title": ch["title"], "file": f"audio/{mp3.name}",
            "start": round(offset, 3), "duration": round(total, 3), "audio": round(dur, 3),
            "cues": cue_t, "captions": caps})
        words = len(text.split())
        md.append(f"\n## {srt_time(offset)[3:8]} – {srt_time(offset + total)[3:8]} · "
                  f"{ch['label']}: {ch['title']}\n\n_{words} words · {dur:.0f} s spoken_\n")
        parts = CUE.split(ch["text"])  # ['', cue, text, cue, text…]
        for cue, para in zip(parts[1::2], parts[2::2]):
            md.append(f"`▸ {cue}` ({srt_time(offset + cue_t[cue])[3:8]}) {para.strip()}\n")
        print(f"{ch['id']:6s} {words:4d} words  {dur:6.1f}s  target {ch['target']}s  "
              f"({words / dur * 60:.0f} wpm)")
        offset += total
    manifest["duration"] = round(offset, 3)
    (AUDIO / "manifest.json").write_text(json.dumps(manifest, indent=1))
    (AUDIO / "captions.srt").write_text("\n".join(srt))
    md.insert(2, f"\nTotal running time **{srt_time(offset)[3:8]}** · voice: {script['voice_name']} (ElevenLabs).\n")
    (ROOT / "docs/narration-script.md").write_text("\n".join(md))
    print(f"total {offset:.1f}s = {offset / 60:.2f} min")

    if len(manifest["chapters"]) == len(chapters):  # full track, padded to match the timeline
        ins, filt = [], []
        for i, ch in enumerate(manifest["chapters"]):
            ins += ["-i", str(ROOT / ch["file"])]
            filt.append(f"[{i}:a]adelay={int(lead * 1000)}:all=1,apad=pad_dur={tail}[a{i}]")
        graph = ";".join(filt) + ";" + "".join(f"[a{i}]" for i in range(len(chapters))) + \
            f"concat=n={len(chapters)}:v=0:a=1[out]"
        subprocess.run(["ffmpeg", "-y", "-v", "error", *ins, "-filter_complex", graph, "-map", "[out]",
                        "-b:a", "160k", str(AUDIO / "voiceover_full.mp3")], check=True)
        print("wrote audio/voiceover_full.mp3", f"{duration(AUDIO / 'voiceover_full.mp3'):.1f}s")


if __name__ == "__main__":
    main()
