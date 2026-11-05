# CLAUDE.md

## Overview
Dodgy Blobby is a small roguelike dodge game: move left and right to dodge falling rocks, survive 30-second waves, pick upgrade cards, and spend saved coins in a shop. It's played mainly as an installed iPhone home-screen web app (landscape, touch), and also on desktop with the arrow keys. It's hosted on GitHub Pages from `master`.

## Tech stack
Plain HTML, CSS and JavaScript. No framework, no build step, no package.json and no test framework.

## Files
- `index.html`: all screens are static sections (`#mainMenu`, `#loseMenu`, `#upgradeMenu`, `#shopMenu`) plus `.player` and `.currentScore`. Rocks are added at runtime.
- `script.js`: the whole game, organised in commented sections:
  - **Tuning constants:** `PLAYER_SPEED`, `FALL_SPEED`, and so on. They are per second and scaled to the screen.
  - **Data tables:** `ROCK_TYPES` (rocks and pickups), `UPGRADES` (wave cards), `PERKS` and `BLOBBIES` (shop). To add content, add a row here.
  - **Save:** `loadSave`/`writeSave` use localStorage key `dodgyblobby-save`, with every read and write wrapped in try/catch. `save` is the live object.
  - **Stats:** `newStats()` builds the per-run stats (`baseStats()` + shop perks + chosen Blobby). Upgrades only change `stats` fields.
  - **Loop:** `movingParts(time)` runs on requestAnimationFrame. `dt` is in seconds and capped at 0.05. It calls `moveBlobby`, `generateBlocks`, `dropEm` and `speedUp` while `playing && !choosing`.
  - **Game states:** `startGame`, `youLose`, `restartGame`, `backToMain`, `endWave`/`pickCard`, `showMainMenu`/`openShop`. Each run is reset by `resetRun()`.
- `style.css`: sprites, rock and pickup looks (`.block.<type>`), menus, and the phone-specific rules at the bottom.
- `sw.js`: an offline cache-first service worker. `manifest.json` and `icons/` are for home-screen install.
- `blobStates/bloby0-3.png`: player sprites (left, right, idle, dead). Blobby colors are CSS `hue-rotate` on these.

## Run and test
- Serve: `python3 -m http.server 8000`, then open http://localhost:8000. A service worker needs http, not `file://`.
- Test URL params: `?wavelen=2` (short waves), `?startwave=5` (start later, so all rock types show up). With either param set, `TESTING` is true and nothing is written to the save, so tests that check saving must load the page without params.
- There's no test suite. Check changes in a headless browser with Playwright (preinstalled in cloud sessions). Use an `iPhone 13 landscape` profile plus a desktop viewport, and block service workers in tests (`serviceWorkers: 'block'`) so you get fresh files. Top-level variables (`stats`, `rocks`, `playing`, `choosing`, `save`, `endWave()`, `makeRock()`, `playerBox()`) can be read and set from `page.evaluate`.
- To check frame-rate independence, replace `requestAnimationFrame` with a fixed-step fake clock at 60 and 120 Hz and compare score per simulated second.
- `node --check script.js` catches syntax errors.

## Conventions
- Match the existing style: `const` arrow functions, top-level `let` state, short comments, `style.display` toggles for showing and hiding screens.
- All movement uses `* dt`. Never move things a fixed amount per frame.
- Position rocks with `transform` from their `{x, y}` data. Don't read layout (`offsetTop`, `getBoundingClientRect`) in the loop.
- Loop over `rocks` backwards when anything can be removed. Don't clear other entries mid-loop: the bomb sets `bombed` and clears rocks after the loop.
- Repeatable upgrade cards need an `ok` cap, or stacking them breaks balance (Slow-mo once made later waves easier).

## Gotchas
- **Bump the cache version on every release.** Bump `CACHE` in `sw.js` (`dodgyblobby-vN`) whenever files change, or installed phones keep the old copy. Add any new files to the `FILES` list.
- **Global button styles.** The base `button` rule is `position: absolute; width: 25%; height: 10%`. New in-flow buttons (cards, shop items) must override this with `position: static; width/height: auto`.
- **Touch handlers block taps.** The touch handlers call `preventDefault`, which blocks clicks. They're added only while playing (`addTouch`/`removeTouch`) and removed during the card pick and on lose. Keep it that way for any new tappable screen.
- **Shop scrolling.** `html`/`body` have `touch-action: none` (no zoom or pull-to-refresh). Scrollable panels like `#shopMenu` need `overflow-y: auto; touch-action: pan-y`.
- **Overlays can cover buttons.** Text overlays near buttons should use `pointer-events: none`. The lose-screen score once covered the YES/NO buttons.
- **Changing the player's animation.** `.player` has an entry animation. A class that changes `animation` must keep `enterLeft` first in its list, or removing the class replays the slide-in.
- **Save data.** Every save goes through `cleanSave()`. Add new save fields there with a default, so old saves keep working.
- **Saving coins.** Coins are added to the save with `bankCoins()`, on loss and when the app is hidden. It tracks `banked` so coins aren't counted twice.
- **Card-pick delay.** `pickCard` ignores input for 0.5s after a wave ends, so a finger still held down doesn't pick a card by accident.
- **Keep test files out of the repo.** Write Playwright scripts and screenshots outside the repo. A stray screenshot was committed once.
