// global variables
const body = document.querySelector('body');
const startButton = document.querySelector('#start');
const title = document.querySelector('.title')
const player = document.querySelector('.player');
const tryAgain = document.querySelector('.tryAgain');
const yesButton = document.querySelector('#yes');
const noButton = document.querySelector('#no');
const finalScore = document.querySelector('.finalScore');
const currentScore = document.querySelector('.currentScore');
const upgradeMenu = document.querySelector('#upgradeMenu');
const waveTitle = document.querySelector('.waveTitle');
const cardList = document.querySelector('.cards');
const shopButton = document.querySelector('#shop');
const bank = document.querySelector('.bank');
const shopMenu = document.querySelector('#shopMenu');
const shopCoins = document.querySelector('.shopCoins');
const shopList = document.querySelector('.shopList');
const shopBack = document.querySelector('#shopBack');
let rocks = []; // everything falling: {el, x, y, w, h, vx, vy, type, kind}
let score = 0;
let gameTime; // id of the current animation frame
let lastTime = null; // timestamp of the last frame
let runTime = 0; // seconds played this run
let spawnTimer = 0; // seconds until the next rock
let pickupTimer = 0; // seconds until the next pickup
let runCoins = 0; // coins picked up this run
let banked = 0; // coins from this run already added to the save
let bombed = false; // a bomb was caught this frame
let hudText = ''; // last HUD text, so it's only rewritten when it changes
let invulnerable = 0; // seconds of blinking after a hit
let move = 50; //initial player location when blobby appears
let playing = false;
let left = false; // player moves left when true
let right = false; // player moves right when true
let stats; // this run's player stats, see newStats()
let wave = 1;
let waveTime = 0; // seconds into the current wave
let choosing = false; // true while the upgrade cards are showing
let offered = []; // upgrades on the cards right now
let cardIndex = 0; // card picked with the keyboard
let cardsReadyAt = 0; // ignore picks until then so a stray tap doesn't choose
let taken = []; // ids of one-time upgrades already picked this run

// test hooks: ?wavelen=2 makes waves 2 seconds, ?startwave=5 starts on wave 5
const params = new URLSearchParams(window.location.search);
const WAVE_LENGTH = Number(params.get('wavelen')) || 30; // seconds
const START_WAVE = Number(params.get('startwave')) || 1;
const TESTING = params.has('wavelen') || params.has('startwave'); // test runs aren't saved

// tuning: everything is per second and scaled to the screen, so the game
// plays the same on any screen size and refresh rate
const PLAYER_SPEED = 60; // % of screen width per second
const FALL_SPEED = 0.6; // screen heights per second
const SPAWN_EVERY = 0.18; // seconds between rocks at the start
const SCORE_RATE = 60; // points per second
const PLAYER_W = 0.0703125; // player size and spot, matches .player in style.css
const PLAYER_H = 0.13533834586466165;
const PLAYER_TOP = 0.84;

// w and h are fractions of the screen width and height.
// from is the first wave a type can show up in
const ROCK_TYPES = {
  normal: { w: 0.02, h: 0.06, fall: 1, from: 1 },
  boulder: { w: 0.045, h: 0.1, fall: 0.65, from: 2 }, // big and slow
  needle: { w: 0.008, h: 0.09, fall: 1.7, from: 3 }, // thin and fast
  splitter: { w: 0.03, h: 0.07, fall: 0.9, from: 4 }, // breaks into 2 shards
  drifter: { w: 0.02, h: 0.06, fall: 0.9, from: 5, drift: 0.2 }, // slides sideways
  shard: { w: 0.014, h: 0.04, fall: 1 }, // splitter pieces, never spawned directly
  // pickups: touching them helps instead of hurts. size is a share of the shorter screen side
  coin: { size: 0.05, fall: 0.5, kind: 'pickup' },
  bubble: { size: 0.065, fall: 0.45, kind: 'pickup' }, // +1 shield
  bomb: { size: 0.065, fall: 0.45, kind: 'pickup' }, // clears the screen of rocks
};
const PICKUP_EVERY = 1.5; // seconds between pickups
const MAGNET_RANGE = 0.3; // screen widths
const MAX_SHIELD = 3;
const SPLIT_AT = 0.4; // splitters break this far down the screen
const SHARD_SPREAD = 0.25; // how fast shards fly apart, in screen widths per second

