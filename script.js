const body = document.querySelector('body');
const startButton = document.querySelector('#start');
const tutorialButton = document.querySelector('#tutorial');
const title = document.querySelector('.title')
const player = document.querySelector('.player');
const tryAgain = document.querySelector('.tryAgain');
const yesButton = document.querySelector('#yes');
const noButton = document.querySelector('#no');
const finalScore = document.querySelector('.finalScore');
let blocks;
let drop = 0;
let score = 0;
let move = 50;
let int;
let blockMaker;


//player movement
const movePlayer = (ev) => {

  if (ev.keyCode === 39 && player.offsetLeft <= document.body.clientWidth) { //rightArrow
    move += 1;
    player.style.left = `${move}%`;
  } else if (ev.keyCode === 37 && move > 0) { //leftArrow
    move -= 1;
    player.style.left = `${move}%`;
  };
};

//generates all blocks inline

const generateBlocks = () => {
  for (let i=1; i<=10; i++) {
    const block = document.createElement('div');
    block.classList.add('blocks');
    block.style.background = '#ed9711';
    block.style.left = `${randOffLeft(block)}px`;
    block.dataset.blockId = i;
    body.appendChild(block);
  };
};

//collision detection functions
checkCollision = (blocks, playerPos, blockPos, i) => {
for (let i=0; i<blocks.length; i++) {
  blockPos = blocks[i].getBoundingClientRect();
  if (playerPos.bottom >= blockPos.bottom) {
    if (playerPos.left >= blockPos.left && playerPos.right <= blockPos.right || playerPos.right >= blockPos.left && playerPos.left <= blockPos.right) {
      if (playerPos.top <= blockPos.bottom) {
        clearInterval(int);
        youLose();
      };
    };
  };
};
};

//move blocks downwards
const dropEm = () => {
  const blocks = document.querySelectorAll('.blocks');
  const block = document.querySelector('.blocks');
  const playerPos = player.getBoundingClientRect();
  const blockPos = block.getBoundingClientRect();
 if (blockPos.bottom <= 850) {
    for (let j=0; j<1; j++) {
      drop += 10;
      for (let i=0; i<10; i++) {
        const block = blocks[i];
        block.style.top = `${drop}px`;
        checkCollision(blocks, playerPos, blockPos);
      };
    };
  } else {
    resetBlock()
    score += 10;
    console.log(score);
  };
  return playerPos;
};

const moveBlocks = () => {
  int = setInterval(dropEm, 20);
};

// number generators
const randOffLeft = (block) => {
  return (Math.floor(Math.random() * (document.body.clientWidth - 40)));
};
const randomInterval = () => {
  return (Math.floor(Math.random() * 1000));
};

// start button initiates game start;
const startGame = () => {
  startButton.style.display = 'none';
  title.style.display = 'none';
  tutorialButton.style.display = 'none';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  player.style.display = 'block';
  finalScore.style.display = 'none';
  blockMaker = setInterval(generateBlocks, 700);
  moveBlocks();
  body.addEventListener('keydown', movePlayer);
};

const reset = () => {

  const block = document.querySelectorAll('.blocks');
  drop = 0;
  for (let i=0; i<block.length; i++) {
    block[i].remove();
  };
};

const restartGame = () => {
  startGame();
  reset();
  score = 0;
};

const resetBlock = () => {
  reset();
};

// when loss conditions are met
const youLose = () => {
  //const blocks = document.querySelectorAll('.blocks');
  tryAgain.style.display = 'block';
  yesButton.style.display = 'block';
  noButton.style.display = 'block';
  finalScore.style.display = 'block';
  player.style.display = 'none';
  //blocks.style.display = 'none';
  finalScore.innerText = `SCORE: ${score}`;
  console.log(blockMaker);
  clearInterval(blockMaker);

  yesButton.addEventListener('click', restartGame);
  noButton.addEventListener('click', backToMain);
};

startButton.addEventListener('click', startGame);


const backToMain = () => {
  reset()
  score = 0
  startButton.style.display = 'block';
  title.style.display = 'block';
  finalScore.style.display = 'none';
  //tutorialButton.style.display = 'block';
  tryAgain.style.display = 'none';
  yesButton.style.display = 'none';
  noButton.style.display = 'none';
  player.style.display = 'none';
}
