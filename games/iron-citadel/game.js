const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const messageBar = document.getElementById("messageBar");
const objectiveText = document.getElementById("objectiveText");
const healthValue = document.getElementById("healthValue");
const ammoValue = document.getElementById("ammoValue");
const killsValue = document.getElementById("killsValue");
const damageVignette = document.getElementById("damageVignette");

const movePad = document.getElementById("movePad");
const lookPad = document.getElementById("lookPad");
const moveKnob = document.getElementById("moveKnob");
const lookKnob = document.getElementById("lookKnob");
const fireButton = document.getElementById("fireButton");

const FOV = Math.PI / 3;
const MAX_DEPTH = 24;
const PLAYER_RADIUS = 0.22;
const MOBILE_ACTIVE = matchMedia("(pointer: coarse)").matches;

const mapBlueprint = [
  "1111111111111111",
  "1s...2.....a...1",
  "1.11.2.11111.1.1",
  "1.e..2....e..1.1",
  "1.111111.111.1.1",
  "1.....3..h...1.1",
  "1.111.3.1111.1.1",
  "1...e.3......1.1",
  "1.111.33333111.1",
  "1...1.....1....1",
  "1.e.11111.1.11.1",
  "1...1...a.1..e.1",
  "1.111.11111.1111",
  "1.....h.....e..1",
  "1...a....e.....1",
  "1111111111111111"
];

const inputState = {
  forward: 0,
  strafe: 0,
  turn: 0,
  firing: false
};

const keyState = Object.create(null);
const touchState = {
  moveId: null,
  lookId: null,
  moveX: 0,
  moveY: 0,
  lookX: 0
};

const state = {
  map: [],
  pickups: [],
  enemies: [],
  totalEnemies: 0,
  player: null,
  started: false,
  ended: false,
  won: false,
  lastTime: 0,
  fireCooldown: 0,
  muzzleFlash: 0,
  damageFlash: 0,
  headBob: 0,
  messageTimer: 0,
  audioReady: false,
  audioContext: null
};

const textures = createTextures();

function createTextures() {
  return {
    wall1: createWallTexture((g) => {
      g.fillStyle = "#3e4045";
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = "#61656a";
      for (let y = 0; y < 64; y += 8) {
        g.fillRect(0, y, 64, 1);
      }
      g.fillStyle = "#1d2025";
      for (let x = 0; x < 64; x += 16) {
        g.fillRect(x, 0, 3, 64);
      }
      g.fillStyle = "#ff7a32";
      for (let y = 6; y < 64; y += 16) {
        g.fillRect(24, y, 16, 3);
      }
    }),
    wall2: createWallTexture((g) => {
      g.fillStyle = "#5f2f24";
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = "#7d4030";
      for (let y = 0; y < 64; y += 16) {
        for (let x = (y / 16) % 2 === 0 ? 0 : 8; x < 64; x += 16) {
          g.fillRect(x, y, 14, 12);
        }
      }
      g.fillStyle = "#29110d";
      for (let y = 0; y < 64; y += 16) {
        g.fillRect(0, y + 12, 64, 2);
      }
    }),
    wall3: createWallTexture((g) => {
      g.fillStyle = "#23303d";
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = "#0d1721";
      for (let y = 0; y < 64; y += 8) {
        g.fillRect(0, y, 64, 2);
      }
      g.fillStyle = "#66d9ef";
      for (let x = 4; x < 64; x += 12) {
        g.fillRect(x, 0, 4, 64);
      }
      g.fillStyle = "#f3a43d";
      g.fillRect(8, 26, 48, 12);
    }),
    enemy: createEnemyTexture(),
    medkit: createPickupTexture("#d74545", "#fff4ea"),
    ammo: createAmmoTexture(),
    shotgun: createWeaponTexture(),
    sky: createSkyTexture()
  };
}

function createWallTexture(painter) {
  const texture = document.createElement("canvas");
  texture.width = 64;
  texture.height = 64;
  painter(texture.getContext("2d"));
  return texture;
}

