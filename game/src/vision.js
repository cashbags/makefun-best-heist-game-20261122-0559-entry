// vision.js — what a guard or a camera can actually see.
//
// Sight is three questions in order: is the target close enough, is it
// inside the observer's cone, and is the line between them clear of walls
// and crates? All three must pass. Pure functions, no DOM.

import { pointInRects } from './levels.js';

// Sample the segment from (x0, y0) to (x1, y1); blocked when any sample
// lands inside a wall or a crate.
export function hasLineOfSight(x0, y0, x1, y1, blockers) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (pointInRects(x0 + dx * t, y0 + dy * t, blockers)) return false;
  }
  return true;
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is the target inside the observer's vision cone?
export function inCone(ox, oy, facing, halfAngle, range, tx, ty) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  const toTarget = Math.atan2(dy, dx);
  return Math.abs(angleDifference(toTarget, facing)) <= halfAngle;
}

// Full sight test for one observer (guard or camera) against a target.
export function canSee(observer, tx, ty, blockers) {
  if (!inCone(observer.x, observer.y, observer.facing, observer.halfAngle, observer.range, tx, ty)) {
    return false;
  }
  return hasLineOfSight(observer.x, observer.y, tx, ty, blockers);
}

// Distance from a point to the nearest wall in a direction, for rendering
// cone edges that stop at walls. Steps outward until it hits a blocker.
export function rayToWall(x, y, angle, maxDist, blockers) {
  const step = 6;
  for (let d = step; d <= maxDist; d += step) {
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    if (pointInRects(px, py, blockers)) return d - step;
  }
  return maxDist;
}
