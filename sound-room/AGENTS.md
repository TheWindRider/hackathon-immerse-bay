## Sound Room audio

The seven SATIE-authored sounds play through `satie-runtime` and the in-game mixer. `dist/satie/scene.satie`, `scene.contract.json`, `samples.json`, and `hosts.json` are the authored inputs. The piano uses a separate CC0 recording in the legacy Web Audio player.

- Read `dist/.satie/now.md` when a request refers to what is heard here or now. Mixer tasks appear under `dist/.satie/requests/`; take the task, make the game change, and mark it done with a plain `Done:` sentence and `Files:` list.
- Use SATIE MCP to brief, compose, check and audit changes to the authored scene. Preserve unrelated script lines and existing mixer edits. Ask before any new take costs credits; pass an agreed `maxCents` to realization.
- Keep `dist/.satie/` private. Do not publish mixer history, captures, or audio files beyond the local evaluation build without the user's instruction.
- Verify a scene edit in the in-game mixer and run `npm run check` and `npm test`.