function createEnemyTexture() {
  const texture = document.createElement("canvas");
  texture.width = 64;
  texture.height = 64;
  const g = texture.getContext("2d");

  g.fillStyle = "#190202";
  g.fillRect(12, 20, 40, 40);
  g.fillStyle = "#70140f";
  g.fillRect(16, 18, 32, 30);
  g.fillStyle = "#b52818";
  g.fillRect(20, 24, 24, 20);
  g.fillStyle = "#f0d0a5";
  g.fillRect(23, 28, 5, 5);
  g.fillRect(36, 28, 5, 5);
  g.fillStyle = "#ffeb7a";
  g.fillRect(24, 29, 3, 3);
  g.fillRect(37, 29, 3, 3);
  g.fillStyle = "#2d0906";
  g.fillRect(28, 36, 8, 3);
  g.beginPath();
  g.moveTo(20, 22);
  g.lineTo(8, 10);
  g.lineTo(14, 28);
  g.fill();
  g.beginPath();
  g.moveTo(44, 22);
  g.lineTo(56, 10);
  g.lineTo(50, 28);
  g.fill();
  g.fillRect(10, 44, 12, 14);
  g.fillRect(42, 44, 12, 14);
  g.fillRect(24, 44, 16, 12);
  return texture;
}

function createPickupTexture(base, accent) {
  const texture = document.createElement("canvas");
  texture.width = 64;
  texture.height = 64;
  const g = texture.getContext("2d");
  g.fillStyle = "#13171d";
  g.fillRect(10, 10, 44, 44);
  g.fillStyle = base;
  g.fillRect(14, 14, 36, 36);
  g.fillStyle = accent;
  g.fillRect(28, 18, 8, 28);
  g.fillRect(18, 28, 28, 8);
  return texture;
}

function createAmmoTexture() {
  const texture = document.createElement("canvas");
  texture.width = 64;
  texture.height = 64;
  const g = texture.getContext("2d");
  g.fillStyle = "#15181c";
  g.fillRect(8, 18, 48, 28);
  g.fillStyle = "#d39a24";
  g.fillRect(12, 20, 40, 24);
  g.fillStyle = "#55360b";
  for (let x = 14; x < 50; x += 8) {
    g.fillRect(x, 22, 4, 20);
  }
  g.fillStyle = "#ffe39c";
  g.fillRect(12, 20, 40, 4);
  return texture;
}

function createWeaponTexture() {
  const texture = document.createElement("canvas");
  texture.width = 256;
  texture.height = 160;
  const g = texture.getContext("2d");

  g.fillStyle = "#18120f";
  g.fillRect(86, 40, 84, 88);
  g.fillStyle = "#3c444d";
  g.fillRect(72, 28, 112, 48);
  g.fillStyle = "#6c7782";
  g.fillRect(94, 20, 68, 22);
  g.fillStyle = "#d06d28";
  g.fillRect(116, 76, 28, 50);
  g.fillStyle = "#2a2d31";
  g.fillRect(104, 100, 52, 18);
  g.fillStyle = "#7a1a12";
  g.fillRect(84, 118, 88, 22);
  return texture;
}

