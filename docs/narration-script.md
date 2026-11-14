# Deep Teardown — narration script

Word-for-word voiceover. Times are from the generated audio; `▸ cue` marks are the points the 3D scenes key off.


Total running time **12:24** · voice: Inside the Machine Narrator (ElevenLabs).


## 00:00 – 00:53 · Hook: The Physics Problem

_133 words · 52 s spoken_

`▸ start` (00:00) This is a professional telephoto lens. It's long, it's heavy, and it's packed with thick glass, because that's what the laws of optics demand.

`▸ phone` (00:10) And this is a phone. It's less than nine millimetres thick.

`▸ impossible` (00:15) By the rules that shaped that big lens, a camera this thin shouldn't be able to zoom, shouldn't hold steady in your hand, and definitely shouldn't see in the dark. And yet it does all three.

`▸ ray` (00:28) So today, we're going to follow a single ray of light. It leaves a streetlamp, slips through a sapphire window, gets folded around corners inside a block of glass, lands on a chip of silicon that floats on magnets, and comes out the other side as a finished photo. The whole trip takes a fraction of a second. Let's slow it down.


## 00:53 – 02:52 · Chapter 1: Folding Light Around a Corner

_278 words · 117 s spoken_

`▸ focal` (00:54) Start with the problem. To magnify a distant subject, a lens needs a long focal length. Put simply, the light needs room to travel after it passes through the glass, before it comes into focus. More zoom, more distance. That's why sports photographers carry lenses the size of a forearm. A phone's telephoto camera needs more than a centimetre and a half of travel. Stack that on top of the lens and the sensor, and it simply doesn't fit inside the phone.

`▸ fold` (01:26) So engineers stopped trying to go deep, and went sideways instead. Beneath the lens sits a single slab of glass, called a tetraprism.

`▸ bounce` (01:36) Watch the ray. It drops in through the top, and hits an angled, mirror-coated face.

`▸ b1` (01:43) One. It shoots across and glances off the top surface, where it's trapped by total internal reflection.

`▸ b2` (01:50) Two. Off the bottom.

`▸ b3` (01:52) Three. Off a second angled mirror.

`▸ b4` (01:56) Four. Only then does it drop out of the glass, and onto the sensor.

`▸ hallway` (02:01) Think of it like this. You need a runner to cover a long hallway, but all you have is a closet. So you line the closet with mirrors, and let the runner zigzag from wall to wall, until they've covered the full distance. Same journey, a fraction of the space. The light has no idea it was folded. It arrives having travelled much farther than the phone is thick.

`▸ focus` (02:28) One more trick. To focus, something has to move, and in a camera this cramped, there's no room to slide heavy glass back and forth. So the sensor itself moves, nudged by tiny electromagnets, in steps measured in microns, thousandths of a millimetre, until the image snaps sharp.


## 02:52 – 04:55 · Chapter 2: The Floating Sensor

_279 words · 121 s spoken_

`▸ shake` (02:53) Now there's a second problem, and it's you. Your hands are never perfectly still. Your pulse, your breathing, the press of your thumb, all of it makes the phone tremble by tiny fractions of a degree. On a wide shot, you'd never notice. But zoom in, and that tremble is magnified along with everything else. During the exposure, the image smears across the sensor, and a point of light becomes a scribble.

`▸ float` (03:24) Big cameras fix this by moving a group of lens elements. Early phone cameras did the same thing. But glass is heavy, and heavy things are slow to move. So here, the lens stays put, and the lightest part moves instead: the sensor. The silicon chip isn't bolted down. It hangs on fine springs, surrounded by copper coils and small permanent magnets. Run a current through a coil, and it pushes against its magnet, sliding the sensor sideways, or up and down.

`▸ counter` (03:59) A gyroscope feels the phone tilt one way. Before the blur can form, the coils shove the sensor so that it follows the image exactly. The body shakes. The picture, as far as the sensor is concerned, never moves.

`▸ rate` (04:15) And this isn't one correction. It's a loop: measure, move, check the position, and do it again, thousands of times every second, far faster than any tremor in your hand. It's the same idea as noise-cancelling headphones: sense the disturbance, and produce its exact opposite.

`▸ result` (04:37) The payoff is time. With the image pinned in place, the shutter can stay open several times longer without blur, and a longer exposure means more light. And as we're about to see, for a sensor this small, light is everything.


## 04:55 – 07:11 · Chapter 3: Catching Photons in Silicon Buckets

_330 words · 133 s spoken_

`▸ zoom` (04:56) Let's go closer. Much closer. The surface of the sensor looks like a mirror, but zoom in a few thousand times, and it turns into a city grid: tens of millions of identical cells, each about a micron across. A human hair would cover dozens of them.

`▸ wells` (05:14) Each cell is a photodiode, a tiny well of silicon. When a particle of light, a photon, strikes the silicon, it knocks an electron loose, and the well holds on to it. More photons, more electrons. That's all a pixel is: a counter.

`▸ filters` (05:33) But there's a catch. Silicon can count light, but it can't tell what colour it was. A red photon and a blue photon leave the same electron behind. So every well gets a filter on top, red, green, or blue, that only lets its own colour through. And above that, a tiny dome of a lens, that funnels light down into the well instead of letting it spill onto the wiring.

