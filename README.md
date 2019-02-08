# Project Overview


## Project Description

Use this section to describe your final project and perhaps any links to relevant sites that help convey the concept and\or functionality.

the game will start on the main menu where the player will see the title have the option to start right away or look at the tutorial. One they press start they’ll be taken to the player creator where they can set the difficulty and choose the shape color and name their player. Once the game actually starts the player will see his avatar at the bottom center of the screen and will see a three second countdown to get them ready. after the timer runs out the players score will start going up based on how long they can avoid the falling blocks. The player has three lives and the game will end once all three lives are lost by the player colliding with one of the blocks three times. Next, the player will see their final score and the highest score so far. They will also have the option to change difficulty and try again or just go back the the main menu.

## Wireframes

Upload images of wireframe to cloudinary or Google Drive and add the link here with a description of the specific wireframe.
link to wireframes and pixel images:
https://drive.google.com/drive/folders/1Miz9uBLWfPv8QBKBI1SVmxnT7lmiBUJ8?usp=sharing

### MVP/PostMVP - 5min

The functionality will then be divided into two separate lists: MVP and PostMVP.  Carefully decided what is placed into your MVP as the client will expect this functionality to be implemented upon project completion.  

MVP and how I plan to solve it:
	I think the biggest problem ill face will be implementing the collision detection and understanding how that works. I plan on watching some instructional videos on the YouTubes. I also plan to make the collision detection my MVP and start with just focusing on getting one block to detect collision with my player model then expand from there implementing the randomly generated blocks that will fall from off the top of the screen. i am also going to hold off on the option to change character shape till the end because I’m pretty sure the collision detection formula differentiates based on the shapes that are colliding. If I can get the basic game working with just one difficulty and the lives system then I will try to add the rest of the features like the scoreboard and pausing features and ability the change shape of your player.
```
MVP:
	* collision detection
	* blocks fall smoothly
	* movable character
	* score displayed on lose screen
post-MVP:
	* randomly generated blocks falling
	* smooth moving character with pac-man like off screen moving skills
	* added background
	* animated titles and buttons
	* re-playability
	* create character and add to player block
	* make blocks looks like rocks falling
	* add an origin story for BLOBBY
	* add ability to store high score
	* 3 second timer to initiate rocks falling when you press start to give the player some time to get ready
	* varying difficulties
	* add the whole blobby family as playable characters DLC
	* more stuff
```
## Code Snippet

Use this section to include a brief code snippet of functionality that you are proud of an a brief description

i chose to show my player movement functionality because it works like pac man how when you run blobby off either side he reappears on the opposite side in the smoothest way i could make it. its also scalable to all screen sizes. how it works is before moveBlobby adds a percent to the movement in either direction it checks to see, in lefts case, if move is equal to the left edge of the map plus the width of the player and sets move to 100. for the right side it does the inverse.

```
const moveBlobby = () => {
  if (left){
    if (move <= -7.03125) { //if player hits left wall moves him to right wall
    move = 100;
    }
    move -= 1;
  } else if (right){
    if (move >= 100) { //if player hits right wall moves him to left wall
    move = -7.03125;
    }
    move += 1;
  };
  player.style.left = `${move}%`;
};
```
## to-do bug fixes

fix pac-man logic on movement-
 i noticed theres a small bug that you run into when you let go of the arrow while mid left wall it locks your movement to always go left, but it does not happen every time and i cant seem to force recreate it. i plan on starting the debugging process by looking more into the requestAnimationFrame function and understanding exactly how it creates the smooth movements.