function createSkyTexture() {
  const texture = document.createElement("canvas");
  texture.width = 1024;
  texture.height = 256;
  const g = texture.getContext("2d");

  const gradient = g.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#311313");
  gradient.addColorStop(0.45, "#8c4320");
  gradient.addColorStop(1, "#d8732e");
  g.fillStyle = gradient;
  g.fillRect(0, 0, 1024, 256);

  g.fillStyle = "rgba(255, 212, 140, 0.85)";
  g.beginPath();
  g.arc(780, 88, 36, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "rgba(52, 20, 17, 0.75)";
  for (let x = 0; x < 1024; x += 48) {
    const height = 30 + ((x / 48) % 5) * 15;
    g.fillRect(x, 200 - height, 40, height + 60);
    g.fillRect(x + 12, 182 - height, 10, 8);
  }

  g.fillStyle = "rgba(255, 164, 78, 0.3)";
  for (let x = 0; x < 1024; x += 64) {
    g.fillRect(x, 176, 20, 2);
  }

  return texture;
}

function buildLevel() {
  state.map = [];
  state.pickups = [];
  state.enemies = [];

  for (let y = 0; y < mapBlueprint.length; y += 1) {
    const row = [];
    for (let x = 0; x < mapBlueprint[y].length; x += 1) {
      const tile = mapBlueprint[y][x];
      if (tile === "s") {
        state.player = {
          x: x + 0.5,
          y: y + 0.5,
          angle: 0,
          health: 100,
          ammo: 24,
          kills: 0,
          speed: 0
        };
        row.push("0");
      } else if (tile === "e") {
        state.enemies.push({
          x: x + 0.5,
          y: y + 0.5,
          health: 100,
          attackCooldown: Math.random() * 0.9,
          hitFlash: 0,
          alive: true,
          stride: Math.random() * Math.PI * 2
        });
        row.push("0");
      } else if (tile === "h" || tile === "a") {
        state.pickups.push({
          kind: tile === "h" ? "medkit" : "ammo",
          x: x + 0.5,
          y: y + 0.5,
          bob: Math.random() * Math.PI * 2,
          taken: false
        });
        row.push("0");
      } else {
        row.push(tile === "." ? "0" : tile);
      }
    }
    state.map.push(row);
  }

  state.totalEnemies = state.enemies.length;
}

function resetGame() {
  buildLevel();
  state.started = true;
  state.ended = false;
  state.won = false;
  state.lastTime = 0;
  state.fireCooldown = 0;
  state.muzzleFlash = 0;
  state.damageFlash = 0;
  state.headBob = 0;
  hideOverlay();
  updateHud();
  setMessage("포인터를 잠그고 전진하십시오.", 3);
  objectiveText.textContent = "성채 내부 악마 병력을 모두 제거하십시오.";
}

function showOverlay(title, copy, buttonText) {
  overlay.classList.add("visible");
  overlay.querySelector("h1").textContent = title;
  overlay.querySelector(".overlay-copy").textContent = copy;
  startButton.textContent = buttonText;
}

function hideOverlay() {
  overlay.classList.remove("visible");
}

function setMessage(text, duration = 2.2) {
  state.messageTimer = duration;
  messageBar.textContent = text;
}

function updateHud() {
  healthValue.textContent = Math.max(0, Math.ceil(state.player.health));
  ammoValue.textContent = state.player.ammo;
  killsValue.textContent = `${state.player.kills} / ${state.totalEnemies}`;
}

function resizeCanvas() {
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;
  const aspect = displayHeight / displayWidth;
  canvas.width = clamp(Math.floor(displayWidth * 0.44), 320, 560);
  canvas.height = clamp(Math.floor(canvas.width * aspect), 180, 340);
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  ctx.imageSmoothingEnabled = false;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wrapAngle(angle) {
  while (angle < -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;
  return angle;
}

function getWallAt(x, y) {
  if (x < 0 || y < 0 || y >= state.map.length || x >= state.map[0].length) {
    return "1";
  }
  return state.map[y][x];
}

function isWall(x, y) {
  return getWallAt(Math.floor(x), Math.floor(y)) !== "0";
}

function canMoveTo(x, y) {
  return !(
    isWall(x - PLAYER_RADIUS, y - PLAYER_RADIUS) ||
    isWall(x + PLAYER_RADIUS, y - PLAYER_RADIUS) ||
    isWall(x - PLAYER_RADIUS, y + PLAYER_RADIUS) ||
    isWall(x + PLAYER_RADIUS, y + PLAYER_RADIUS)
  );
}

function castRay(angle) {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  let mapX = Math.floor(state.player.x);
  let mapY = Math.floor(state.player.y);

  const deltaDistX = rayDirX === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirX);
  const deltaDistY = rayDirY === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirY);

  let sideDistX;
  let sideDistY;
  let stepX;
  let stepY;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (state.player.x - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - state.player.x) * deltaDistX;
  }

  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (state.player.y - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - state.player.y) * deltaDistY;
  }

  let side = 0;
  let wallType = "1";
  let distance = MAX_DEPTH;

  while (distance < MAX_DEPTH + 1) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }

    wallType = getWallAt(mapX, mapY);
    if (wallType !== "0") {
      distance = side === 0
        ? (mapX - state.player.x + (1 - stepX) / 2) / rayDirX
        : (mapY - state.player.y + (1 - stepY) / 2) / rayDirY;
      break;
    }
  }

  const hitX = state.player.x + rayDirX * distance;
  const hitY = state.player.y + rayDirY * distance;
  const wallX = side === 0 ? hitY - Math.floor(hitY) : hitX - Math.floor(hitX);

  return {
    distance: Math.max(0.0001, distance),
    wallType,
    side,
    wallX
  };
}

