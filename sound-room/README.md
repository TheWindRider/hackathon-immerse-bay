# Sound Room

Sound Room is a standalone Three.js bedroom soundscape beside the Unity tutorial project. Run `npm start` in this directory, then open http://127.0.0.1:4173 and choose **Enter the room**.

The seven audible objects use SATIE / Attractor Labs recordings: books, fan, clock, bird, TV, record player, and rain window. The supplied `dist/satie/scene.satie`, `scene.contract.json`, and `samples.json` record the authored scene, contract, and source assets. Each bundled MP3 was downloaded from SATIE's samples manifest and verified against its SHA-256 hash. The older procedural WAVs and generator have been removed.

The record player now supplies vinyl groove and crackle without music. Piano and drummer remain visual, quiet objects because music is unavailable on the connected SATIE Free plan. SATIE's Free plan is evaluation only; shipping requires an appropriate paid plan.

## Controls

Walk with WASD or arrows. Click empty floor for mouse look, or hold the right mouse button and drag. Add up to 24 objects, drag them in the room or floor plan, use placement arrows, rotate, set individual volume or mute, and remove them. Layout is stored in browser localStorage. Reset restores the starter bedroom. Studio and Cathedral retain the same source recordings while changing the visible space and Web Audio reverb.

SATIE supplies the recordings. The existing Web Audio player handles HRTF positioning, individual copy controls, synchronized loop starts, and the two convolution reverb presets. The authored SATIE runtime scene is retained as provenance and a possible future runtime migration; it is not the browser playback engine. This distinction matters when evaluating acoustics.

The workspace's older `sound-room-deploy.tar.gz` still contains the procedural demo and is not a current build. It has not been repackaged because the connected SATIE Free plan permits evaluation, not shipping.

## Verification

`npm run check` checks JavaScript syntax. `npm test` checks the object catalog and audio source lifecycle. The SATIE scene passed `satie_audit_scene`; it has seven sounds, two room presets, and no missing clips. SATIE flagged the library bird and clock takes for an additional listening review before release. The local demo has not completed a recorded playthrough or human listening signoff.
