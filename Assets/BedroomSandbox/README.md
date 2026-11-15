# Bedroom Sound Room — Unity / Quest 3

This is a native Unity implementation, independent of the browser app. Open `Assets/BedroomSandbox/Bedroom_Quest.unity` and press Play. The room and furnishings are generated at runtime by the scene's `BedroomSandbox` component, so the edit-time scene initially contains only that component.

## Included

One 12 × 12 m room; 14 addable types (bed, books, bookshelf, lamp, rug, plant, fan, clock, chirping bird, TV, record player, rain window, piano, drums); eight starter objects; nine original procedural mono loops; independent position, rotation, volume, mute and removal; up to 24 objects; automatic device-local layout saving; Studio / Cathedral reverb; a 4.5-second before/after sequence without restarting the sounds.

Sounds use native Unity 3D AudioSources with distance attenuation and stereo panning. Reverb uses AudioReverbFilter parameters on the listener. It is an illustrative effect, not a physically simulated room. Attractor is not connected. No uploads or API keys are required. Quiet furniture stays silent; books have page-turning ambience. There is no physics collision against furniture, no hand tracking, and no passthrough. This is a fully virtual environment. Headset spatialization uses Unity's default panning; a dedicated HRTF spatializer is not bundled.

## Desktop controls

- WASD: walk. Hold right mouse: look.
- Left click an object: select. Hold and aim at the floor: move. Release: save.
- Tab: open/close the library. Click a library button to add an object in front of you.
- Library: mute, rotate, remove, volume −/+, acoustics, compare, reset.
- C: switch Studio / Cathedral.

The menu starts open. Close it to walk and select furniture. Open it again to edit the selected object. Reset replaces the saved layout with the eight-object starter bedroom. Layouts live in `Application.persistentDataPath/bedroom-layout-v1.json` on each device.

## Quest Touch controls

- Left thumbstick: head-relative movement.
- Right thumbstick left/right: 30-degree snap turns.
- Right trigger: point at and press menu buttons; select an object, hold, and aim at the floor to move it.
- Right A: open/close and bring the library in front of you.
- Right B: Studio / Cathedral.
- Normal headset movement supplies the listener position and orientation.

## Build and transfer to Quest 3

1. In Unity Hub, install **Android Build Support**, **Android SDK & NDK Tools**, and **OpenJDK** for this exact editor version, **6000.6.9f1**. These modules were absent when this port was created.
2. Let Unity resolve the added packages: `com.unity.xr.management` 4.5.4 and `com.unity.xr.openxr` 1.16.1.
3. Use **Sound Room → 2 - Configure Quest 3 OpenXR**. This enables the Android OpenXR loader, Meta Quest Support, Oculus Touch and Meta Quest Touch Plus profiles, single-pass rendering, ARM64 / IL2CPP, Android minimum API 32, and OpenGLES3. It sets the Android identifier to `com.aaron.bedroomsoundroom`. The original tutorial scene/build list is preserved.
4. Open **File → Build Profiles**, switch to **Android**, and check **Project Settings → XR Plug-in Management → Project Validation** for Android. Fix any validation errors reported by the installed toolchain.
5. Use **Sound Room → 3 - Build Quest APK**. It builds only the bedroom scene to `Builds/Quest3/BedroomSoundRoom.apk`.
6. Enable Developer Mode on the Quest, connect USB, authorize USB debugging in-headset, and install the APK with Meta Quest Developer Hub or `adb install -r Builds/Quest3/BedroomSoundRoom.apk`. Launch it from the headset's Unknown Sources apps.

The project has not been tested on physical Quest hardware. A successful editor compile is not evidence of headset tracking, controller bindings, sound quality, Android performance, or a working APK; validate those on-device. One unshadowed directional light and simple primitive models keep this version lightweight. Profile on the headset before expanding content.

## Moving this into another Unity project

Use **Sound Room → Export portable Unity package**, or import `Builds/BedroomSoundRoom.unitypackage` when provided. Install URP, Input System, XR Plug-in Management, and OpenXR in the destination project before importing. Set Active Input Handling to **Input System Package (New)** or **Both**, run the Quest configuration menu, and open the bedroom scene. Runtime code is under `Assets/BedroomSandbox/Runtime`; editor setup/build code is under `Editor`; bundled sounds are under `Resources/BedroomAudio`. The Unity package does not include other project-wide settings or install Package Manager dependencies for you.

References: [Unity Meta Quest support](https://docs.unity.cn/Packages/com.unity.xr.openxr@1.16/manual/features/metaquest.html), [Meta Unity XR setup](https://developers.meta.com/vr/documentation/unity/unity-xr-plugin/).
