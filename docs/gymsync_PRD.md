GymSync - Product Requirements Document

Version: 0.2
Last Updated: 5 July 2026
GitHub: https://github.com/Kezman554/GymSync.git

Changelog
- v0.2 (5 Jul 2026): records the 4 July pre-build decisions (personal-first PWA on the Pi, male+female avatar on shared topology, 3D rig, content pipeline) and adds the runtime muscle-highlighting feature. Supersedes the single-avatar / future-sale framing in v0.1.
- v0.1 (22 Jun 2026): initial PRD.

Overview

Problem Statement

Home workout apps either lock users into fixed content or are single-purpose interval timers, and most are phone-only. GymSync is a fully customisable all-rounder (strength, HIIT, cardio) that follows along on a TV via the phone, with animated exercise demos on the big screen.

Goals


Provide one configurable engine covering strength, HIIT, and cardio
Let users build, customise, and run workouts with animated demos on a TV
Sync a phone (controller/logger) to a TV display on hardware the user already owns
Ship personal-first as a PWA hosted on the kitchen Pi; keep the web receiver portable to Fire TV / Cast as a preserved future-sale option, not an MVP goal


Target Users

Primarily the builder (dogfooded first); broadly, home exercisers who want customisable, equipment-optional workouts with big-screen follow-along.

Features

Workout Engine


Configurable interval/circuit engine; timed and rep-count blocks
Global timing with per-exercise override; circuits/rounds with repeats
Named formats (Tabata, EMOM, AMRAP) expressible as presets


Exercise Library


Tagged library with typed dimensions: trains, loads, equipment, impact, position, MET
Equipment-optional filtering, including a no-equipment mode
Exclusion filtering derived from positive tags (e.g. avoid elbow/grip load)


Build & Play


Build-your-own sessions (add, reorder, remove, duplicate); presets; saved templates
Phone as controller/remote (pause, skip, back, +time, end)
MET-based calorie estimate from age/sex/weight


Big-Screen Display


TV web app: current exercise, 3D animated demo, countdown, round counter, up-next
Audio cues (beeps, halfway, rest, spoken exercise names)
Room-code pairing; phone↔TV sync over a WebSocket relay


Avatar


Two rigged figures (one male, one female) on a single shared topology and skeleton, Mixamo auto-rigged so every animation clip plays on both. Palette: white body, light grey tight-fitting kit (painted onto the mesh, not separate cloth), black hair
Runtime muscle highlighting: muscle-group zones tint red to show the current exercise's target, driven entirely by each exercise's existing trains tags — primary bright, secondary dimmer, untrained zones neutral. Renders in Three.js on both figures via the shared topology (one implementation). Requires a static trains-value → muscle-zone lookup (authored once, not per exercise) and zones painted as individually addressable regions during avatar build. No per-exercise artwork


Scope

In Scope


Engine (timed + rep-count), tagged library, build-your-own + presets
Two shared-topology 3D figures (male + female) with animation clips and runtime muscle highlighting
Personal-first PWA hosted on the kitchen Pi
TV display + room-code pairing + relay (Firestick Silk browser / Pi Chromium)
MET calorie estimate; local-first storage of workouts and profile


Out of Scope


Strength sets×reps×weight mode and workout history/progression
Randomiser/generator; avatar picker/customiser
Accounts/cloud sync; native Fire TV app; Google Cast; AR form matching
Yoga/pilates; AI-coach features; heart-rate sensors


Future Considerations


Strength mode (sets×reps×weight) + local-first logging & progression
Randomiser / workout generator (constrained, balanced sampling)
Alfred integration — session webhook → vault workout note
HR strap via Web Bluetooth (Android Chrome)
AR pose-estimation form matching (aligns with online-physio domain)
Commercial path (someday): personal-first for now, but the app is one Capacitor step from a store; avatar customiser and accounts/cloud sync are the levers if it ever goes sellable — preserved, not discarded


Technical

Stack


Vite + React + TypeScript: phone and TV web apps (PWA)
Three.js: 3D rig and animation playback
IndexedDB: local-first storage
Node + WebSocket: phone↔TV relay


Integrations


None in MVP


Constraints


The target VIDAA TV has no Google Cast; MVP targets a controllable browser (Firestick Silk / Pi Chromium) via a room-code URL
Web Bluetooth (future HR) is unsupported on iOS Safari, affecting later native decisions
Animation content (clips per exercise) is the main ongoing effort; stream/cache assets, never bundle video
Content pipeline: Tier 1 Mixamo harvest → Tier 2 video-mocap scaling (Rokoko / DeepMotion class) → Tier 3 Blender for holds & repairs; MVP library 30–50 dogfooded exercises, growing at minutes-per-exercise afterwards


Project Structure

gymsync/
├── docs/
│   ├── gymsync_PRD.md
│   └── progress.txt
├── CLAUDE.md
├── src/
│   ├── phone/    - phone controller/logger UI
│   ├── tv/       - TV display UI
│   ├── engine/   - interval/circuit engine
│   ├── library/  - tagged exercise data + queries
│   ├── avatar/   - Three.js rig + clips
│   ├── sync/     - room-code + WebSocket client
│   └── db/       - IndexedDB persistence
├── relay/        - Node WebSocket relay
└── public/       - PWA manifest, icons, assets

Success Criteria


 Build a custom workout from the tagged library and run it end to end
 Timed and rep-count blocks, rounds, and rest behave correctly, with per-exercise timing overrides
 Exclusion filter (e.g. avoid elbow/grip load) removes the right exercises while target search is unaffected
 Phone pairs to a TV browser via room code and drives the display in real time
 TV shows current exercise, animated demo, countdown, round counter, and up-next with audio cues
 Estimated calorie burn is shown from an age/sex/weight profile
 Custom workouts and profile persist locally across sessions
 Muscle zones tint correctly from an exercise's trains tags (primary/secondary) on both the male and female figures
 Runs on the Firestick Silk browser and the Pi + monitor