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

// tuning: everything is per second and scaled to the screen, so the game
// plays the same on any screen size and refresh rate
const PLAYER_SPEED = 60; // % of screen width per second
const FALL_SPEED = 0.6; // screen heights per second
const SPAWN_EVERY = 0.18; // seconds between rocks at the start
const SCORE_RATE = 60; // points per second
const PLAYER_W = 0.0703125; // player size and spot, matches .player in style.css
const PLAYER_H = 0.13533834586466165;
const PLAYER_TOP = 0.84;

// w and h are fractions of the screen width and height
const ROCK_TYPES = {
  normal: { w: 0.02, h: 0.06, fall: 1 },
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

// gets harder the longer you last
const difficulty = () => 1 + runTime / 75;


//keybindings
  //player movement
const movePlayer = (ev) => { // initiates movements left/right
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
    vx: 0,
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
    makeRock('normal');
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
    if (rock.y > H || rock.x < -rock.w || rock.x > W) {
      removeRock(i);
      continue;
    };
    drawRock(rock);
    if (overlaps(hitBox, rock)) hitRock(i);
    if (!playing) return; // that hit ended the run
  };
};

// progression
const speedUp = (dt) => {
  runTime += dt;
  score += SCORE_RATE * stats.scoreMult * dt;
  invulnerable = Math.max(0, invulnerable - dt);
  if (invulnerable === 0) player.classList.remove('hurt');
};
const updateHud = () => {
  const shield = stats.shield > 0 ? `  SHIELD ${stats.shield}` : '';
  currentScore.innerText = `SCORE: ${Math.floor(score)}  LIVES ${stats.lives}${shield}`;
};
const movingParts = (time) => {
  // seconds since the last frame, capped so a hidden tab doesn't jump ahead
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (playing) {
    moveBlobby(dt);
    generateBlocks(dt);
    dropEm(dt);
  };
  if (playing) speedUp(dt);
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
  finalScore.innerText = `SCORE: ${Math.floor(score)}`;
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
