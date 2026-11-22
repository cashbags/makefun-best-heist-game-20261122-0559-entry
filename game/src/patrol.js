// patrol.js — guard movement along waypoints and noise investigation.
//
// A guard walks its patrol loop, pauses at each waypoint and scans the
// room, and breaks off to investigate a thrown pebble. When the alarm
// sounds it chases the thief's last seen position instead. Pure logic, no
// DOM, so the logic test can drive it in plain Node.

export function makeGuard(def, id) {
  const first = def.path[0];
  return {
    id,
    path: def.path,
    speed: def.speed,
    pause: def.pause,
    x: first.x,
    y: first.y,
    facing: 0,
    waypoint: 1 % def.path.length,
    waiting: 0.6,
    scanAngle: 0,
    mode: 'patrol', // patrol | investigate | chase
    investigateX: 0,
    investigateY: 0,
    investigateTime: 0,
    chaseX: 0,
    chaseY: 0,
    chaseTime: 0,
    stepPhase: 0,
  };
}

function moveToward(guard, tx, ty, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = guard.speed * dt;
  if (step >= dist) {
    guard.x = tx;
    guard.y = ty;
    guard.facing = Math.atan2(dy, dx);
    return true;
  }
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  guard.stepPhase += dt * 9;
  return false;
}

// Advance one guard by dt seconds. Returns nothing; the guard's mode,
// position and facing are updated in place.
export function stepGuard(guard, dt) {
  if (guard.mode === 'investigate') {
    const arrived = moveToward(guard, guard.investigateX, guard.investigateY, dt);
    guard.investigateTime -= dt;
    if (arrived || guard.investigateTime <= 0) {
      guard.mode = 'patrol';
      guard.waiting = 1.2;
    }
    return;
  }
  if (guard.mode === 'chase') {
    moveToward(guard, guard.chaseX, guard.chaseY, dt);
    guard.chaseTime -= dt;
    if (guard.chaseTime <= 0) {
      guard.mode = 'patrol';
      guard.waiting = 0.8;
    }
    return;
  }
  if (guard.waiting > 0) {
    guard.waiting -= dt;
    // Scan the room while waiting: slow head sweep.
    guard.scanAngle += dt * 1.4;
    guard.facing += Math.sin(guard.scanAngle) * dt * 0.9;
    return;
  }
  const target = guard.path[guard.waypoint];
  const arrived = moveToward(guard, target.x, target.y, dt);
  if (arrived) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.waiting = guard.pause;
    guard.scanAngle = 0;
  }
}

// Send a guard to look at a noise (a thrown pebble landing).
export function sendToInvestigate(guard, x, y, seconds) {
  guard.mode = 'investigate';
  guard.investigateX = x;
  guard.investigateY = y;
  guard.investigateTime = seconds;
}

// Send a guard to the thief's last seen position while the alarm runs.
export function sendToChase(guard, x, y, seconds) {
  guard.mode = 'chase';
  guard.chaseX = x;
  guard.chaseY = y;
  guard.chaseTime = seconds;
}

// Put every guard back on patrol after a caught moment or a level reset.
export function resetGuardsToPatrol(guards) {
  for (const g of guards) {
    g.mode = 'patrol';
    g.waiting = 0.6;
  }
}
