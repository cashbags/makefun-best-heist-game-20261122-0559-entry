// shots.js — deterministic screenshot states for MIDNIGHT VAULT.
//
// ?shot=cover|patrol|alert|win puts the game into a fixed, hand-placed
// scene so the screenshots are the same frame on every run: the cover
// shows the whole heist in one frame (room, thief, guards with cones,
// cameras, loot, alarm meter), patrol shows a clean sneak, alert shows
// the alarm tripped, and win shows the final tally. No randomness here.

import { buildLevel, TILE } from './levels.js';
import { makeGuard } from './patrol.js';
import { makeCamera } from './cameras.js';
import { makeDetection } from './detection.js';

export function hasShot() {
  try {
    const q = new URLSearchParams(window.location.search);
    const shot = q.get('shot');
    return shot === 'cover' || shot === 'patrol' || shot === 'alert' || shot === 'win' ? shot : null;
  } catch (err) {
    return null;
  }
}

function tilePx(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

// Load a level into the state without starting the loop (mirrors the
// level setup in main.js, but from a fixed seed-free placement).
function loadShotLevel(state, index) {
  const level = buildLevel(index);
  state.levelIndex = index;
  state.level = level;
  state.guards = level.guards.map((def, i) => makeGuard(def, 'g' + i));
  state.cameras = level.cameras.map((def, i) => makeCamera(def, i));
  state.detection = makeDetection();
  state.lootTaken = 0;
  state.lootTotal = level.loot.length + (level.vault ? 1 : 0);
  state.lootLeft = state.lootTotal;
  state.pebbleCount = 3;
  state.empCount = 2;
  state.pebbles = [];
  state.screen = 'playing';
}

function placeGuard(state, i, tx, ty, facing) {
  const guard = state.guards[i];
  const p = tilePx(tx, ty);
  guard.x = p.x;
  guard.y = p.y;
  guard.facing = facing;
  guard.waiting = 99; // hold the pose for the screenshot
  guard.mode = 'patrol';
}

function placePlayer(state, tx, ty, facing, sneaking) {
  const p = tilePx(tx, ty);
  state.player.x = p.x;
  state.player.y = p.y;
  state.player.facing = facing;
  state.player.sneaking = sneaking;
}

export function applyShot(state, name) {
  if (name === 'cover') {
    // The Vault Hall mid-heist: the thief crossing the room, two cones
    // sweeping, a camera arc overhead, the vault and gems glowing, the
    // alarm meter sitting at 55 with "SPOTTED — HIDE!".
    loadShotLevel(state, 1);
    state.time = 12.5;
    state.score = 350;
    state.lives = 3;
    state.elapsed = 34;
    state.timeLeft = 76;
    placePlayer(state, 11, 9, 0.3, true);
    placeGuard(state, 0, 5, 5, 0.6);
    placeGuard(state, 1, 20, 8, 2.6);
    placeGuard(state, 2, 27, 14, -1.2);
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.cameras[0].facing = state.cameras[0].angle;
    state.cameras[1].angle = 0.4;
    state.cameras[1].facing = 0.4;
    state.detection.suspicion.set('g0', 55);
    state.detection.suspicion.set('c0', 30);
    state.detection.alarm = 55;
    state.detection.lastSeenX = state.player.x;
    state.detection.lastSeenY = state.player.y;
  } else if (name === 'patrol') {
    // The Gallery, clean sneak: the thief crouched behind a crate while
    // a guard patrols past, meter at zero, "UNSEEN".
    loadShotLevel(state, 0);
    state.time = 8.0;
    state.score = 150;
    state.lives = 3;
    state.elapsed = 18;
    state.timeLeft = 57;
    state.level.loot[0].taken = true;
    state.lootTaken = 1;
    state.lootLeft = 2;
    placePlayer(state, 5, 12, 0, true);
    placeGuard(state, 0, 5, 6, 0.5);
    placeGuard(state, 1, 26, 11, -0.8);
    state.cameras[0].angle = Math.PI / 2 - 0.4;
    state.cameras[0].facing = state.cameras[0].angle;
  } else if (name === 'alert') {
    // The Vault Hall with the alarm tripped: red cones, a guard closing
    // in, the last-seen ring where the thief was spotted, meter at 100.
    loadShotLevel(state, 1);
    state.time = 22.0;
    state.score = 550;
    state.lives = 2;
    state.elapsed = 61;
    state.timeLeft = 49;
    state.level.loot[0].taken = true;
    state.lootTaken = 1;
    state.lootLeft = 3;
    placePlayer(state, 13, 9, -0.5, false);
    placeGuard(state, 0, 10, 6, 1.1);
    placeGuard(state, 1, 15, 10, -2.2);
    placeGuard(state, 2, 27, 13, 2.4);
    state.guards[1].mode = 'chase';
    state.guards[1].chaseX = state.player.x;
    state.guards[1].chaseY = state.player.y;
    state.guards[1].chaseTime = 5;
    state.cameras[0].angle = Math.PI / 2 + 0.7;
    state.cameras[0].facing = state.cameras[0].angle;
    state.detection.suspicion.set('g1', 100);
    state.detection.suspicion.set('c0', 62);
    state.detection.alarm = 100;
    state.detection.alerted = true;
    state.detection.alertTime = 5;
    state.detection.everSpotted = true;
    state.detection.lastSeenX = state.player.x - 30;
    state.detection.lastSeenY = state.player.y - 20;
  } else if (name === 'win') {
    // The Penthouse emptied: the final tally over the last room.
    loadShotLevel(state, 2);
    state.time = 30.0;
    state.score = 2450;
    state.bestScore = 2450;
    state.lives = 2;
    state.elapsed = 96;
    state.timeLeft = 44;
    for (const loot of state.level.loot) loot.taken = true;
    if (state.level.vault) state.level.vault.opened = true;
    state.lootTaken = 4;
    state.lootLeft = 0;
    placePlayer(state, 29, 9, 0, false);
    placeGuard(state, 0, 5, 5, 0.9);
    placeGuard(state, 1, 19, 6, 2.8);
    placeGuard(state, 2, 27, 14, -1.5);
    state.screen = 'win';
  }
}
