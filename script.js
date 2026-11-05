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
let rocks = []; // everything falling: {el, x, y, w, h, vx, vy, type, kind}
let score = 0;
let gameTime; // id of the current animation frame
let lastTime = null; // timestamp of the last frame
let runTime = 0; // seconds played this run
let spawnTimer = 0; // seconds until the next rock
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
};
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

const newStats = () => ({
  speed: 1, // player speed multiplier
  lives: 3,
  shield: 0, // hits blocked before losing a life
  hitboxScale: 0.7, // share of the sprite that counts as a hit
  scoreMult: 1,
  fallMult: 1, // rock speed multiplier from upgrades
  spawnMult: 1, // rock spawn rate multiplier from upgrades
});

// gets harder each wave, and a little during each wave
const difficulty = () => 1 + (wave - 1) * 0.15 + (waveTime / WAVE_LENGTH) * 0.1;

// upgrade cards offered between waves. curses help and hurt at the same time
const UPGRADES = [
  { id: 'speed', name: 'Zoomies', desc: 'Move 20% faster', apply: (s) => { s.speed *= 1.2; } },
  { id: 'life', name: 'Extra Life', desc: '+1 life', apply: (s) => { s.lives += 1; } },
  { id: 'shield', name: 'Shield', desc: 'Blocks the next hit', apply: (s) => { s.shield += 1; } },
  { id: 'squish', name: 'Squish', desc: 'Smaller hitbox', apply: (s) => { s.hitboxScale *= 0.85; }, ok: (s) => s.hitboxScale > 0.45 },
  { id: 'slowmo', name: 'Slow-mo', desc: 'Rocks fall 15% slower', apply: (s) => { s.fallMult *= 0.85; } },
  { id: 'glass', name: 'Glass Cannon', desc: '-1 life, x2 score', curse: true, apply: (s) => { s.lives -= 1; s.scoreMult *= 2; }, ok: (s) => s.lives > 1 },
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
  const w = t.w * W;
  const h = t.h * H;
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
  // loop backwards so removing a rock doesn't skip the next one
  for (let i = rocks.length - 1; i >= 0; i--) {
    const rock = rocks[i];
    if (!rock) continue; // rocks can be cleared mid-loop
    rock.x += rock.vx * dt;
    rock.y += rock.vy * fall * dt;
    if (rock.type === 'drifter') { // bounce off the walls
      if (rock.x < 0) rock.vx = Math.abs(rock.vx);
      if (rock.x + rock.w > W) rock.vx = -Math.abs(rock.vx);
    };
    if (rock.type === 'splitter' && rock.y > H * SPLIT_AT) {
      const middle = rock.x + rock.w / 2;
      removeRock(i);
      [-1, 1].forEach((side) => {
        makeRock('shard', middle, rock.y).vx = side * SHARD_SPREAD * W;
      });
      continue;
    };
    if (rock.y > H || rock.x < -rock.w || rock.x > W) {
      removeRock(i);
      continue;
    };
    drawRock(rock);
    if (overlaps(hitBox, rock)) hitRock(i);
    if (!playing) return; // that hit ended the run
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
  offered = shuffle(choices).slice(0, 3);
  cardIndex = 0;
  cardsReadyAt = performance.now() + 500;
  waveTitle.innerText = `WAVE ${wave} CLEARED`;
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
  currentScore.innerText = `SCORE: ${Math.floor(score)} · WAVE ${wave} · LIVES ${stats.lives}${shield}`;
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
  updateHud();
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
  invulnerable = 0;
  stats = newStats();
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
  finalScore.innerHTML = `SCORE: ${Math.floor(score)}<div class="runStats">REACHED WAVE ${wave}</div>`;
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
  startButton.style.display = 'block';
  title.style.display = 'block';
  finalScore.style.display = 'none';
  currentScore.style.display = 'none';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  player.style.display = 'none';
}


//on start up run these functions
stats = newStats();
startButton.addEventListener('click', startGame);
gameTime = window.requestAnimationFrame(movingParts);

// lets the game install to the home screen and work offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
