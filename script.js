// index by lines:
//   12-28: global variables
//   31-64: player movement
//   66-73: rock creator
//   75-87: collision detection
//   89-100: rock dropper
//   102-105: number generator
//   107-116: reset functions
//   118-162: game states


// global variables
const body = document.querySelector('body');
const startButton = document.querySelector('#start');
const tutorialButton = document.querySelector('#tutorial');
const title = document.querySelector('.title')
const player = document.querySelector('.player');
const tryAgain = document.querySelector('.tryAgain');
const yesButton = document.querySelector('#yes');
const noButton = document.querySelector('#no');
const finalScore = document.querySelector('.finalScore');
let blocks = [];
let score = 0;
let move = 50; //initial player location when blobby appears
let int; //name of dropEm interval
let blockMaker; //name of generateBlocks interval
let left = false; // player moves left when true
let right = false; // player moves right when true


//player movement
const movePlayer = (ev) => { // initiates movements left/right
  if (ev.keyCode === 39 && player.offsetLeft <= (document.body.clientWidth - 10)) { //rightArrow
    right = true;
    player.classList.add('goRight')
  } else if (ev.keyCode === 37 && move > 1) { //leftArrow
    left = true;
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
const movingPlayer = () => { //determines movement speed and allows for pacman logic
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
  player.style.left = `${move}%`; //moves player in 1% increments to adjust to screen size
  window.requestAnimationFrame(movingPlayer);
}

// generates new block at random distance off left wall
const generateBlocks = () => {
  const block = document.createElement('div');
  block.className = 'block'
  block.style.left = `${randOffLeft(block)}px`; //random drop spot off left wall
  blocks.push(block); //push new block into blocks array
  body.appendChild(block);
};

// detects collision between BLOBBY and rocks
checkCollision = (i) => { //would like to refine this for a more accurate hit box
  blockPos = blocks[i].getBoundingClientRect();
  playerPos = player.getBoundingClientRect();
  if (playerPos.bottom >= blockPos.bottom) {
    if (playerPos.left >= blockPos.left && playerPos.right <= blockPos.right || playerPos.right >= blockPos.left && playerPos.left <= blockPos.right) {
      if (playerPos.top <= blockPos.bottom) {
        clearInterval(int);
        youLose();
      };
    };
  };
};

//functions to make blocks fall
const dropEm = () => {
  for (let i=0; i<blocks.length; i++) {
    checkCollision(i);
    if (blocks[i] !== undefined && (blocks[i].offsetTop) < (window.innerHeight - blocks[i].offsetHeight)) {
        blocks[i].style.top =`${blocks[i].offsetTop + (window.innerHeight / 100)}px`; // converts a percentage into pixel form to keep drop rate the same for all screen sizes
    } else {
      resetBlock();
    };
  };
  score += 1;
};

// number generators
const randOffLeft = () => { //tells blocks how wide the screen is so it wont generate new ones off the screen
  return (Math.floor(Math.random() * (window.innerWidth - 40)));
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
  tutorialButton.style.display = 'none';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  player.style.display = 'block';
  finalScore.style.display = 'none';
  blockMaker = setInterval(generateBlocks, 90);
  int = setInterval(dropEm, 18);
  body.addEventListener('keydown', movePlayer, true);
  body.addEventListener('keyup', unMovePlayer, true);
};
const youLose = () => { // brings up try again when you get hit
  tryAgain.style.display = 'block';
  yesButton.style.display = 'block';
  noButton.style.display = 'block';
  finalScore.style.display = 'block';
  player.classList.add('dead')
  finalScore.innerText = `SCORE: ${Math.floor(score)}`;
  clearInterval(blockMaker);
  body.removeEventListener('keydown', movePlayer, true);
  yesButton.addEventListener('click', restartGame);
  noButton.addEventListener('click', backToMain);
};
const restartGame = () => { //when you hit yes button on lose state
  startGame();
  resetBlocks();
  score = 0;
  player.classList.remove('dead')
};
const backToMain = () => { //when you hit no button on lose state
  resetBlocks();
  score = 0
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
window.requestAnimationFrame(movingPlayer);
