const body = document.querySelector('body');
//player creation
const createPlayer = () => {
  const player = document.querySelector('.player');
  player.style.background = 'blue';
  player.name = 'matt';
  player.setAttribute ('id','player');
  player.style.left = '740px'
  return player;
}
const chooseColor = () => {

}
const chooseName = () => {

}

//player movement
let move = 740;
const movePlayer = (ev) => {
  const player = document.querySelector('.player');
  if (ev.keyCode === 39 && move < 1490) { //rightArrow
    move += 50;
    player.style.left = `${move}px`;
  } else if (ev.keyCode === 37 && move > 0) { //leftArrow
    move -= 50;
    player.style.left = `${move}px`;
  }
}

body.addEventListener('keydown', movePlayer)
