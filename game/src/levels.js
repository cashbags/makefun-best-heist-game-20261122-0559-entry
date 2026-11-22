// levels.js — the three rooms of MIDNIGHT VAULT.
//
// Each level is a floor plan in tile units (TILE px per tile, the canvas is
// 32 x 18 tiles). Walls block movement and sight; crates block sight but can
// be walked around; shadow patches halve how fast a guard's suspicion fills;
// vents are alternate routes the guards never patrol. Loot must all be taken
// before the exit door opens. Nothing here touches the DOM, so the logic
// test can import it in plain Node.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;

// The outer shell every level shares: a one-tile stone border with a gap
// left open only where the level's exit door sits.
export function borderWalls(exitTile) {
  const walls = [
    { x: 0, y: 0, w: COLS, h: 1 },
    { x: 0, y: ROWS - 1, w: COLS, h: 1 },
    { x: 0, y: 0, w: 1, h: ROWS },
  ];
  if (exitTile.y === 0) {
    walls.push({ x: COLS - 1, y: 1, w: 1, h: ROWS - 1 });
  } else if (exitTile.y === ROWS - 1) {
    walls.push({ x: COLS - 1, y: 0, w: 1, h: ROWS - 1 });
  } else {
    walls.push({ x: COLS - 1, y: 0, w: 1, h: exitTile.y });
    walls.push({ x: COLS - 1, y: exitTile.y + 1, w: 1, h: ROWS - exitTile.y - 1 });
  }
  return walls;
}

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export const LEVEL_DEFS = [
  {
    name: 'THE GALLERY',
    sub: 'Three paintings. One sleepy guard rotation. Do not wake it.',
    parSeconds: 75,
    playerStart: { x: 2, y: 9 },
    exit: { x: 30, y: 9 },
    walls: [
      { x: 10, y: 2, w: 1, h: 6 },
      { x: 20, y: 10, w: 1, h: 6 },
      { x: 4, y: 4, w: 5, h: 1 },
      { x: 23, y: 13, w: 5, h: 1 },
    ],
    crates: [
      { x: 6, y: 12, w: 2, h: 1 },
      { x: 14, y: 6, w: 1, h: 2 },
      { x: 24, y: 5, w: 2, h: 1 },
      { x: 17, y: 13, w: 1, h: 2 },
    ],
    shadows: [
      { x: 5, y: 8, w: 4, h: 3 },
      { x: 22, y: 3, w: 4, h: 3 },
      { x: 13, y: 12, w: 4, h: 3 },
    ],
    vents: [
      { x: 11, y: 9, w: 6, h: 1 },
    ],
    guards: [
      { path: [[5, 3], [8, 3], [8, 7], [5, 7]], speed: 62, pause: 0.9 },
      { path: [[24, 12], [28, 12], [28, 15], [24, 15]], speed: 58, pause: 0.9 },
    ],
    cameras: [
      { x: 16, y: 1, baseAngle: Math.PI / 2, sweep: 0.9, range: 300 },
    ],
    loot: [
      { kind: 'painting', x: 3, y: 3, value: 150, label: 'Moonlit Canal' },
      { kind: 'painting', x: 28, y: 3, value: 150, label: 'The Brass Duchess' },
      { kind: 'painting', x: 16, y: 15, value: 150, label: 'Harbour at Dusk' },
    ],
    vault: null,
  },
  {
    name: 'THE VAULT HALL',
    sub: 'The vault needs a steady hand: hold F beside it for three seconds.',
    parSeconds: 110,
    playerStart: { x: 2, y: 9 },
    exit: { x: 30, y: 9 },
    walls: [
      { x: 8, y: 2, w: 1, h: 5 },
      { x: 8, y: 11, w: 1, h: 5 },
      { x: 16, y: 6, w: 1, h: 6 },
      { x: 24, y: 2, w: 1, h: 5 },
      { x: 24, y: 11, w: 1, h: 5 },
      { x: 12, y: 14, w: 6, h: 1 },
    ],
    crates: [
      { x: 4, y: 5, w: 2, h: 1 },
      { x: 12, y: 9, w: 1, h: 2 },
      { x: 20, y: 13, w: 2, h: 1 },
      { x: 27, y: 6, w: 1, h: 2 },
    ],
    shadows: [
      { x: 3, y: 12, w: 4, h: 3 },
      { x: 18, y: 3, w: 4, h: 3 },
      { x: 26, y: 12, w: 4, h: 3 },
    ],
    vents: [
      { x: 9, y: 9, w: 5, h: 1 },
      { x: 25, y: 9, w: 4, h: 1 },
    ],
    guards: [
      { path: [[4, 3], [7, 3], [7, 8], [4, 8]], speed: 66, pause: 0.8 },
      { path: [[18, 5], [22, 5], [22, 12], [18, 12]], speed: 70, pause: 0.7 },
      { path: [[26, 13], [29, 13], [29, 16], [26, 16]], speed: 60, pause: 1.0 },
    ],
    cameras: [
      { x: 16, y: 1, baseAngle: Math.PI / 2, sweep: 1.0, range: 310 },
      { x: 1, y: 9, baseAngle: 0, sweep: 0.8, range: 280 },
    ],
    loot: [
      { kind: 'gem', x: 4, y: 14, value: 200, label: 'Star Sapphire' },
      { kind: 'gem', x: 27, y: 14, value: 200, label: 'Blood Ruby' },
      { kind: 'painting', x: 16, y: 9, value: 150, label: 'The Night Watchman' },
    ],
    vault: { x: 16, y: 2, value: 400, label: 'The Iron Vault', pickSeconds: 3 },
  },
  {
    name: 'THE PENTHOUSE',
    sub: 'The Crown of Aldermere sits under three cameras. Take it and run.',
    parSeconds: 140,
    playerStart: { x: 2, y: 9 },
    exit: { x: 30, y: 9 },
    walls: [
      { x: 7, y: 2, w: 1, h: 6 },
      { x: 15, y: 10, w: 1, h: 6 },
      { x: 23, y: 2, w: 1, h: 6 },
      { x: 11, y: 13, w: 8, h: 1 },
      { x: 26, y: 11, w: 1, h: 4 },
    ],
    crates: [
      { x: 4, y: 4, w: 2, h: 1 },
      { x: 10, y: 9, w: 1, h: 2 },
      { x: 19, y: 6, w: 2, h: 1 },
      { x: 27, y: 14, w: 2, h: 1 },
    ],
    shadows: [
      { x: 3, y: 13, w: 4, h: 3 },
      { x: 12, y: 3, w: 4, h: 3 },
      { x: 20, y: 12, w: 4, h: 3 },
      { x: 27, y: 3, w: 3, h: 3 },
    ],
    vents: [
      { x: 8, y: 9, w: 6, h: 1 },
      { x: 24, y: 9, w: 4, h: 1 },
    ],
    guards: [
      { path: [[3, 3], [6, 3], [6, 8], [3, 8]], speed: 72, pause: 0.7 },
      { path: [[17, 4], [21, 4], [21, 9], [17, 9]], speed: 76, pause: 0.6 },
      { path: [[25, 12], [29, 12], [29, 16], [25, 16]], speed: 68, pause: 0.8 },
    ],
    cameras: [
      { x: 16, y: 1, baseAngle: Math.PI / 2, sweep: 1.1, range: 320 },
      { x: 1, y: 4, baseAngle: 0, sweep: 0.9, range: 290 },
      { x: 30, y: 14, baseAngle: Math.PI, sweep: 0.9, range: 290 },
    ],
    loot: [
      { kind: 'crown', x: 16, y: 3, value: 500, label: 'Crown of Aldermere' },
      { kind: 'gem', x: 4, y: 15, value: 200, label: 'Emerald of Tides' },
      { kind: 'painting', x: 28, y: 5, value: 150, label: 'The Last Heist' },
    ],
    vault: { x: 28, y: 15, value: 400, label: 'The Penthouse Safe', pickSeconds: 3 },
  },
];

