// cameras.js — wall-mounted security cameras.
//
// A camera sits on a wall and sweeps its lens back and forth across its
// arc. An EMP freezes the sweep (and the camera cannot spot the thief
// while frozen). Pure logic, no DOM.

export function makeCamera(def, index) {
  return {
    id: 'c' + index,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    range: def.range,
    halfAngle: 0.52, // ~30 degrees each side
    angle: def.baseAngle,
    phase: index * 1.7, // cameras start out of step with each other
    frozen: 0, // seconds of EMP freeze left
    facing: def.baseAngle,
  };
}

// Advance one camera by dt seconds. The lens angle is a sine sweep around
// its mounting angle, so it reads the room, turns, and reads it back.
export function stepCamera(camera, dt, time) {
  if (camera.frozen > 0) {
    camera.frozen -= dt;
    return;
  }
  camera.angle = camera.baseAngle + Math.sin(time * 0.9 + camera.phase) * camera.sweep;
  camera.facing = camera.angle;
}

// Freeze every camera for `seconds` (an EMP burst).
export function freezeCameras(cameras, seconds) {
  for (const c of cameras) c.frozen = seconds;
}

// True when the camera's lens is currently able to spot the thief.
export function cameraIsWatching(camera) {
  return camera.frozen <= 0;
}
