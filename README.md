# Dodgy Blobby

A small roguelike dodge game for the browser. Move BLOBBY left and right to dodge falling rocks, grab coins, and see how many waves you can survive.

**Play:** https://mdellit110.github.io/DodgyBlobby/. On iPhone, open it in Safari and tap Share → Add to Home Screen to install it. It works offline and plays best in landscape.

## How to play
- **Move:** hold the left or right half of the screen, or use the arrow keys. Run off one side to come back on the other.
- **Lives:** you start with 3. A hit costs one life, then you blink for a moment and can't be hurt.
- **Waves:** every 30 seconds the wave ends and you pick 1 of 3 upgrade cards. Red cards are curses: they help and hurt at the same time. Each wave is harder than the last.
- **Rocks:** boulders (wave 2), needles (wave 3), splitters that break in two (wave 4) and drifters that slide sideways (wave 5).
- **Pickups:** coins, shield bubbles (block one hit) and bombs (clear the screen).
- **Shop:** coins are saved between runs. Spend them on permanent perks and on new members of the Blobby family, each with their own perk.

## Run it locally
It's plain HTML, CSS and JavaScript with no build step:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. For quick testing, add `?wavelen=3` (3-second waves) or `?startwave=5` (start on wave 5) to the URL.

## Credits
Background image from https://steamcommunity.com/sharedfiles/filedetails/?id=844946240. Fonts are Bungee and Bungee Shade from Google Fonts.