// picks a rock type at random. newer types get more common in later waves
const pickRockType = () => {
  const weights = Object.entries(ROCK_TYPES)
    .filter(([, t]) => t.from && wave >= t.from)
    .map(([type, t]) => [type, type === 'normal' ? 10 : Math.min(2 * (wave - t.from + 1), 6)]);
  let roll = Math.random() * weights.reduce((sum, [, w]) => sum + w, 0);
  for (const [type, w] of weights) {
    roll -= w;
    if (roll < 0) return type;
  };
  return 'normal';
};

// saved progress, kept on this device between runs
const SAVE_KEY = 'dodgyblobby-save';
const defaultSave = () => ({
  coins: 0,
  best: 0,
  bestWave: 0,
  perks: { shield: 0, life: 0, cards: 0 }, // levels bought in the shop
  owned: ['classic'], // Blobbies bought in the shop
  blobby: 'classic', // the one being played
});
const loadSave = () => {
  try {
    return cleanSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
  } catch (e) { // private browsing or a broken save
    return defaultSave();
  };
};
// fixes missing or wrong-type fields so an old or edited save can't break the game
const count = (n, max = Infinity) => Math.min(Math.max(Math.floor(Number(n)) || 0, 0), max);
const cleanSave = (saved) => {
  const s = saved && typeof saved === 'object' ? saved : {};
  const perks = s.perks && typeof s.perks === 'object' ? s.perks : {};
  const owned = Array.isArray(s.owned) ? s.owned.filter((id) => BLOBBIES[id]) : [];
  if (!owned.includes('classic')) owned.unshift('classic');
  return {
    coins: count(s.coins),
    best: count(s.best),
    bestWave: count(s.bestWave),
    perks: Object.fromEntries(PERKS.map((p) => [p.id, count(perks[p.id], p.max)])),
    owned,
    blobby: owned.includes(s.blobby) ? s.blobby : 'classic',
  };
};
const writeSave = () => {
  if (TESTING) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    // can't save on this device, progress lasts until the page closes
  };
};

// permanent upgrades bought with coins
const PERKS = [
  { id: 'shield', name: 'Head Start', desc: 'Start each run with a shield', max: 2, price: (level) => 40 * (level + 1) },
  { id: 'life', name: 'Tough Blob', desc: '+1 starting life', max: 2, price: (level) => 60 * (level + 1) },
  { id: 'cards', name: 'More Choices', desc: '4 upgrade cards instead of 3', max: 1, price: () => 120 },
];
// the Blobby family: recolored with a hue shift, each with a perk
const BLOBBIES = {
  classic: { name: 'Blobby', desc: 'The original', hue: 0, price: 0, apply: () => {} },
  zippy: { name: 'Zippy', desc: 'Moves 20% faster', hue: 100, price: 75, apply: (s) => { s.speed *= 1.2; } },
  tiny: { name: 'Tiny', desc: 'Smaller hitbox', hue: 200, price: 100, apply: (s) => { s.hitboxScale *= 0.85; } },
  lucky: { name: 'Lucky', desc: 'x1.5 coins', hue: 290, price: 150, apply: (s) => { s.coinMult *= 1.5; } },
};
const currentBlobby = () => BLOBBIES[save.blobby] || BLOBBIES.classic;
const save = loadSave();

const newStats = () => {
  const s = baseStats();
  s.shield += save.perks.shield;
  s.lives += save.perks.life;
  currentBlobby().apply(s);
  return s;
};
const baseStats = () => ({
  speed: 1, // player speed multiplier
  lives: 3,
  shield: 0, // hits blocked before losing a life
  hitboxScale: 0.7, // share of the sprite that counts as a hit
  scoreMult: 1,
  coinMult: 1,
  magnet: false, // pulls coins toward BLOBBY
  fallMult: 1, // rock speed multiplier from upgrades
  spawnMult: 1, // rock spawn rate multiplier from upgrades
});