function hasLineOfSight(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);
  const steps = Math.ceil(distance / 0.12);

  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (isWall(fromX + dx * t, fromY + dy * t)) {
      return false;
    }
  }

  return true;
}

function fireWeapon() {
  if (state.fireCooldown > 0 || state.ended) {
    return;
  }
  if (state.player.ammo <= 0) {
    state.fireCooldown = 0.18;
    setMessage("탄약이 바닥났습니다.", 1.2);
    playTone("dry");
    return;
  }

  state.player.ammo -= 1;
  state.fireCooldown = 0.24;
  state.muzzleFlash = 0.08;
  updateHud();
  playTone("shot");

  let target = null;
  let bestDistance = Infinity;

  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    const angleToEnemy = wrapAngle(Math.atan2(dy, dx) - state.player.angle);
    const hitCone = Math.atan2(0.45, distance) * 1.15;

    if (Math.abs(angleToEnemy) < hitCone && distance < bestDistance) {
      if (hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) {
        target = enemy;
        bestDistance = distance;
      }
    }
  }

  if (!target) {
    return;
  }

  target.health -= 40;
  target.hitFlash = 0.12;
  playTone("hit");

  if (target.health <= 0) {
    target.alive = false;
    state.player.kills += 1;
    updateHud();
    setMessage("타겟 제거 완료.", 1.4);
    maybeDropPickup(target.x, target.y);
    playTone("kill");
  }

  if (state.player.kills === state.totalEnemies) {
    state.ended = true;
    state.won = true;
    objectiveText.textContent = "지역 정화 완료. 성채를 장악했습니다.";
    showOverlay("AREA CLEARED", "모든 목표를 제거했습니다. 다시 시작해 더 빠르게 클리어할 수 있습니다.", "다시 시작");
  }
}

function maybeDropPickup(x, y) {
  const roll = Math.random();
  if (roll < 0.45) {
    state.pickups.push({
      kind: roll < 0.22 ? "medkit" : "ammo",
      x,
      y,
      bob: Math.random() * Math.PI * 2,
      taken: false
    });
  }
}

function updateInputFromKeys() {
  const forward = (keyState.KeyW ? 1 : 0) - (keyState.KeyS ? 1 : 0);
  const strafe = (keyState.KeyD ? 1 : 0) - (keyState.KeyA ? 1 : 0);
  const turn = (keyState.ArrowRight ? 1 : 0) - (keyState.ArrowLeft ? 1 : 0);

  inputState.forward = clamp(forward + (-touchState.moveY), -1, 1);
  inputState.strafe = clamp(strafe + touchState.moveX, -1, 1);
  inputState.turn = clamp(turn + touchState.lookX * 1.5, -1.6, 1.6);
}

