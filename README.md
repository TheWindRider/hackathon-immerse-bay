# The Courtyard

## Inner Eden extension on chenguang webxr

The original fountain, hedges, lanterns, bird shrub, stonework, SATIE script, contract, and sample manifests are preserved. A brighter island surrounds the courtyard with a shore and hammock, a grove and stream, and a walkable overlook. New geometry and animation live in `src/paradise-world.js`.

Before entering, answer **How do you want to feel** and **Where would that feeling live**, then choose **Shape my paradise**. This maps explicit keywords to existing creative presets; it does not infer psychology or generate new terrain. Deep Calm, Quiet Wonder and Open Freedom adjust Energy, Nature and Dreaminess. Controls smoothly change brightness, vegetation, glow, particles, sea motion and a supplemental procedural waves/water/wind layer. Original SATIE audio remains in place; no new paid takes were requested.

WASD and arrows stop on release, focus loss, visibility changes and UI focus, with a lost-release timeout. Drag to look. In VR, the left stick walks and the right stick snap-turns. A or a thumbstick click opens the in-headset Eden controls. Trigger menu buttons, or point the left trigger at the floor and release to teleport. **Pause here** stops locomotion; favorite settings save locally in the browser. Desktop controls include personalization, favorite naming and loading.

The return door is behind the starting point, marked **Return to bedroom**. Click it or point a controller and pull its trigger. The standalone partner page links to the separate bedroom website, so the browser ends VR before navigation; press Enter VR again there. The bedroom app also embeds the preserved courtyard geometry with the Eden extension: its bedroom and return doors switch scenes without ending the current VR session. Embedded audio uses the bedroom public build's procedural ambience rather than copying SATIE account assets.

Build and tests: `npm test && npm run build`. The deployment workflow uploads `preview-site`, so copy the complete successful `dist/` build into that folder before pushing this branch. Relative asset paths support the repository's GitHub Pages subdirectory. Headset comfort, real controller operation and frame rate still require on-device testing.

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