// gets harder each wave, and a little during each wave
const difficulty = () => 1 + (wave - 1) * 0.15 + (waveTime / WAVE_LENGTH) * 0.1;

// upgrade cards offered between waves. curses help and hurt at the same time
const UPGRADES = [
  { id: 'speed', name: 'Zoomies', desc: 'Move 20% faster', apply: (s) => { s.speed *= 1.2; }, ok: (s) => s.speed < 1.8 },
  { id: 'life', name: 'Extra Life', desc: '+1 life', apply: (s) => { s.lives += 1; } },
  { id: 'shield', name: 'Shield', desc: 'Blocks the next hit', apply: (s) => { s.shield += 1; }, ok: (s) => s.shield < MAX_SHIELD },
  { id: 'squish', name: 'Squish', desc: 'Smaller hitbox', apply: (s) => { s.hitboxScale *= 0.85; }, ok: (s) => s.hitboxScale > 0.45 },
  { id: 'slowmo', name: 'Slow-mo', desc: 'Rocks fall 15% slower', apply: (s) => { s.fallMult *= 0.85; }, ok: (s) => s.fallMult > 0.65 },
  { id: 'glass', name: 'Glass Cannon', desc: '-1 life, x2 score', curse: true, apply: (s) => { s.lives -= 1; s.scoreMult *= 2; }, ok: (s) => s.lives > 1 },
  { id: 'magnet', name: 'Coin Magnet', desc: 'Pulls coins toward you', once: true, apply: (s) => { s.magnet = true; } },
  { id: 'rush', name: 'Rush', desc: 'Rocks 20% faster, x1.5 coins', curse: true, apply: (s) => { s.fallMult *= 1.2; s.coinMult *= 1.5; }, ok: (s) => s.coinMult < 3 },
  { id: 'crowd', name: 'Crowded', desc: '25% more rocks, x1.5 score', curse: true, apply: (s) => { s.spawnMult *= 1.25; s.scoreMult *= 1.5; } },
];


//keybindings
  //player movement
const movePlayer = (ev) => { // initiates movements left/right
  if (choosing) {
    pickWithKeys(ev);
    return;
  };
  if (ev.keyCode === 39) { //rightArrow
    right = true;
    left = false
    playing = true;
    player.classList.add('goRight')
    player.classList.remove('goLeft')
  } else if (ev.keyCode === 37) { //leftArrow
    left = true;
    right = false;
    playing = true;
    player.classList.remove('goRight')
    player.classList.add('goLeft')
  };
};
const unMovePlayer = (ev) => { // stops movement left/right
  if (ev.keyCode === 39) { //rightArrow
    right = false;
    player.classList.remove('goRight')
  } else if (ev.keyCode === 37) { //leftArrow
    left = false;
    player.classList.remove('goLeft')
  };
};

// touch controls: hold the left or right half of the screen to move
const touchMove = (ev) => {
  ev.preventDefault(); // stop scrolling and zooming while playing
  const touch = ev.touches[ev.touches.length - 1];
  if (!touch) { // no fingers left on the screen
    left = false;
    right = false;
    player.classList.remove('goLeft', 'goRight');
    return;
  }
  const goRight = touch.clientX > window.innerWidth / 2;
  movePlayer({ keyCode: goRight ? 39 : 37 });
};
const addTouch = () => {
  ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((t) =>
    window.addEventListener(t, touchMove, { passive: false }));
};
const removeTouch = () => {
  ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((t) =>
    window.removeEventListener(t, touchMove, { passive: false }));
};