function updateGame(deltaTime) {
  if (!state.started || state.ended) {
    return;
  }

  state.fireCooldown = Math.max(0, state.fireCooldown - deltaTime);
  state.muzzleFlash = Math.max(0, state.muzzleFlash - deltaTime);
  state.damageFlash = Math.max(0, state.damageFlash - deltaTime);

  if (state.messageTimer > 0) {
    state.messageTimer = Math.max(0, state.messageTimer - deltaTime);
    if (state.messageTimer === 0) {
      messageBar.textContent = "계속 전진하십시오.";
    }
  }

  const turnSpeed = MOBILE_ACTIVE ? 1.8 : 1.55;
  state.player.angle = wrapAngle(state.player.angle + inputState.turn * turnSpeed * deltaTime);

  const moveSpeed = (keyState.ShiftLeft || keyState.ShiftRight ? 4.6 : 3.2) * deltaTime;
  const forwardX = Math.cos(state.player.angle);
  const forwardY = Math.sin(state.player.angle);
  const sideX = Math.cos(state.player.angle + Math.PI / 2);
  const sideY = Math.sin(state.player.angle + Math.PI / 2);

  const moveX = (forwardX * inputState.forward + sideX * inputState.strafe) * moveSpeed;
  const moveY = (forwardY * inputState.forward + sideY * inputState.strafe) * moveSpeed;
  const nextX = state.player.x + moveX;
  const nextY = state.player.y + moveY;

  if (canMoveTo(nextX, state.player.y)) {
    state.player.x = nextX;
  }
  if (canMoveTo(state.player.x, nextY)) {
    state.player.y = nextY;
  }

  state.player.speed = Math.hypot(moveX, moveY) / Math.max(deltaTime, 0.0001);
  state.headBob += state.player.speed * deltaTime * 0.09;

  if ((keyState.Space || inputState.firing) && state.fireCooldown <= 0) {
    fireWeapon();
  }

  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }

    enemy.hitFlash = Math.max(0, enemy.hitFlash - deltaTime);
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - deltaTime);

    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const canSeePlayer = distance < 10 && hasLineOfSight(enemy.x, enemy.y, state.player.x, state.player.y);

    if (distance > 1.05 && canSeePlayer) {
      const speed = 1.08 * deltaTime;
      const stepX = (dx / distance) * speed;
      const stepY = (dy / distance) * speed;
      if (canMoveTo(enemy.x + stepX, enemy.y)) {
        enemy.x += stepX;
      }
      if (canMoveTo(enemy.x, enemy.y + stepY)) {
        enemy.y += stepY;
      }
    }

    if (distance <= 1.35 && enemy.attackCooldown <= 0) {
      enemy.attackCooldown = 1.1;
      state.player.health -= 12 + Math.random() * 5;
      state.damageFlash = 0.35;
      damageVignette.style.opacity = "1";
      setMessage("피해를 입었습니다. 거리를 벌리십시오.", 1.2);
      playTone("hurt");
      updateHud();

      if (state.player.health <= 0) {
        state.player.health = 0;
        updateHud();
        state.ended = true;
        objectiveText.textContent = "작전 실패. 성채를 다시 돌파해야 합니다.";
        showOverlay("SYSTEM FAILURE", "악마 병력에게 제압당했습니다. 탄약을 관리하고 거리를 유지하십시오.", "재도전");
      }
    }
  }

  for (const pickup of state.pickups) {
    if (pickup.taken) {
      continue;
    }
    pickup.bob += deltaTime * 3.2;
    const distance = Math.hypot(state.player.x - pickup.x, state.player.y - pickup.y);
    if (distance < 0.72) {
      pickup.taken = true;
      if (pickup.kind === "medkit") {
        state.player.health = Math.min(100, state.player.health + 30);
        setMessage("의료 키트 확보. 생명력 회복.", 1.2);
      } else {
        state.player.ammo += 10;
        setMessage("탄약 상자 확보.", 1.2);
      }
      updateHud();
      playTone("pickup");
    }
  }

  damageVignette.style.opacity = String(state.damageFlash * 2.2);
}

