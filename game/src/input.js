// input.js — keyboard and mouse state for MIDNIGHT VAULT.
//
// Keys: WASD or arrows to move, Shift to sneak, E for an EMP burst, F
// (held) to pick a lock, P or Escape to pause, Enter to confirm menus.
// A mouse click tosses a pebble at the clicked floor point. The module
// keeps plain state; the game loop reads it each frame.

export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    pressed: new Set(), // edge-triggered: a key pressed between frames
    clickX: null,
    clickY: null,
    clicked: false,
  };

  function keyName(e) {
    return e.key.toLowerCase();
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    if (!e.repeat) input.pressed.add(k);
    input.keys.add(k);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(keyName(e));
  });
  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.clickX = (e.clientX - rect.left) * scaleX;
    input.clickY = (e.clientY - rect.top) * scaleY;
    input.clicked = true;
  });

  return input;
}

// Movement vector from the held keys, normalised to length 1.
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('a') || input.keys.has('arrowleft')) x -= 1;
  if (input.keys.has('d') || input.keys.has('arrowright')) x += 1;
  if (input.keys.has('w') || input.keys.has('arrowup')) y -= 1;
  if (input.keys.has('s') || input.keys.has('arrowdown')) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.hypot(x, y);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

export function isSneaking(input) {
  return input.keys.has('shift');
}

// True once per physical key press, even when the press lands between
// two frames: the game loop polls at 60 Hz, a tap can be shorter than a
// frame, and polling the held set alone would drop it.
export function pressedOnce(input, key) {
  if (!input.pressed.has(key)) return false;
  input.pressed.delete(key);
  return true;
}

export function consumeClick(input) {
  if (!input.clicked) return null;
  input.clicked = false;
  return { x: input.clickX, y: input.clickY };
}
