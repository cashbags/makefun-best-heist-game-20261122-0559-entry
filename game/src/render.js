// render.js — everything MIDNIGHT VAULT draws on its canvas.
//
// One frame shows the whole heist at a glance: the room the thief is
// crossing, the guards and their vision cones, the sweeping cameras, the
// loot target, the exit, and the alarm meter across the top. The look is
// a night museum: dark parquet, brass and stone, with safe cover, danger
// and loot each in its own unmistakable colour. Pure canvas drawing.

import { rayToWall } from './vision.js';
import { TILE } from './levels.js';

const W = 1280;
const H = 720;
const HUD_H = 52;

function alarmColour(alarm) {
  if (alarm >= 80) return '#ff453a';
  if (alarm >= 50) return '#ff9f0a';
  if (alarm >= 20) return '#ffd60a';
  return '#30d158';
}

function drawFloor(g, level, rngSeed) {
  // Parquet checker with a seeded speckle so the floor never looks flat.
  for (let ty = 0; ty < 18; ty += 1) {
    for (let tx = 0; tx < 32; tx += 1) {
      const even = (tx + ty) % 2 === 0;
      g.fillStyle = even ? '#2b2118' : '#251c13';
      g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  let s = rngSeed;
  const speck = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  g.fillStyle = 'rgba(255, 220, 150, 0.05)';
  for (let i = 0; i < 220; i += 1) {
    g.fillRect(speck() * W, HUD_H + speck() * (H - HUD_H), 2, 2);
  }
  // Vents: dark floor grates the thief can slip through.
  for (const v of level.vents) {
    g.fillStyle = '#14100c';
    g.fillRect(v.x, v.y, v.w, v.h);
    g.strokeStyle = '#5a4632';
    g.lineWidth = 2;
    for (let i = 1; i < 6; i += 1) {
      const x = v.x + (v.w / 6) * i;
      g.beginPath();
      g.moveTo(x, v.y + 4);
      g.lineTo(x, v.y + v.h - 4);
      g.stroke();
    }
  }
  // Shadow patches: dark floor where suspicion fills half as fast.
  for (const sh of level.shadows) {
    g.fillStyle = 'rgba(0, 0, 0, 0.42)';
    g.fillRect(sh.x, sh.y, sh.w, sh.h);
    g.strokeStyle = 'rgba(140, 160, 255, 0.18)';
    g.lineWidth = 1;
    g.strokeRect(sh.x + 1, sh.y + 1, sh.w - 2, sh.h - 2);
  }
}

function drawWallsAndCrates(g, level) {
  for (const w of level.walls) {
    g.fillStyle = '#3d4252';
    g.fillRect(w.x, w.y, w.w, w.h);
    g.fillStyle = '#565e73';
    g.fillRect(w.x, w.y, w.w, 4);
    g.strokeStyle = '#23262f';
    g.lineWidth = 1;
    g.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }
  for (const c of level.crates) {
    g.fillStyle = '#6b4a26';
    g.fillRect(c.x, c.y, c.w, c.h);
    g.fillStyle = '#8a6136';
    g.fillRect(c.x, c.y, c.w, 5);
    g.strokeStyle = '#3d2a14';
    g.lineWidth = 2;
    g.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    g.beginPath();
    g.moveTo(c.x, c.y);
    g.lineTo(c.x + c.w, c.y + c.h);
    g.moveTo(c.x + c.w, c.y);
    g.lineTo(c.x, c.y + c.h);
    g.stroke();
  }
}

function drawCone(g, x, y, facing, halfAngle, range, blockers, fill, edge) {
  const steps = 14;
  g.beginPath();
  g.moveTo(x, y);
  for (let i = 0; i <= steps; i += 1) {
    const a = facing - halfAngle + (2 * halfAngle * i) / steps;
    const d = rayToWall(x, y, a, range, blockers);
    g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = edge;
  g.lineWidth = 1.5;
  g.stroke();
}

function drawGuards(g, state, blockers) {
  for (const guard of state.guards) {
    const sus = state.detection.suspicion.get(guard.id) || 0;
    const hot = state.detection.alerted || sus >= 50;
    const fill = state.detection.alerted
      ? 'rgba(255, 60, 60, 0.26)'
      : hot
        ? 'rgba(255, 150, 60, 0.24)'
        : 'rgba(255, 220, 80, 0.22)';
    const edge = state.detection.alerted ? 'rgba(255, 60, 60, 0.65)' : 'rgba(255, 220, 80, 0.6)';
    drawCone(g, guard.x, guard.y, guard.facing, 0.61, 260, blockers, fill, edge);
    // Guard body: navy uniform, brass buttons, facing tick.
    g.fillStyle = '#2c3e6e';
    g.beginPath();
    g.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#d9b45b';
    g.lineWidth = 2;
    g.stroke();
    g.strokeStyle = '#e8ecf5';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(guard.x, guard.y);
    g.lineTo(guard.x + Math.cos(guard.facing) * 16, guard.y + Math.sin(guard.facing) * 16);
    g.stroke();
    // "!" while this guard is onto the thief.
    if (sus >= 50) {
      g.fillStyle = hot ? '#ff453a' : '#ffd60a';
      g.font = 'bold 22px sans-serif';
      g.textAlign = 'center';
      g.fillText('!', guard.x, guard.y - 20);
    }
    // Suspicion pip above a guard that has started to notice.
    if (sus > 5 && sus < 50) {
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.fillRect(guard.x - 14, guard.y - 34, 28, 5);
      g.fillStyle = '#ffd60a';
      g.fillRect(guard.x - 13, guard.y - 33, 26 * (sus / 100), 3);
    }
  }
}

function drawCameras(g, state, blockers) {
  for (const cam of state.cameras) {
    const frozen = cam.frozen > 0;
    const sus = state.detection.suspicion.get(cam.id) || 0;
    const fill = frozen
      ? 'rgba(120, 130, 150, 0.08)'
      : sus >= 50
        ? 'rgba(255, 60, 60, 0.22)'
        : 'rgba(80, 220, 255, 0.19)';
    const edge = frozen ? 'rgba(150,160,180,0.35)' : 'rgba(80, 220, 255, 0.65)';
    drawCone(g, cam.x, cam.y, cam.facing, cam.halfAngle, cam.range, blockers, fill, edge);
    g.fillStyle = frozen ? '#5a6270' : '#1d2b33';
    g.fillRect(cam.x - 9, cam.y - 7, 18, 14);
    g.strokeStyle = frozen ? '#9aa4b2' : '#4dd8ff';
    g.lineWidth = 2;
    g.strokeRect(cam.x - 9, cam.y - 7, 18, 14);
    g.fillStyle = frozen ? '#9aa4b2' : sus >= 50 ? '#ff453a' : '#ff3b30';
    g.beginPath();
    g.arc(cam.x + Math.cos(cam.facing) * 4, cam.y + Math.sin(cam.facing) * 4, 3, 0, Math.PI * 2);
    g.fill();
    if (frozen) {
      g.fillStyle = '#cfe8ff';
      g.font = 'bold 11px sans-serif';
      g.textAlign = 'center';
      g.fillText('EMP ' + Math.ceil(cam.frozen) + 's', cam.x, cam.y - 14);
    }
  }
}

function drawLoot(g, state) {
  for (const loot of state.level.loot) {
    if (loot.taken) continue;
    const pulse = 0.55 + 0.35 * Math.sin(state.time * 3 + loot.x);
    g.save();
    g.shadowColor = '#ffd60a';
    g.shadowBlur = 18 * pulse;
    if (loot.kind === 'crown') {
      g.fillStyle = '#ffd60a';
      g.beginPath();
      g.moveTo(loot.x - 14, loot.y + 8);
      g.lineTo(loot.x - 14, loot.y - 4);
      g.lineTo(loot.x - 7, loot.y + 3);
      g.lineTo(loot.x, loot.y - 10);
      g.lineTo(loot.x + 7, loot.y + 3);
      g.lineTo(loot.x + 14, loot.y - 4);
      g.lineTo(loot.x + 14, loot.y + 8);
      g.closePath();
      g.fill();
    } else if (loot.kind === 'gem') {
      g.fillStyle = '#4dd8ff';
      g.beginPath();
      g.moveTo(loot.x, loot.y - 12);
      g.lineTo(loot.x + 10, loot.y);
      g.lineTo(loot.x, loot.y + 12);
      g.lineTo(loot.x - 10, loot.y);
      g.closePath();
      g.fill();
    } else {
      g.fillStyle = '#c98a2e';
      g.fillRect(loot.x - 13, loot.y - 9, 26, 18);
      g.strokeStyle = '#ffd60a';
      g.lineWidth = 2;
      g.strokeRect(loot.x - 13, loot.y - 9, 26, 18);
      g.fillStyle = '#5b7fa6';
      g.fillRect(loot.x - 9, loot.y - 5, 18, 10);
    }
    g.restore();
    g.fillStyle = '#ffe9a8';
    g.font = '11px sans-serif';
    g.textAlign = 'center';
    g.fillText(loot.label, loot.x, loot.y + 26);
  }
  const vault = state.level.vault;
  if (vault && !vault.opened) {
    g.save();
    g.shadowColor = '#b8c4d6';
    g.shadowBlur = 14;
    g.fillStyle = '#7d8899';
    g.fillRect(vault.x - 18, vault.y - 18, 36, 36);
    g.strokeStyle = '#3a4150';
    g.lineWidth = 3;
    g.strokeRect(vault.x - 18, vault.y - 18, 36, 36);
    g.beginPath();
    g.arc(vault.x, vault.y, 8, 0, Math.PI * 2);
    g.fillStyle = '#2c313d';
    g.fill();
    g.restore();
    g.fillStyle = '#dfe6f2';
    g.font = '11px sans-serif';
    g.textAlign = 'center';
    g.fillText(vault.label + ' — hold F', vault.x, vault.y + 34);
    if (vault.progress > 0) {
      g.fillStyle = 'rgba(0,0,0,0.65)';
      g.fillRect(vault.x - 26, vault.y - 30, 52, 7);
      g.fillStyle = '#30d158';
      g.fillRect(vault.x - 25, vault.y - 29, 50 * vault.progress, 5);
    }
  }
}

function drawExit(g, state) {
  const open = state.lootLeft === 0;
  const x = state.level.exit.x;
  const y = state.level.exit.y;
  const glow = open ? 0.6 + 0.4 * Math.sin(state.time * 4) : 0.25;
  g.save();
  g.shadowColor = open ? '#30d158' : '#888888';
  g.shadowBlur = 16 * glow;
  g.fillStyle = open ? '#30d158' : '#6a6a6a';
  g.fillRect(x - 12, y - 26, 24, 52);
  g.restore();
  g.fillStyle = '#0c2b16';
  g.font = 'bold 11px sans-serif';
  g.textAlign = 'center';
  g.fillText('EXIT', x, y + 4);
  if (!open) {
    g.fillStyle = '#e8ecf5';
    g.font = '11px sans-serif';
    g.fillText('LOCKED — loot ' + state.lootLeft + ' left', x - 30, y + 42);
  }
}

function drawPlayer(g, state) {
  const p = state.player;
  g.save();
  if (p.sneaking) g.globalAlpha = 0.85;
  g.shadowColor = '#ffb340';
  g.shadowBlur = 12;
  g.fillStyle = '#1d1a24';
  g.beginPath();
  g.arc(p.x, p.y, 13, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#ffb340';
  g.lineWidth = 2.5;
  g.stroke();
  g.restore();
  g.fillStyle = '#ffb340';
  g.beginPath();
  g.arc(p.x + Math.cos(p.facing) * 5, p.y + Math.sin(p.facing) * 5, 4, 0, Math.PI * 2);
  g.fill();
  if (p.sneaking) {
    g.fillStyle = '#cfe8ff';
    g.font = '10px sans-serif';
    g.textAlign = 'center';
    g.fillText('SNEAKING', p.x, p.y - 20);
  }
}

function drawPebbles(g, state) {
  for (const peb of state.pebbles) {
    g.fillStyle = '#c9c9c9';
    g.beginPath();
    g.arc(peb.x, peb.y, 4, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255, 220, 80, 0.7)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(peb.x, peb.y, 10 + (1 - peb.ttl / 0.5) * 14, 0, Math.PI * 2);
    g.stroke();
  }
}

function drawLastSeen(g, state) {
  if (!state.detection.alerted) return;
  const r = 12 + 4 * Math.sin(state.time * 6);
  g.strokeStyle = 'rgba(255, 69, 58, 0.9)';
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(state.detection.lastSeenX, state.detection.lastSeenY, r, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(state.detection.lastSeenX - 8, state.detection.lastSeenY - 8);
  g.lineTo(state.detection.lastSeenX + 8, state.detection.lastSeenY + 8);
  g.moveTo(state.detection.lastSeenX + 8, state.detection.lastSeenY - 8);
  g.lineTo(state.detection.lastSeenX - 8, state.detection.lastSeenY + 8);
  g.stroke();
  g.fillStyle = '#ff453a';
  g.font = 'bold 12px sans-serif';
  g.textAlign = 'center';
  g.fillText('LAST SEEN', state.detection.lastSeenX, state.detection.lastSeenY - 20);
}

function drawHud(g, state) {
  g.fillStyle = '#101319';
  g.fillRect(0, 0, W, HUD_H);
  g.fillStyle = '#e8ecf5';
  g.font = 'bold 17px sans-serif';
  g.textAlign = 'left';
  g.fillText('MIDNIGHT VAULT', 16, 22);
  g.font = '12px sans-serif';
  g.fillStyle = '#9aa4b2';
  g.fillText(state.level.name + '  ·  LEVEL ' + (state.levelIndex + 1) + '/3', 16, 40);
  g.font = 'bold 15px sans-serif';
  g.fillStyle = '#ffd60a';
  g.fillText('SCORE ' + state.score, 330, 24);
  g.fillStyle = '#e8ecf5';
  g.font = '13px sans-serif';
  g.fillText('LOOT ' + state.lootTaken + '/' + state.lootTotal, 330, 42);
  g.fillStyle = '#ff6b81';
  g.font = 'bold 16px sans-serif';
  g.fillText('♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, 3 - state.lives)), 470, 26);
  g.fillStyle = '#cfe8ff';
  g.font = '13px sans-serif';
  g.fillText('PEBBLES ' + state.pebbleCount + '  ·  EMP ' + state.empCount, 470, 43);
  // Alarm meter.
  const mx = 700;
  const mw = 260;
  g.fillStyle = '#e8ecf5';
  g.font = 'bold 13px sans-serif';
  g.textAlign = 'left';
  g.fillText('ALARM', mx, 22);
  g.fillStyle = 'rgba(255,255,255,0.14)';
  g.fillRect(mx, 28, mw, 12);
  g.fillStyle = alarmColour(state.detection.alarm);
  g.fillRect(mx, 28, mw * (state.detection.alarm / 100), 12);
  g.strokeStyle = '#e8ecf5';
  g.lineWidth = 1;
  g.strokeRect(mx + 0.5, 28.5, mw, 12);
  const status = state.detection.alerted
    ? 'ALERT — RUN!'
    : state.detection.alarm >= 50
      ? 'SPOTTED — HIDE!'
      : state.detection.alarm >= 15
        ? 'SUSPICIOUS…'
        : 'UNSEEN';
  g.fillStyle = alarmColour(state.detection.alarm);
  g.font = 'bold 13px sans-serif';
  g.fillText(status, mx + mw + 12, 39);
  // Timer.
  g.fillStyle = '#9aa4b2';
  g.font = '13px sans-serif';
  g.textAlign = 'right';
  g.fillText('TIME ' + Math.max(0, Math.ceil(state.timeLeft)) + 's', W - 16, 24);
  g.fillText('BEST ' + state.bestScore, W - 16, 42);
  g.textAlign = 'left';
  // Bottom hint bar.
  g.fillStyle = 'rgba(16, 19, 25, 0.85)';
  g.fillRect(0, H - 26, W, 26);
  g.fillStyle = '#9aa4b2';
  g.font = '12px sans-serif';
  g.fillText(
    'WASD / arrows move · SHIFT sneak · CLICK toss a pebble · E EMP freeze cameras · hold F pick the vault · P pause',
    16,
    H - 9,
  );
}

function panel(g, title, lines, accent) {
  g.fillStyle = 'rgba(8, 10, 14, 0.82)';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#101319';
  g.strokeStyle = accent;
  g.lineWidth = 2;
  const pw = 640;
  const ph = 120 + lines.length * 30;
  const px = (W - pw) / 2;
  const py = (H - ph) / 2;
  g.beginPath();
  g.roundRect(px, py, pw, ph, 12);
  g.fill();
  g.stroke();
  g.fillStyle = accent;
  g.font = 'bold 34px sans-serif';
  g.textAlign = 'center';
  g.fillText(title, W / 2, py + 52);
  g.fillStyle = '#e8ecf5';
  g.font = '16px sans-serif';
  lines.forEach((line, i) => {
    g.fillText(line, W / 2, py + 92 + i * 30);
  });
  g.textAlign = 'left';
}

export function drawGame(g, state) {
  g.clearRect(0, 0, W, H);
  const blockers = state.level.walls.concat(state.level.crates);
  drawFloor(g, state.level, 1234567 + state.levelIndex * 97);
  drawWallsAndCrates(g, state.level);
  drawGuards(g, state, blockers);
  drawCameras(g, state, blockers);
  drawLoot(g, state);
  drawExit(g, state);
  drawPebbles(g, state);
  drawLastSeen(g, state);
  drawPlayer(g, state);
  drawHud(g, state);

  if (state.screen === 'title') {
    panel(g, 'MIDNIGHT VAULT', [
      'A three-room heist. Steal every painting, gem and crown,',
      'crack the vaults, and slip out the green exit — unseen.',
      'Guards patrol with vision cones. Cameras sweep the halls.',
      'The alarm meter is your heartbeat. Hide in the shadows.',
      '',
      'Press ENTER to start the heist',
    ], '#ffd60a');
  } else if (state.screen === 'levelclear') {
    panel(g, 'ROOM CLEARED', [
      state.level.name + ' — loot secured.',
      'Level bonus +' + state.lastLevelBonus + '  ·  Time bonus +' + state.lastTimeBonus,
      state.lastGhost ? 'GHOST bonus +300 — never spotted!' : 'Spotted once — no ghost bonus this room.',
      '',
      'Press ENTER for the next room',
    ], '#30d158');
  } else if (state.screen === 'win') {
    panel(g, 'THE PERFECT HEIST', [
      'Every room emptied. The Crown of Aldermere is yours.',
      'Final score ' + state.score + '  ·  Best ' + state.bestScore,
      'Loot ' + state.lootTaken + '/' + state.lootTotal + '  ·  Lives left ' + state.lives,
      '',
      'Press ENTER to run it again',
    ], '#ffd60a');
  } else if (state.screen === 'caught') {
    panel(g, 'CAUGHT!', [
      'A guard got hands on you in the middle of the alarm.',
      'Lives left: ' + state.lives,
      '',
      'Press ENTER to slip back to the door and try again',
    ], '#ff453a');
  } else if (state.screen === 'gameover') {
    panel(g, 'THE CREW WALKS AWAY', [
      'Three strikes — the museum keeps its treasures tonight.',
      'Score ' + state.score + '  ·  Best ' + state.bestScore,
      '',
      'Press ENTER to plan the next heist',
    ], '#ff453a');
  } else if (state.screen === 'paused') {
    panel(g, 'PAUSED', ['The guards wait. The cameras keep sweeping.', '', 'Press P to resume'], '#4dd8ff');
  }
}
