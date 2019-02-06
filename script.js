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
    block.className = 'blocks'
    block.style.left = `${randOffLeft(block)}px`;
    blocks.push(block);
    body.appendChild(block);

};

//collision detection functions
checkCollision = () => {
  for (let i = 0; i < blocks.length; i++) {
      if (player.offsetLeft >= (blocks[i].offsetLeft + blocks[i].offsetWidth)
      && (player.offsetLeft + player.offsetWidth) <= blocks[i].offsetLeft
      && player.offsetTop <= (blocks[i].offsetTop + blocks[i].offsetHeight)) {
          clearInterval(int);
          resetBlock();
          youLose();
    };
  };
};

//move blocks downwards
const dropEm = () => {
  for (let i=0; i<blocks.length; i++) {
    checkCollision();
    if ((blocks[i].offsetHeight + blocks[i].offsetTop) < window.innerWidth) {
        blocks[i].style.top =`${blocks[i].offsetTop + (window.innerHeight / 100)}px`;
    } else {
      resetBlock()
      score += 10;
    };
  };
};


const moveBlocks = () => {
  int = setInterval(dropEm, 20);
};

// number generators
const randOffLeft = (block) => {

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
  blockMaker = setInterval(generateBlocks, 200);
  moveBlocks();
  body.addEventListener('keydown', movePlayer);
};



const restartGame = () => {
  startGame();
  reset();
  resetBlock();
  score = 0;
};

const resetBlock = () => {
  blocks.shift()
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
