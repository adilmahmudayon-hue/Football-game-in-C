
# Football Shooting Game in C

A console football shooting game for Windows.

- Aim at targets in a wide goal using the arrow keys
- Player login and registration
- 5 levels, 3 shots each, with target scores
- Progress, scores and high scores saved in text files



## Data files

The game creates a `data/` folder automatically when you first save:

- `data/players.txt`: name, password, high score, games played, total score, level
- `data/scores.txt`: score history with dates

Run the game from the repo root so the folder is created there. The `data/` folder is not uploaded to GitHub.

## Build and run
gcc main.c goal.c input.c utils.c player.c level.c -o game.exe
.\game.exe
"@ | Set-Content README.md