// rocks
const makeRock = (type, x, y) => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const t = ROCK_TYPES[type];
  const w = t.size ? t.size * Math.min(W, H) : t.w * W;
  const h = t.size ? w : t.h * H;
  const el = document.createElement('div');
  el.className = `block ${type}`;
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  const rock = {
    el, w, h, type,
    kind: t.kind || 'rock',
    x: x === undefined ? Math.random() * (W - w) : x, // random drop spot
    y: y === undefined ? -h : y, // just above the screen
    vx: t.drift ? t.drift * W * (Math.random() < 0.5 ? -1 : 1) : 0,
    vy: FALL_SPEED * t.fall * H,
  };
  drawRock(rock);
  body.appendChild(el);
  rocks.push(rock);
  return rock;
};
const drawRock = (rock) => {
  rock.el.style.transform = `translate(${rock.x}px, ${rock.y}px)`;
};
const removeRock = (i) => {
  rocks[i].el.remove();
  rocks.splice(i, 1);
};

// generates new rocks over time
const generateBlocks = (dt) => {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTimer += SPAWN_EVERY / (difficulty() * stats.spawnMult);
    makeRock(pickRockType());
  };
  pickupTimer -= dt;
  if (pickupTimer <= 0) {
    pickupTimer += PICKUP_EVERY;
    const roll = Math.random();
    makeRock(roll < 0.04 ? 'bomb' : roll < 0.1 ? 'bubble' : 'coin');
  };
};

// BLOBBY touched pickup i
const collect = (i) => {
  const type = rocks[i].type;
  removeRock(i);
  if (type === 'coin') runCoins += stats.coinMult;
  if (type === 'bubble' && stats.shield < MAX_SHIELD) stats.shield += 1;
  if (type === 'bomb') {
    bombed = true; // rocks are cleared after the drop loop
    body.classList.remove('boom');
    void body.offsetWidth; // restart the flash animation
    body.classList.add('boom');
  };
};

// BLOBBY's hit box in pixels, shrunk so near misses don't count
const playerBox = (scale) => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const w = PLAYER_W * W;
  const h = PLAYER_H * H;
  return {
    x: (move / 100) * W + (w * (1 - scale)) / 2,
    y: PLAYER_TOP * H + (h * (1 - scale)) / 2,
    w: w * scale,
    h: h * scale,
  };
};
const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// rock sprites, and which of their pixels are solid, so hits match the drawn shape
const SPRITE_ROCKS = ['normal', 'boulder', 'needle', 'splitter', 'shard', 'drifter'];
const rockMasks = {};
SPRITE_ROCKS.forEach((type) => {
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      const solid = new Uint8Array(c.width * c.height);
      for (let i = 0; i < solid.length; i++) solid[i] = data[i * 4 + 3] > 0 ? 1 : 0;
      rockMasks[type] = { w: c.width, h: c.height, solid };
    } catch (e) {} // no mask: that rock falls back to its box
  };
  img.src = `rocks/${type}.png`;
});

// box hit first, then check the sprite's solid pixels under the box
const hitsRock = (box, rock) => {
  if (!overlaps(box, rock)) return false;
  const m = rockMasks[rock.type];
  if (!m) return true;
  // the sprite is drawn centered in the rock's box at its own shape (background-size: contain)
  const s = Math.min(rock.w / m.w, rock.h / m.h);
  const left = rock.x + (rock.w - m.w * s) / 2;
  const top = rock.y + (rock.h - m.h * s) / 2;
  const x0 = Math.max(0, Math.floor((box.x - left) / s));
  const x1 = Math.min(m.w - 1, Math.ceil((box.x + box.w - left) / s) - 1);
  const y0 = Math.max(0, Math.floor((box.y - top) / s));
  const y1 = Math.min(m.h - 1, Math.ceil((box.y + box.h - top) / s) - 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (m.solid[y * m.w + x]) return true;
    };
  };
  return false;
};

// BLOBBY got hit by rock i
const hitRock = (i) => {
  if (invulnerable > 0) return;
  removeRock(i);
  if (stats.shield > 0) {
    stats.shield -= 1;
    invulnerable = 0.5;
  } else {
    stats.lives -= 1;
    if (stats.lives <= 0) {
      youLose();
      return;
    }
    invulnerable = 1.5;
  }
  player.classList.add('hurt');
};

