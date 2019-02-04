const body = document.querySelector('body');
const startButton = document.querySelector('#start');
const tutorialButton = document.querySelector('#tutorial');
const title = document.querySelector('.title')
const player = document.querySelector('.player');
const tryAgain = document.querySelector('.tryAgain');
const yesButton = document.querySelector('#yes')
const noButton = document.querySelector('#no')
let drop = 0
let int

//player creation
const createPlayer = () => {
  player.style.background = 'blue';
  player.name = 'matt';
  player.setAttribute ('id','player');
}

//player movement
let move = 800;
const movePlayer = (ev) => {
  const player = document.querySelector('.player');
  if (ev.keyCode === 39 && move < 1490) { //rightArrow
    move += 80;
    player.style.left = `${move}px`;
  } else if (ev.keyCode === 37 && move > 0) { //leftArrow
    move -= 80;
    player.style.left = `${move}px`;
  }
}

//generates all blocks inline
const generateBlocks = (block) => {
  for (let i=1; i<=1; i++) {
    const block = document.createElement('div');
    block.classList.add('blocks');
    block.style.background = 'white';
    block.setAttribute('id', i);
    body.appendChild(block);
  }
  return block
}

//collision detection functions
checkCollision = (block, playerPos, blockPos) => {
  if (playerPos.bottom >= blockPos.bottom) {
    if (playerPos.left >= blockPos.left && playerPos.right <= blockPos.right) {
      if (playerPos.top <= blockPos.bottom) {
        player.style.background = 'red';
        clearInterval(int);
        youLose();
      }
    }
  }
}

//move blocks downwards
const dropEm = () => {
  const blocks = document.querySelectorAll('.blocks');
  const block = document.querySelector('.blocks');
  const playerPos = player.getBoundingClientRect();
  const blockPos = block.getBoundingClientRect();
 if (blockPos.bottom <= 850) {
    for (let j=0; j<1; j++) {
      drop += 10;
      console.log(drop);
      for (let i=0; i<1; i++) {
        blocks[i].style.top = `${drop}px`;
        checkCollision(block, playerPos, blockPos);
      }
    }
  } else {
    resetBlock()
  }
}

const moveBlocks = () => {
  int = setInterval(dropEm, 50);
}

// start button initiates game start;
const startGame = () => {
  startButton.style.display = 'none';
  title.style.display = 'none';
  tutorialButton.style.display = 'none';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  createPlayer();
  generateBlocks();
  moveBlocks();
  body.addEventListener('keydown', movePlayer);
}

const reset = () => {
  const block = document.querySelector('.blocks')
  drop = 0;
  block.remove();
}

const restartGame = () => {
  reset()
  startGame()
}

const resetBlock = () => {
  reset()
  generateBlocks()
}

// when loss conditions are met
const youLose = () => {
  tryAgain.style.display = 'block';
  yesButton.style.display = 'block';
  noButton.style.display = 'block';
  yesButton.addEventListener('click', restartGame);
  //TO DO
  //noButton.addEventListener('click', backToMain);
}

startButton.addEventListener('click', startGame);

//TO DO

// const backToMain = () => {
//   startButton.style.display = 'block';
//   title.style.display = 'block';
//   tutorialButton.style.display = 'block';
//   tryAgain.style.display = 'none';
//   yesButton.style.display = 'none';
//   noButton.style.display = 'none';
// }