function renderScene() {
  const width = canvas.width;
  const height = canvas.height;
  const halfHeight = height * 0.5;
  const bobOffset = Math.sin(state.headBob) * 4;

  drawSky(width, halfHeight);

  const floorGradient = ctx.createLinearGradient(0, halfHeight, 0, height);
  floorGradient.addColorStop(0, "#442414");
  floorGradient.addColorStop(0.48, "#15171d");
  floorGradient.addColorStop(1, "#040608");
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, halfHeight, width, halfHeight);

  ctx.fillStyle = "rgba(255, 174, 81, 0.05)";
  for (let y = halfHeight + 8; y < height; y += 12) {
    ctx.fillRect(0, y + bobOffset * 0.18, width, 1);
  }

  const zBuffer = new Array(width);
  for (let column = 0; column < width; column += 1) {
    const rayAngle = state.player.angle - FOV / 2 + (column / width) * FOV;
    const hit = castRay(rayAngle);
    const lineHeight = Math.min(height * 2.2, height / hit.distance);
    const drawStart = Math.floor((height - lineHeight) / 2 + bobOffset);
    const texture = textures[`wall${hit.wallType}`] || textures.wall1;
    const textureX = Math.floor(hit.wallX * (texture.width - 1));

    ctx.drawImage(texture, textureX, 0, 1, texture.height, column, drawStart, 1, lineHeight);

    const shade = clamp((hit.distance / MAX_DEPTH) * 0.92 + (hit.side ? 0.12 : 0), 0, 0.92);
    ctx.fillStyle = `rgba(3, 5, 8, ${shade})`;
    ctx.fillRect(column, drawStart, 1, lineHeight);
    zBuffer[column] = hit.distance;
  }

  renderSprites(zBuffer, bobOffset);
  renderWeapon(width, height);
  renderMinimap();
}

function drawSky(width, halfHeight) {
  const skyScroll = ((state.player.angle / (Math.PI * 2)) * textures.sky.width) % textures.sky.width;
  const scaledHeight = halfHeight + 24;
  for (let i = -1; i <= 1; i += 1) {
    ctx.drawImage(textures.sky, i * textures.sky.width - skyScroll * 1.3, 0, textures.sky.width, scaledHeight);
  }

  const haze = ctx.createLinearGradient(0, halfHeight - 30, 0, halfHeight + 40);
  haze.addColorStop(0, "rgba(255, 204, 154, 0)");
  haze.addColorStop(1, "rgba(255, 165, 96, 0.18)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, halfHeight + 40);
}

function renderSprites(zBuffer, bobOffset) {
  const visible = [];

  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    visible.push({
      kind: "enemy",
      x: enemy.x,
      y: enemy.y,
      dx,
      dy,
      distance: Math.hypot(dx, dy),
      bob: Math.sin(enemy.stride + state.lastTime * 0.002) * 3,
      flash: enemy.hitFlash
    });
  }

  for (const pickup of state.pickups) {
    if (pickup.taken) {
      continue;
    }
    const dx = pickup.x - state.player.x;
    const dy = pickup.y - state.player.y;
    visible.push({
      kind: pickup.kind,
      x: pickup.x,
      y: pickup.y,
      dx,
      dy,
      distance: Math.hypot(dx, dy),
      bob: Math.sin(pickup.bob) * 6,
      flash: 0
    });
  }

  visible
    .filter((entity) => entity.distance > 0.2)
    .sort((a, b) => b.distance - a.distance)
    .forEach((entity) => drawSprite(entity, zBuffer, bobOffset));
}

