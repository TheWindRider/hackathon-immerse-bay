# Immerse Bay — Unity and Sound Room

This repository contains the Unity project and the standalone Sound Room website.

## Unity

Open the repository folder in Unity Hub with **Unity 6000.6.9f1**. Unity restores
packages from `Packages/manifest.json` and regenerates its local Library cache.
`Assets/`, `Packages/`, and `ProjectSettings/` contain the project source and assets.

## Sound Room website

With Node.js installed:

```sh
cd sound-room
npm start
```

Open http://127.0.0.1:4173 and choose **Enter the room** to enable audio.
No dependency installation is required; Three.js is bundled.

```sh
npm run check
npm test
```

See [the website README](sound-room/README.md) for controls, SATIE / Attractor
audio provenance, and evaluation-license restrictions. Third-party audio and
vendored libraries retain their own license terms.

Unity caches, generated IDE projects, local hosting metadata, and old deployment
archives are excluded from this repository.
