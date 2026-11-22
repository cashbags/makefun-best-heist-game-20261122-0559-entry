# MIDNIGHT VAULT

[![make.fun](https://make.fun/badge.svg)](https://make.fun/?ref=qrg7fvky)

A three-room heist game for the [make.fun best-heist-game-20261122-0559 competition](https://make.fun/bounty/best-heist-game-20261122-0559). You are Rook, a thief crossing the Aldermere Museum after midnight: steal every painting, gem and crown, crack the vaults, and slip out the green exit — unseen.

## How it plays

- **Guards patrol with vision cones.** Read a cone before you move; a guard that sees you fills the alarm meter.
- **Cameras sweep the halls.** Their arcs are visible; an EMP burst (E) freezes them for 6 seconds.
- **The alarm meter is your heartbeat.** Suspicion fills while you are seen and drains while you hide. At 100 the alarm trips, guards chase your last seen position, and a guard that reaches you catches you. Hiding in shadow patches fills suspicion half as fast; sneaking (Shift) halves it again.
- **Tools at a cost.** Click to toss a pebble and pull a guard off its route; EMPs are limited to 2 per room; the vault needs a steady hand — hold F beside it for 3 seconds.
- **Three rooms, three layouts:** The Gallery, The Vault Hall, The Penthouse. Every room has several routes (vents the guards never patrol), distinct patrols, and its own loot: paintings, gems, the Iron Vault, and the Crown of Aldermere.
- **Scoring:** points per loot, +500 per cleared room, time bonus against par, +300 ghost bonus per room never spotted. 3 lives; best score saved locally.

## Controls

WASD / arrows move · Shift sneak · Click toss a pebble · E EMP · hold F pick the vault · P pause · Enter confirm.

## Run it

Open `game/index.html` in a desktop browser, or serve `game/` with any static server. No build step, no network requests, all art is procedural canvas and all sounds are synthesised WebAudio.

## Files

- `game/src/levels.js` — the three floor plans
- `game/src/patrol.js` — guard waypoints, investigation, chase
- `game/src/vision.js` — cones, line of sight, wall-clipped rays
- `game/src/cameras.js` — sweeping cameras and EMP freeze
- `game/src/detection.js` — suspicion, alarm meter, caught moment
- `game/src/audio.js` — synthesised sounds
- `game/src/render.js` — canvas drawing, HUD, overlays
- `game/src/input.js` — keyboard and mouse
- `game/src/main.js` — loop, state machine, scoring
- `game/src/shots.js` — deterministic screenshot states
- `main.ts` — the make.fun hand-in program