function drawSprite(entity, zBuffer, bobOffset) {
  const angle = wrapAngle(Math.atan2(entity.dy, entity.dx) - state.player.angle);
  if (Math.abs(angle) > FOV * 0.7) {
    return;
  }

  const texture = entity.kind === "enemy"
    ? textures.enemy
    : entity.kind === "medkit"
      ? textures.medkit
      : textures.ammo;

  const screenX = (0.5 + angle / FOV) * canvas.width;
  const spriteScale = entity.kind === "enemy" ? 0.95 : 0.55;
  const spriteSize = clamp((canvas.height / entity.distance) * spriteScale, 12, canvas.height * 1.4);
  const top = canvas.height / 2 - spriteSize * 0.56 + bobOffset + entity.bob;
  const left = screenX - spriteSize / 2;
  const right = screenX + spriteSize / 2;

  for (let stripe = Math.max(0, Math.floor(left)); stripe < Math.min(canvas.width, Math.floor(right)); stripe += 1) {
    if (entity.distance >= zBuffer[stripe]) {
      continue;
    }
    const sampleX = Math.floor(((stripe - left) / spriteSize) * texture.width);
    ctx.save();
    if (entity.flash > 0) {
      ctx.filter = "brightness(1.8)";
    }
    ctx.drawImage(texture, sampleX, 0, 1, texture.height, stripe, top, 1, spriteSize);
    ctx.restore();
  }
}

function renderWeapon(width, height) {
  const bobX = Math.sin(state.headBob * 0.8) * 10;
  const bobY = Math.abs(Math.cos(state.headBob * 1.1)) * 8;
  const muzzleScale = state.muzzleFlash > 0 ? 1 + state.muzzleFlash * 1.6 : 1;
  const weaponWidth = 230 * muzzleScale;
  const weaponHeight = 144 * muzzleScale;
  const weaponX = width / 2 - weaponWidth / 2 + bobX;
  const weaponY = height - weaponHeight + 18 + bobY;

  ctx.drawImage(textures.shotgun, weaponX, weaponY, weaponWidth, weaponHeight);

  if (state.muzzleFlash > 0) {
    ctx.fillStyle = `rgba(255, 232, 181, ${state.muzzleFlash * 2.2})`;
    ctx.beginPath();
    ctx.arc(width / 2, height - 88, 22 + state.muzzleFlash * 120, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderMinimap() {
  const scale = 8;
  const originX = 18;
  const originY = canvas.height - state.map.length * scale - 18;

  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "rgba(8, 10, 14, 0.72)";
  ctx.fillRect(originX - 6, originY - 6, state.map[0].length * scale + 12, state.map.length * scale + 12);

  for (let y = 0; y < state.map.length; y += 1) {
    for (let x = 0; x < state.map[y].length; x += 1) {
      ctx.fillStyle = state.map[y][x] === "0" ? "#1a232c" : "#ff8b42";
      ctx.fillRect(originX + x * scale, originY + y * scale, scale - 1, scale - 1);
    }
  }

  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(originX + enemy.x * scale - 2, originY + enemy.y * scale - 2, 4, 4);
  }

  ctx.fillStyle = "#66e0ff";
  ctx.beginPath();
  ctx.arc(originX + state.player.x * scale, originY + state.player.y * scale, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#66e0ff";
  ctx.beginPath();
  ctx.moveTo(originX + state.player.x * scale, originY + state.player.y * scale);
  ctx.lineTo(
    originX + (state.player.x + Math.cos(state.player.angle) * 1.4) * scale,
    originY + (state.player.y + Math.sin(state.player.angle) * 1.4) * scale
  );
  ctx.stroke();
  ctx.restore();
}

function frame(timestamp) {
  const deltaTime = clamp((timestamp - state.lastTime) / 1000 || 0, 0.001, 0.033);
  state.lastTime = timestamp;
  updateInputFromKeys();
  updateGame(deltaTime);
  renderScene();
  requestAnimationFrame(frame);
}

function setPointerLock() {
  if (!MOBILE_ACTIVE && document.pointerLockElement !== canvas) {
    canvas.requestPointerLock?.();
  }
}

function setupKeyboard() {
  window.addEventListener("keydown", (event) => {
    keyState[event.code] = true;
    if (event.code === "Space") {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    keyState[event.code] = false;
  });

  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === canvas && state.started && !state.ended) {
      state.player.angle = wrapAngle(state.player.angle + event.movementX * 0.0027);
    }
  });
}

function configureTouchPad(element, knob, axis) {
  const updateKnob = (x, y) => {
    knob.style.transform = `translate(calc(-50% + ${x * 34}px), calc(-50% + ${y * 34}px))`;
  };

  element.addEventListener("pointerdown", (event) => {
    element.setPointerCapture(event.pointerId);
    if (axis === "move") {
      touchState.moveId = event.pointerId;
    } else {
      touchState.lookId = event.pointerId;
    }
  });

  element.addEventListener("pointermove", (event) => {
    const rect = element.getBoundingClientRect();
    const localX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    const localY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);

    if (axis === "move" && touchState.moveId === event.pointerId) {
      touchState.moveX = localX;
      touchState.moveY = localY;
      updateKnob(localX, localY);
    }
    if (axis === "look" && touchState.lookId === event.pointerId) {
      touchState.lookX = localX;
      updateKnob(localX, localY);
    }
  });

  const release = (event) => {
    if (axis === "move" && touchState.moveId === event.pointerId) {
      touchState.moveId = null;
      touchState.moveX = 0;
      touchState.moveY = 0;
      updateKnob(0, 0);
    }
    if (axis === "look" && touchState.lookId === event.pointerId) {
      touchState.lookId = null;
      touchState.lookX = 0;
      updateKnob(0, 0);
    }
  };

  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
}

