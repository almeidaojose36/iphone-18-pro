#!/bin/bash
# Generate the sound effects with ElevenLabs. Usage: tools/sfx.sh  (needs ELEVENLABS_API_KEY, or a proxy that injects it)
cd "$(dirname "$0")/.."
mkdir -p audio/sfx
gen() { # name seconds prompt
  [ -s "audio/sfx/$1.mp3" ] && return
  curl -sS -m 180 -X POST "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192" -H "Content-Type: application/json" -H "xi-api-key: ${ELEVENLABS_API_KEY:-proxy}" \
    -d "{\"text\":\"$3\",\"duration_seconds\":$2,\"prompt_influence\":0.6}" -o "audio/sfx/$1.mp3" -w "$1 %{http_code} %{size_download}\n"
}
gen whoosh 1.5 "Soft airy cinematic whoosh transition, smooth and short, no impact"
gen click 0.5 "Small precise plastic and metal latch click, dry and close"
gen lift 2 "Thin sheet metal cover panel lifting off a machine, light metallic scrape and release, subtle"
gen servo 1.8 "Soft futuristic mechanical servo movement, several small parts gliding apart smoothly, subtle sci-fi interface motion"
gen chime 1.5 "Gentle bright glassy success chime with a soft shimmer, positive and calm"
gen zap 1 "Short soft electrical energy pulse with a clean synthetic sparkle, a signal switching on, not harsh"
gen tick 0.5 "Very short soft high-tech user interface tick, a label popping in, subtle and clean"
gen riser 4 "Smooth cinematic riser, airy tonal swell building tension, ends without a hit"
gen chapter 3 "Deep soft cinematic sub boom followed by an airy tonal swell, an elegant title reveal, not aggressive"
gen impact 4 "Powerful but smooth cinematic low impact with a long warm tail, main title reveal"
gen slide 3 "Heavy metal drawer sliding smoothly on steel rails, ending with a soft solid clunk, close and clean, no reverb"
gen water 4 "Water flowing steadily through a narrow tube, soft liquid gurgle, clean close recording"
gen data 2 "Fast bright digital data stream passing by, soft glittering electronic sweep"
gen screw 0.6 "A tiny precision screw being unscrewed by a small electric screwdriver, one very short high whirr and a faint tick, dry and close"
gen shutter 0.7 "Small camera iris aperture blades snapping to a new position, a soft precise mechanical snick, dry and close, no reverb"
gen steam 3.5 "Soft gentle hiss of vapor releasing and spreading, airy and smooth, fading out, no harshness"
gen glass 2.2 "A thin glass panel being slowly peeled away from adhesive, soft suction release and a faint creak, close and clean"
gen sweep 2.5 "Smooth glassy light sweep, a bright shimmering tonal pass from left to right, elegant and airy, no impact"