`▸ green` (06:00) Look at the pattern. In every block of four, there's one red, one blue, and two green. That isn't a mistake. Your eyes are most sensitive to green light, and it's where you pick up most of the brightness and detail, so the sensor spends half its pixels there.

`▸ rain` (06:18) Here's the way to picture it. Imagine millions of buckets, set out in a rainstorm. Every photon is a raindrop. When the shutter closes, you measure how much water is in each bucket.

`▸ dark` (06:32) In dim light, only a few drops fall, and it's down to luck which buckets they land in. One gets five, its neighbour gets two. That randomness is the grain you see in night photos.

`▸ overflow` (06:46) In bright light, you get the opposite problem. The bucket fills to the brim and overflows, and once it's full, it can't tell bright from blinding. That's a blown-out sky.

`▸ readout` (06:59) When the exposure ends, each bucket is measured, and turned into a number. Millions of numbers. And that's what leaves the sensor.


## 07:11 – 09:28 · Chapter 4: Why the Raw Image Looks Terrible

_317 words · 135 s spoken_

`▸ raw` (07:11) So what does the sensor actually hand over? Not a photo. Not even close.

`▸ mosaic` (07:16) This is the raw frame. It's dark. It's grainy. And it has no colour at all, just a brightness reading for every pixel, laid out in a checkerboard, where each square only knows about one of red, green, or blue. Two thirds of the colour information in the final picture was never recorded. It has to be worked out. That job belongs to the image signal processor, a block of the phone's main chip that does nothing else.

`▸ demosaic` (07:47) First, it pulls the mosaic apart into three sheets, red, green, and blue, each one full of holes.

`▸ fill` (07:55) Then it fills the holes. For a pixel that only measured green, it looks at the red neighbours on either side, and estimates the red it would have seen. It's an educated guess, but a careful one: the processor looks for edges, and avoids blending across them, so that a sharp line stays sharp, instead of growing coloured fringes. This step is called demosaicing, and it happens for every one of those millions of pixels.

`▸ wb` (08:26) Next, colour. The sensor has no idea that the streetlamp is orange and the shade is blue. Your brain corrects for that automatically. A white shirt looks white to you almost anywhere. So the processor has to do the same, estimating the colour of the light, and scaling the three channels until neutral things look neutral. That's white balance.

`▸ denoise` (08:53) Then, the grain. The processor compares each pixel with its surroundings, works out what's real detail and what's random speckle, and smooths away the speckle, while trying to leave the texture alone. Then tone, contrast, and sharpening.

`▸ done` (09:12) And only now does it look like a photograph. Every one of these steps runs on every frame, thirty or sixty times a second, just to draw the viewfinder. But at night, even this isn't enough.


## 09:28 – 11:35 · Chapter 5: How Silicon Cheats Darkness

_306 words · 125 s spoken_

`▸ problem` (09:29) Here's the limit. A sensor the size of a fingernail simply can't collect much light in one go. Leave the shutter open longer, and anything that moves turns to blur. Turn up the amplification, and you amplify the noise right along with the picture. One exposure is always a compromise.

`▸ buffer` (09:49) So the phone doesn't take one. From the moment you open the camera, it's already shooting, frame after frame, into a small rolling buffer, keeping the last few and throwing the oldest away. Many of them are short exposures, that freeze motion and protect the highlights.

`▸ tap` (10:09) When you tap the shutter, you're not really taking a picture. You're telling the phone which moment you meant. It keeps the frames around that instant, and adds a longer exposure to dig detail out of the shadows. In very dark scenes, it keeps collecting for a second or more.

`▸ align` (10:29) Now it has a stack of frames of the same scene, and none of them quite line up, because your hand moved, and so did the world. So the chip aligns them, shifting and warping each one, patch by patch, until every edge sits on top of itself. Anything that moved too much to match gets left out.

`▸ fuse` (10:51) Then they're merged. The scene is the same in every frame, but the noise is random, different every time. Average the frames, and the picture reinforces itself, while the noise cancels out. Nine frames, about a third of the noise. Machine learning models, running on the neural engine, decide pixel by pixel which frame to trust: the short ones for highlights, the long one for shadows, the sharpest for texture.

`▸ final` (11:21) The result is a photo that no single exposure from this sensor could have produced. It's not faking the scene. It's measuring it many times, and keeping the best of every measurement.


## 11:35 – 12:24 · Outro: One Tap, Billions of Operations

_118 words · 47 s spoken_

`▸ pull` (11:35) So pull back. Out of the silicon wells, where photons became electrons. Up through the colour filters.

`▸ prism` (11:43) Back through the glass that folded a telephoto lens into a sliver, past the sensor floating on its magnets.

`▸ phone` (11:50) Out through the sapphire, and back to the thing in your hand. One tap. A beam folded four times, a sensor steadied thousands of times a second, tens of millions of buckets counted, and billions of calculations, all in about the time it takes you to blink.

`▸ ask` (12:10) That's one camera. There's a lot more hardware hiding in plain sight. So tell me in the comments: what should we take apart next? This is Deep Teardown. I'll see you inside the next one.
