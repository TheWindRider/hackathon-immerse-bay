# Sound Room

Sound Room is a standalone Three.js soundscape beside the Unity tutorial project. Run `npm install` once, then `npm start` and open http://127.0.0.1:4173. Click **Enter the room** after SATIE finishes loading.

## In-game SATIE mixer

**Make it your mix** is the default control panel. The footer's **Use SATIE mixer** switch opens SATIE's native editor and hides the room panel, floor plan and local source markers. **Use room mix** or SATIE's close button restores the room controls. The sound keeps playing while switching views. The Vite SATIE plugin keeps mixer edits under `dist/.satie/authoring/` and detects this Codex chat through `CODEX_THREAD_ID`. SATIE's Chat tab requires its sound director: the connected Free plan shows an upgrade message for that feature, while the room controls remain available. The director and its game-code request handoff require at least the Vibecoder plan.

The seven SATIE-authored sound types are books, fan, clock, birds, TV, record player, and rain window. Their script, contract, and samples manifest live in `dist/satie/`. The SATIE runtime renders their position, distance and room acoustics. Studio and Cathedral switch the authored scene state. The starter window has one bird always flying outside it; two more visit on staggered cycles. Each bird has its own moving SATIE host and mixer voice, using the existing bird recording without new takes. Walk toward the window to hear their chirps grow louder as they approach and quieter as they fly away. SATIE currently supports one live copy of each catalog sound object in this room; that bird object contains the flock.

The piano is a separate CC0 Freesound recording obtained through SATIE's Freesound connector. **Ambient strings** is a quiet 90-second local mix of a sustained CC0 viola drone from the same connector and an existing bowed double bass recording from the SATIE community. Both layers play at 75% tempo, without a cello melody. Both recorded music objects use Sound Room's Web Audio player, with their own position, volume, and mute controls; neither appears in SATIE's mixer. The drummer is quiet because SATIE music generation is unavailable on the connected Free plan. Quiet furniture and recorded music can have multiple copies. SATIE's Free plan permits evaluation; shipping the SATIE scene and community bass recording requires a paid plan.

## Controls

Walk with WASD or arrows. Click empty floor for mouse look, or hold the right mouse button and drag. Add up to 24 objects, drag them in the room or floor plan, rotate, move with placement arrows, adjust volume or mute, and remove them. Layout is saved in browser localStorage. Reset restores the starter bedroom.

In **Make it your mix**, choose a sound under **Sound traces**, click **Draw sound trace**, and drag a line on the floor plan. The line appears on the floor in the room. Its recording plays from the point on the line nearest the listener, so walking alongside it changes the spatial sound. Each sound gives the line a distinct dashed pattern and moving effect (birds flutter, rain drops fall, strings ripple, and so on). A finished trace has its own sound dropdown; changing it replaces the recording and restyles the line. Each trace can also be muted, adjusted, redrawn, or removed. Up to 12 traces are saved alongside the room layout; Reset clears them. Traces reuse bundled recordings through Web Audio and do not create new SATIE takes or appear in the native SATIE mixer.

The older `sound-room-deploy.tar.gz` in the parent workspace contains the procedural demo and is not this preview build.

## Verification

`npm run check` checks JavaScript syntax. `npm test` checks the catalog, bundled asset hashes, and the legacy piano source lifecycle. The SATIE scene passed `satie_audit_scene`. SATIE flagged the library bird and clock takes for a listening review before release. The local demo has not completed a recorded playthrough or human listening signoff.
