# The Courtyard

A small TypeScript, Vite, Three.js and WebXR starter using the Satie web runtime.
The courtyard layout and sound scene were authored from one Satie world prompt;
the browser build loads the authored scene and does not make live generation calls.

## Run

```sh
npm install
npm run dev
```

Open the localhost URL for desktop mode. WebXR requires a secure context; to test
from a headset, use an HTTPS deployment or secure tunnel. A headset browser must
also support `immersive-vr`.

The app loads the Satie files from `public/satie/`. The realized
`samples.json` maps four scene sounds to their hosted audio assets. The browser
fetches those assets when it loads the scene; it does not generate audio at
runtime. The visual world remains usable and reports an error if audio cannot
be loaded.

On desktop, drag to look and use W/A/S/D or the arrow keys to walk within the
courtyard. In VR, the listener follows the headset's tracked position, so
room-scale movement works without changing or regenerating the Satie scene.
Use the on-screen volume slider to adjust the overall Satie output.

## Build

```sh
npm run build
npm run preview
```
