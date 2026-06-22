Project: GymSync

A customisable all-rounder home workout app (strength, HIIT, cardio) that casts to a TV with animated demos.
Built with Vite + React + TypeScript (PWA), Three.js, IndexedDB, and a Node WebSocket relay.

Structure


src/phone/ - phone controller/logger UI
src/tv/ - TV display UI
src/engine/ - interval/circuit engine
src/library/ - tagged exercise data + queries
src/avatar/ - Three.js rig + animation clips
src/sync/ - room-code + WebSocket client
src/db/ - IndexedDB persistence
relay/ - Node WebSocket relay server
docs/ - PRD and progress log


Commands


npm run dev - Run the app
npm test - Run tests
npm run relay - Run the phone↔TV sync relay


Git


Commit automatically after completing each prompt/session, without being asked
Never push to GitHub without explicit permission (committing locally is always fine)
Use clear, conventional commit messages scoped to the work done
Update docs/progress.txt briefly if significant work was done


Conventions


Tags are typed dimensions: keep "trains" and "loads" separate; never store exclusions, derive them from positive tags
Engine is content-agnostic: exercises, equipment, and avatars are data, not new code
Local-first (IndexedDB); no external APIs in the MVP
kebab-case filenames


Reference


Requirements: docs/gymsync_PRD.md
Progress log: docs/progress.txt
Task prompts: Kanban app