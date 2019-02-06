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
    const block = document.createElement('div');
    block.style.background = '#ed9711';
    block.className = 'block'
    block.style.left = `${randOffLeft(block)}px`;
    blocks.push(block);
    body.appendChild(block);

};

checkCollision = (i) => {
  blockPos = blocks[i].getBoundingClientRect();
  playerPos = player.getBoundingClientRect();
  if (playerPos.bottom >= blockPos.bottom) {
    if (playerPos.left >= blockPos.left && playerPos.right <= blockPos.right || playerPos.right >= blockPos.left && playerPos.left <= blockPos.right) {
      if (playerPos.top <= blockPos.bottom) {
        clearInterval(int);
        youLose();
      };
    };
  } else {
    score += 1;
  };
};

//move blocks downwards
const dropEm = () => {
  for (let i=0; i<blocks.length; i++) {
    checkCollision(i);
    if ((blocks[i].offsetHeight + blocks[i].offsetTop) < window.innerWidth) {
        blocks[i].style.top =`${blocks[i].offsetTop + (window.innerHeight / 100)}px`;
    } else {
      resetBlock();
    };
  };
};

const moveBlocks = () => {
  int = setInterval(dropEm, 18);
};

// number generators
const randOffLeft = () => {
  return (Math.floor(Math.random() * (window.innerWidth - 40)));
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
  blockMaker = setInterval(generateBlocks, 170);
  moveBlocks();
  body.addEventListener('keydown', movePlayer);
};



const restartGame = () => {
  startGame();
  resetBlocks();
  score = 0;
};

const resetBlock = () => {
  let firstBlock = blocks.shift();
  firstBlock.parentNode.removeChild(firstBlock);
}

const resetBlocks = () => {
  while (blocks.length > 0){
    resetBlock();
  }
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
  finalScore.innerText = `SCORE: ${Math.floor(score / 100)}`;
  console.log(blockMaker);
  clearInterval(blockMaker);
  resetBlocks();
  yesButton.addEventListener('click', restartGame);
  noButton.addEventListener('click', backToMain);
};

startButton.addEventListener('click', startGame);


const backToMain = () => {
  resetBlocks();
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
