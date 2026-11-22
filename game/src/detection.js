// detection.js — suspicion, the alarm meter, and the caught moment.
//
// One suspicion value per observer fills while the thief is seen and drains
// while hidden. The alarm meter is the highest suspicion in the room. At
// 100 the alarm trips: guards chase the last seen position, and a guard
// that reaches the thief catches them. Suspicion never means instant
// failure — the player always gets a chance to break line of sight and
// let the room calm down. Pure logic, no DOM.

export const SUSPICION_MAX = 100;
export const ALARM_TRIP = 100;
export const CATCH_DISTANCE = 30;

export function makeDetection() {
  return {
    suspicion: new Map(), // observer id -> 0..100
    alarm: 0, // the meter the HUD shows: highest suspicion
    alerted: false,
    alertTime: 0, // seconds left on the current alarm
    lastSeenX: 0,
    lastSeenY: 0,
    everSpotted: false, // any alarm this level (kills the ghost bonus)
    caught: false,
  };
}

// How fast suspicion fills for one observer this frame. Sneaking halves
// it, standing in a shadow patch halves it again, and being close fills it
// faster than being at the edge of the cone.
export function fillRate(base, distance, range, sneaking, inShadow) {
  let rate = base;
  if (distance < range * 0.5) rate *= 1.25;
  if (sneaking) rate *= 0.5;
  if (inShadow) rate *= 0.5;
  return rate;
}

// Advance detection by dt seconds.
// `seen` is a list of { id, distance, range, baseRate, x, y } for every
// observer that currently has the thief in sight. `guards` are the live
// guard objects (their chase mode is set here when the alarm trips).
// Returns 'caught' when a guard reaches the thief during an alarm.
export function updateDetection(det, seen, dt, sneaking, inShadow, playerX, playerY, guards) {
  const seenIds = new Set();
  for (const s of seen) {
    seenIds.add(s.id);
    const prev = det.suspicion.get(s.id) || 0;
    const rate = fillRate(s.baseRate, s.distance, s.range, sneaking, inShadow);
    det.suspicion.set(s.id, Math.min(SUSPICION_MAX, prev + rate * dt));
    det.lastSeenX = playerX;
    det.lastSeenY = playerY;
  }
  for (const [id, value] of det.suspicion) {
    if (!seenIds.has(id)) {
      det.suspicion.set(id, Math.max(0, value - 26 * dt));
    }
  }
  let top = 0;
  for (const value of det.suspicion.values()) top = Math.max(top, value);
  det.alarm = top;

  if (!det.alerted && top >= ALARM_TRIP) {
    det.alerted = true;
    det.alertTime = 6;
    det.everSpotted = true;
  }
  if (det.alerted) {
    det.alertTime -= dt;
    for (const g of guards) {
      if (g.mode !== 'chase') {
        g.mode = 'chase';
        g.chaseX = det.lastSeenX;
        g.chaseY = det.lastSeenY;
        g.chaseTime = det.alertTime;
      } else {
        g.chaseX = det.lastSeenX;
        g.chaseY = det.lastSeenY;
        g.chaseTime = Math.max(g.chaseTime, det.alertTime);
      }
    }
    if (det.alertTime <= 0) {
      det.alerted = false;
      // The room calms down, but not all the way: the alarm meter settles
      // at 40 so the next sighting trips it faster.
      for (const id of det.suspicion.keys()) {
        det.suspicion.set(id, Math.min(det.suspicion.get(id), 40));
      }
      det.alarm = 40;
    }
    for (const g of guards) {
      const d = Math.hypot(g.x - playerX, g.y - playerY);
      if (d < CATCH_DISTANCE) {
        det.caught = true;
        return 'caught';
      }
    }
  }
  return 'ok';
}

// Reset the meter after a caught moment: guards go back to patrol, the
// alarm settles at 40, and the thief gets a fresh start at the door.
export function resetAfterCaught(det) {
  det.caught = false;
  det.alerted = false;
  det.alertTime = 0;
  for (const id of det.suspicion.keys()) det.suspicion.set(id, 40);
  det.alarm = 40;
}
