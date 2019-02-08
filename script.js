// global variables
const body = document.querySelector('body');
const startButton = document.querySelector('#start');
const title = document.querySelector('.title')
const player = document.querySelector('.player');
const tryAgain = document.querySelector('.tryAgain');
const yesButton = document.querySelector('#yes');
const noButton = document.querySelector('#no');
const finalScore = document.querySelector('.finalScore');
let blocks = [];
let score = 0;
let gameTime;
let move = 50; //initial player location when blobby appears
let speed = 100; // speed of how blocks fall
let playing = false;
let left = false; // player moves left when true
let right = false; // player moves right when true
let rate = 11;// sets rate of generateBlocks


//keybindings
  //player movement
const movePlayer = (ev) => { // initiates movements left/right
  if (ev.keyCode === 39 && player.offsetLeft <= (document.body.clientWidth - 10)) { //rightArrow
    right = true;
    playing = true;
    player.classList.add('goRight')
  } else if (ev.keyCode === 37 && move > 1) { //leftArrow
    left = true;
    playing = true;
    player.classList.add('goLeft')
  };
};
const unMovePlayer = (ev) => { // stops movement left/right
  if (ev.keyCode === 39 && player.offsetLeft <= (document.body.clientWidth - 10)) { //rightArrow
    right = false;
    player.classList.remove('goRight')
  } else if (ev.keyCode === 37 && move > 1) { //leftArrow
    left = false;
    player.classList.remove('goLeft')
  };
};

// generates new block at random distance off left wall
const generateBlocks = () => {
  if (playing && score % rate === 0) {
    const block = document.createElement('div');
    block.className = 'block'
    block.style.left = `${randOffLeft(block)}px`; //random drop spot off left wall
    blocks.push(block); //push new block into blocks array
    body.appendChild(block);
  };
};

// detects collision between BLOBBY and rocks
const checkCollision = (i) => { //would like to refine this for a more accurate hit box
  blockPos = blocks[i].getBoundingClientRect();
  playerPos = player.getBoundingClientRect();
  if (playerPos.bottom >= blockPos.bottom) {
    if (playerPos.left + 2 >= blockPos.left && playerPos.right - 2 <= blockPos.right || playerPos.right - 2 >= blockPos.left && playerPos.left + 2 <= blockPos.right) {
      if (playerPos.top + 1 <= blockPos.bottom) {
        youLose();
      };
    };
  };
};

// moves blobby
const moveBlobby = () => {
  if (left){
    if (player.offsetLeft <= 0) { //if player hits left wall moves him to right wall
    move = 100;
    }
    move -= 1;
  } else if (right){
    if (player.offsetLeft >= window.innerWidth - player.offsetWidth) { //if player hits right wall moves him to left wall
    move = 1;
    }
    move += 1;
  };
  player.style.left = `${move}%`;
};

// drops the rocks
const dropEm = () => {
  if (blocks !== [] && playing) {
    for (let i=0; i<blocks.length; i++) {
      checkCollision(i);
      if (blocks[i] !== undefined && (blocks[i].offsetTop) < (window.innerHeight - blocks[i].offsetHeight)) {
        blocks[i].style.top =`${(blocks[i].offsetTop + (window.innerHeight / speed))}px`; // converts a percentage into pixel form to keep drop rate the same for all screen sizes
      } else {
        resetBlock();
      };
    };
  };
};

// progression
const speedUp = () => {
  score += 1;
  if (score % 400 === 0) {
    speed -= 5;
  };
  if (rate % 800 === 0) {
    rate -= 1;
  }
};

const movingParts = () => {
  moveBlobby();
  generateBlocks();
  dropEm();
  speedUp();
  let gameTime = window.requestAnimationFrame(movingParts); //
};

// number generators
const randOffLeft = () => { //tells blocks how wide the screen is so it wont generate new ones off the screen
  return (Math.floor(Math.random() * (window.innerWidth - player.offsetWidth)));
};

// reset functions
const resetBlock = () => {
  let firstBlock = blocks.shift();
  firstBlock.parentNode.removeChild(firstBlock);
};
const resetBlocks = () => {
  while (blocks.length > 1){
    resetBlock();
  }
};

// game states
const startGame = () => { //when you hit start button on main page
  startButton.style.display = 'none';
  title.style.display = 'none';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  player.style.display = 'block';
  finalScore.style.display = 'none';
  body.addEventListener('keydown', movePlayer, true);
  body.addEventListener('keyup', unMovePlayer, true);
};
const youLose = () => { // brings up try again when you get hit
  playing = false;
  tryAgain.style.display = 'block';
  yesButton.style.display = 'block';
  noButton.style.display = 'block';
  finalScore.style.display = 'block';
  player.classList.add('dead')
  finalScore.innerText = `SCORE: ${Math.floor(score)}`;
  body.removeEventListener('keydown', movePlayer, true);
  yesButton.addEventListener('click', restartGame);
  noButton.addEventListener('click', backToMain);
};
const restartGame = () => { //when you hit yes button on lose state
  startGame();
  resetBlocks();
  score = 0;
  speed = 100;
  rate = 11;
  player.classList.remove('dead')
};
const backToMain = () => { //when you hit no button on lose state
  resetBlocks();
  score = 0;
  speed = 100;
  rate = 11;
  startButton.style.display = 'block';
  title.style.display = 'block';
  finalScore.style.display = 'none';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  player.style.display = 'none';
  player.classList.remove('dead')
}


//on start up run these functions
startButton.addEventListener('click', startGame);
window.requestAnimationFrame(movingParts);