// moves blobby
const moveBlobby = (dt) => {
  const step = PLAYER_SPEED * stats.speed * dt;
  if (left){
    if (move <= -2) { //if player hits left wall moves him to right wall
    move = 98;
    }
    move -= step;
  } else if (right){
    if (move >= 98) { //if player hits right wall moves him to left wall
    move = 2;
    }
    move += step;
  };
  player.style.left = `${move}%`;
};

// drops the rocks and checks for hits
const dropEm = (dt) => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const fall = difficulty() * stats.fallMult;
  const hitBox = playerBox(stats.hitboxScale);
  const grabBox = playerBox(1); // pickups are easier to grab
  const playerMiddle = grabBox.x + grabBox.w / 2;
  // loop backwards so removing a rock doesn't skip the next one
  for (let i = rocks.length - 1; i >= 0; i--) {
    const rock = rocks[i];
    if (rock.type === 'coin' && stats.magnet) {
      const gap = playerMiddle - (rock.x + rock.w / 2);
      rock.vx = Math.abs(gap) < MAGNET_RANGE * W ? Math.sign(gap) * Math.min(Math.abs(gap) * 4, 0.6 * W) : 0;
    };
    rock.x += rock.vx * dt;
    // pickups don't speed up with difficulty
    rock.y += rock.vy * (rock.kind === 'pickup' ? 1 : fall) * dt;
    if (rock.type === 'drifter') { // bounce off the walls
      if (rock.x < 0) rock.vx = Math.abs(rock.vx);
      if (rock.x + rock.w > W) rock.vx = -Math.abs(rock.vx);
    };
    if (rock.type === 'splitter' && rock.y > H * SPLIT_AT) {
      const middle = rock.x + rock.w / 2;
      removeRock(i);
      [-1, 1].forEach((side) => {
        makeRock('shard', middle - (ROCK_TYPES.shard.w * W) / 2, rock.y).vx = side * SHARD_SPREAD * W;
      });
      continue;
    };
    if (rock.y > H || rock.x < -rock.w || rock.x > W) {
      removeRock(i);
      continue;
    };
    drawRock(rock);
    if (rock.kind === 'pickup') {
      if (overlaps(grabBox, rock)) collect(i);
      continue;
    };
    if (hitsRock(hitBox, rock)) hitRock(i);
    if (!playing) return; // that hit ended the run
  };
  if (bombed) {
    bombed = false;
    for (let i = rocks.length - 1; i >= 0; i--) {
      if (rocks[i].kind === 'rock') removeRock(i);
    };
  };
};

// upgrade waves
const shuffle = (list) => list
  .map((item) => [Math.random(), item])
  .sort((a, b) => a[0] - b[0])
  .map((pair) => pair[1]);
