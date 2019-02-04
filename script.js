const body = document.querySelector('body');
const startButton = document.querySelector('#start');
const tutorialButton = document.querySelector('#tutorial');
const title = document.querySelector('.title')
const player = document.querySelector('.player');

//player creation
const createPlayer = () => {
  player.style.background = 'blue';
  player.name = 'matt';
  player.setAttribute ('id','player');
  player.style.left = '740px';
  return player;
}

//player movement
let move = 700;
const movePlayer = (ev) => {
  const player = document.querySelector('.player');
  if (ev.keyCode === 39 && move < 1490) { //rightArrow
    move += 100;
    player.style.left = `${move}px`;
  } else if (ev.keyCode === 37 && move > 0) { //leftArrow
    move -= 100;
    player.style.left = `${move}px`;
  }
}

//generates all blocks inline
const generateBlocks = (block) => {
  for (i=1; i<=1; i++) {
    const block = document.createElement('div');
    block.classList.add('blocks');
    block.style.background = 'white';
    block.setAttribute('id', i);
    body.appendChild(block);
  }
}

//collision detection functions
  checkCollision = () => {
    const block = document.querySelector('.blocks');
    const playerPos = player.getBoundingClientRect();
    const blockPos = block.getBoundingClientRect();
    if (playerPos.bottom >= blockPos.bottom) {
      if (playerPos.left >= blockPos.left && playerPos.right <= blockPos.right) {
        if (playerPos.top <= blockPos.bottom) {
          player.style.background = 'red';
        }
      }
    }
  }

//move blocks downwards
const dropEm = () => {
  const blocks = document.querySelectorAll('.blocks');
  for (j=0; j<1; j++) {
    drop += 10;
    for (i=0; i<1; i++) {
      blocks[i].style.top = `${drop}px`;
      checkCollision();
    }
  }
}

const moveBlocks = (num) => {
  drop = num;
  const setIt = setInterval(dropEm, 50);
}

  // start button initiates game start;
  const startGame = (ev) => {
    startButton.style.display = 'none';
    title.style.display = 'none';
    tutorialButton.style.display = 'none';
    createPlayer();
    let num = 0;
    generateBlocks();
    moveBlocks(num);
    body.addEventListener('keydown', movePlayer);
  }



startButton.addEventListener('click', startGame)