function setupMobileControls() {
  configureTouchPad(movePad, moveKnob, "move");
  configureTouchPad(lookPad, lookKnob, "look");
  fireButton.addEventListener("pointerdown", () => {
    inputState.firing = true;
  });
  fireButton.addEventListener("pointerup", () => {
    inputState.firing = false;
  });
  fireButton.addEventListener("pointercancel", () => {
    inputState.firing = false;
  });
}

function initAudio() {
  if (state.audioReady) {
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  state.audioContext = new AudioContextClass();
  state.audioReady = true;
}

function playTone(kind) {
  if (!state.audioReady || !state.audioContext) {
    return;
  }

  const now = state.audioContext.currentTime;
  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(state.audioContext.destination);

  switch (kind) {
    case "shot":
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(180, now);
      oscillator.frequency.exponentialRampToValueAtTime(58, now + 0.08);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      break;
    case "hit":
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(240, now);
      oscillator.frequency.exponentialRampToValueAtTime(120, now + 0.06);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      oscillator.start(now);
      oscillator.stop(now + 0.08);
      break;
    case "kill":
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(120, now);
      oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.18);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      break;
    case "pickup":
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(380, now);
      oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.09);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      oscillator.start(now);
      oscillator.stop(now + 0.11);
      break;
    case "hurt":
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(90, now);
      oscillator.frequency.exponentialRampToValueAtTime(44, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
      break;
    case "dry":
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(70, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
      break;
    default:
      break;
  }
}

startButton.addEventListener("click", async () => {
  initAudio();
  if (state.audioContext?.state === "suspended") {
    await state.audioContext.resume();
  }
  resetGame();
  setPointerLock();
});

canvas.addEventListener("click", () => {
  if (state.started && !state.ended) {
    setPointerLock();
    fireWeapon();
  }
});

document.addEventListener("pointerlockchange", () => {
  if (!MOBILE_ACTIVE && state.started && !state.ended && document.pointerLockElement !== canvas) {
    setMessage("클릭하면 다시 조준할 수 있습니다.", 2);
  }
});

window.addEventListener("resize", resizeCanvas);

buildLevel();
resizeCanvas();
updateHud();
setupKeyboard();
setupMobileControls();
showOverlay("IRON CITADEL", "둠 감성의 초고속 전투 프로토타입입니다. 지금 바로 성채를 정리하십시오.", "전투 시작");
requestAnimationFrame(frame);