const endWave = () => {
  choosing = true;
  left = false;
  right = false;
  player.classList.remove('goLeft', 'goRight');
  removeTouch(); // so taps reach the cards
  for (let i = rocks.length - 1; i >= 0; i--) {
    if (rocks[i].kind === 'rock') removeRock(i);
  };
  const choices = UPGRADES.filter((u) => !taken.includes(u.id) && (!u.ok || u.ok(stats)));
  offered = shuffle(choices).slice(0, 3 + save.perks.cards);
  cardIndex = 0;
  cardsReadyAt = performance.now() + 500;
  const bonus = wave * 2;
  runCoins += bonus;
  waveTitle.innerHTML = `WAVE ${wave} CLEARED<div class="runStats">+${bonus} COINS</div>`;
  cardList.innerHTML = '';
  offered.forEach((u, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = u.curse ? 'card curse' : 'card';
    card.innerHTML = `<span class="cardName"></span><span class="cardDesc"></span>`;
    card.querySelector('.cardName').innerText = u.name;
    card.querySelector('.cardDesc').innerText = u.desc;
    card.addEventListener('click', () => pickCard(i));
    cardList.appendChild(card);
  });
  highlightCard();
  upgradeMenu.style.display = 'flex';
};
const highlightCard = () => {
  [...cardList.children].forEach((card, i) => card.classList.toggle('selected', i === cardIndex));
};
const pickWithKeys = (ev) => {
  if (ev.repeat) return; // holding an arrow from the last wave shouldn't race across
  if (ev.keyCode === 37) cardIndex = (cardIndex + offered.length - 1) % offered.length;
  if (ev.keyCode === 39) cardIndex = (cardIndex + 1) % offered.length;
  highlightCard();
  if (ev.keyCode === 13 || ev.keyCode === 32) { //enter or space
    ev.preventDefault();
    pickCard(cardIndex);
  };
};
const pickCard = (i) => {
  if (!choosing || performance.now() < cardsReadyAt) return;
  const u = offered[i];
  u.apply(stats);
  if (u.once) taken.push(u.id);
  choosing = false;
  upgradeMenu.style.display = 'none';
  wave += 1;
  waveTime = 0;
  spawnTimer = 0.5; // a short breather before rocks start again
  addTouch();
};

// progression
const speedUp = (dt) => {
  runTime += dt;
  waveTime += dt;
  if (waveTime >= WAVE_LENGTH) endWave();
  score += SCORE_RATE * stats.scoreMult * dt;
  invulnerable = Math.max(0, invulnerable - dt);
  if (invulnerable === 0) player.classList.remove('hurt');
};
const updateHud = () => {
  const shield = stats.shield > 0 ? ` · SHIELD ${stats.shield}` : '';
  const text = `SCORE: ${Math.floor(score)} · WAVE ${wave} · LIVES ${stats.lives}${shield} · COINS ${Math.floor(runCoins)}`;
  if (text !== hudText) {
    hudText = text;
    currentScore.innerText = text;
  };
  player.classList.toggle('shielded', stats.shield > 0);
};
const movingParts = (time) => {
  // seconds since the last frame, capped so a hidden tab doesn't jump ahead
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (playing && !choosing) {
    moveBlobby(dt);
    generateBlocks(dt);
    dropEm(dt);
  };
  if (playing && !choosing) speedUp(dt);
  if (playing) updateHud();
  gameTime = window.requestAnimationFrame(movingParts);
};

// reset functions
const resetBlocks = () => {
  while (rocks.length > 0){
    removeRock(rocks.length - 1);
  }
};
const resetRun = () => {
  resetBlocks();
  score = 0;
  runTime = 0;
  spawnTimer = 0;
  pickupTimer = PICKUP_EVERY;
  runCoins = 0;
  banked = 0;
  invulnerable = 0;
  stats = newStats();
  player.style.filter = `hue-rotate(${currentBlobby().hue}deg)`;
  wave = START_WAVE;
  waveTime = 0;
  choosing = false;
  taken = [];
  upgradeMenu.style.display = 'none';
  player.classList.remove('dead', 'hurt');
};

// game states
const startGame = () => { //when you hit start button on main page
  resetRun();
  startButton.style.display = 'none';
  title.style.display = 'none';
  shopButton.style.display = 'none';
  bank.style.display = 'none';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  player.style.display = 'block';
  finalScore.style.display = 'none';
  currentScore.style.display = 'block';
  body.addEventListener('keydown', movePlayer, true);
  body.addEventListener('keyup', unMovePlayer, true);
  addTouch();
};
const youLose = () => { // brings up try again when you get hit
  playing = false;
  left = false;
  right = false;
  tryAgain.style.display = 'block';
  yesButton.style.display = 'block';
  noButton.style.display = 'block';
  finalScore.style.display = 'block';
  player.classList.remove('goLeft', 'goRight', 'hurt');
  player.classList.add('dead')
  const earned = Math.floor(runCoins);
  const newBest = Math.floor(score) > save.best;
  bankCoins();
  save.best = Math.max(save.best, Math.floor(score));
  save.bestWave = Math.max(save.bestWave, wave);
  writeSave();
  finalScore.innerHTML = `SCORE: ${Math.floor(score)}`
    + `<div class="runStats">REACHED WAVE ${wave} · +${earned} COINS</div>`
    + `<div class="runStats">${newBest ? 'NEW BEST!' : `BEST: ${save.best}`}</div>`;
  currentScore.style.display = 'none';
  body.removeEventListener('keydown', movePlayer, true);
  removeTouch();
  yesButton.addEventListener('click', restartGame);
  noButton.addEventListener('click', backToMain);
};
const restartGame = () => { //when you hit yes button on lose state
  startGame();
};
const backToMain = () => { //when you hit no button on lose state
  resetRun();
  showMainMenu();
  finalScore.style.display = 'none';
  currentScore.style.display = 'none';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  player.style.display = 'none';
}