// Convert a level definition into pixel-space runtime data. Walls include
// the border; crates block sight and movement; vents are alternate routes
// drawn as floor grates the guards never patrol.
export function buildLevel(index) {
  const def = LEVEL_DEFS[index];
  const toPx = (r) => ({
    x: r.x * TILE,
    y: r.y * TILE,
    w: r.w * TILE,
    h: r.h * TILE,
  });
  return {
    index,
    name: def.name,
    sub: def.sub,
    parSeconds: def.parSeconds,
    playerStart: tileCenter(def.playerStart.x, def.playerStart.y),
    exit: tileCenter(def.exit.x, def.exit.y),
    exitTile: def.exit,
    walls: borderWalls(def.exit).map(toPx).concat(def.walls.map(toPx)),
    crates: def.crates.map(toPx),
    shadows: def.shadows.map(toPx),
    vents: def.vents.map(toPx),
    guards: def.guards.map((g) => ({
      path: g.path.map(([tx, ty]) => tileCenter(tx, ty)),
      speed: g.speed,
      pause: g.pause,
    })),
    cameras: def.cameras.map((c) => ({
      x: c.x * TILE + TILE / 2,
      y: c.y * TILE + TILE / 2,
      baseAngle: c.baseAngle,
      sweep: c.sweep,
      range: c.range,
    })),
    loot: def.loot.map((l) => ({
      kind: l.kind,
      x: l.x * TILE + TILE / 2,
      y: l.y * TILE + TILE / 2,
      value: l.value,
      label: l.label,
      taken: false,
    })),
    vault: def.vault
      ? {
          x: def.vault.x * TILE + TILE / 2,
          y: def.vault.y * TILE + TILE / 2,
          value: def.vault.value,
          label: def.vault.label,
          pickSeconds: def.vault.pickSeconds,
          opened: false,
          progress: 0,
        }
      : null,
  };
}

// Point inside any rectangle of a list (walls or crates).
export function pointInRects(px, py, rects) {
  for (const r of rects) {
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return true;
  }
  return false;
}

// True when a circle of radius r centred at (px, py) overlaps a wall.
export function circleHitsWalls(px, py, r, walls) {
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(px, w.x + w.w));
    const cy = Math.max(w.y, Math.min(py, w.y + w.h));
    const dx = px - cx;
    const dy = py - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}