// adds this run's new coins to the save, so closing the app mid-run keeps them
const bankCoins = () => {
  const earned = Math.floor(runCoins) - banked;
  save.coins += earned;
  banked += earned;
  writeSave();
};
window.addEventListener('pagehide', () => { if (playing) bankCoins(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && playing) bankCoins();
});

// main menu and shop
const showMainMenu = () => {
  startButton.style.display = 'block';
  title.style.display = 'block';
  shopButton.style.display = 'block';
  bank.style.display = 'block';
  shopMenu.style.display = 'none';
  bank.innerText = `COINS ${save.coins} · BEST ${save.best} · WAVE ${save.bestWave}`;
};
const openShop = () => {
  startButton.style.display = 'none';
  title.style.display = 'none';
  shopButton.style.display = 'none';
  bank.style.display = 'none';
  shopMenu.style.display = 'block';
  renderShop();
};
const addShopItem = ({ name, desc, tag, hue, disabled, buy }) => {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'shopItem';
  item.disabled = disabled;
  item.innerHTML = '<span class="itemName"></span><span class="itemDesc"></span><span class="itemTag"></span>';
  if (hue !== undefined) {
    const preview = document.createElement('span');
    preview.className = 'preview';
    preview.style.filter = `hue-rotate(${hue}deg)`;
    item.prepend(preview);
  };
  item.querySelector('.itemName').innerText = name;
  item.querySelector('.itemDesc').innerText = desc;
  item.querySelector('.itemTag').innerText = tag;
  item.addEventListener('click', () => {
    buy();
    writeSave();
    renderShop();
  });
  shopList.appendChild(item);
};
const renderShop = () => {
  shopCoins.innerText = `COINS ${save.coins}`;
  shopList.innerHTML = '';
  PERKS.forEach((perk) => {
    const level = save.perks[perk.id];
    const maxed = level >= perk.max;
    const price = perk.price(level);
    addShopItem({
      name: perk.name,
      desc: perk.desc,
      tag: maxed ? `MAXED ${level}/${perk.max}` : `${price} COINS · ${level}/${perk.max}`,
      disabled: maxed || save.coins < price,
      buy: () => {
        save.coins -= price;
        save.perks[perk.id] += 1;
      },
    });
  });
  Object.entries(BLOBBIES).forEach(([id, blobby]) => {
    const owned = save.owned.includes(id);
    const selected = save.blobby === id;
    addShopItem({
      name: blobby.name,
      desc: blobby.desc,
      hue: blobby.hue,
      tag: selected ? 'PLAYING' : owned ? 'TAP TO PLAY' : `${blobby.price} COINS`,
      disabled: selected || (!owned && save.coins < blobby.price),
      buy: () => {
        if (!owned) {
          save.coins -= blobby.price;
          save.owned.push(id);
        };
        save.blobby = id;
      },
    });
  });
};


//on start up run these functions
stats = newStats();
showMainMenu();
startButton.addEventListener('click', startGame);
shopButton.addEventListener('click', openShop);
shopBack.addEventListener('click', showMainMenu);
gameTime = window.requestAnimationFrame(movingParts);

// lets the game install to the home screen and work offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
