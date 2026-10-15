# ⚽ Football Shootout — A Terminal-Based Game in C

A terminal-based football shootout game built with **C**, featuring precision aiming, power timing, multiple difficulty levels, player accounts, persistent progress, personal statistics, and a leaderboard.

🎮 **Repository:** [Football-game-in-C](https://github.com/adilmahmudayon-hue/Football-game-in-C)

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Game Features](#-game-features)
- [Gameplay](#-gameplay)
- [Scoring System](#-scoring-system)
- [Level Progression](#-level-progression)
- [Technologies Used](#-technologies-used)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [How to Play](#-how-to-play)
- [Programming Concepts](#-programming-concepts)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## 🎮 About the Project

**Football Shootout** is an interactive football penalty-shootout game developed using the C programming language. It challenges players to aim accurately at different regions of a goal and control their shooting power to score as many points as possible.

Unlike a simple text-based guessing game, Football Shootout combines target selection, power timing, shot evaluation, animated feedback, and level-based progression to create a more engaging terminal gaming experience.

Players can register an account, log in, play through progressively challenging levels, track their performance, and compare their scores on a leaderboard.

The project is also an exploration of modular C programming, with separate modules for gameplay, player management, level configuration, input handling, power control, and goal-related logic.

## ✨ Game Features

### 👤 Player Registration and Login

- Register as a player.
- Log in to an existing player account.
- Maintain player-specific game progress.
- Access personal statistics and scores.

### 🎯 Interactive Goal Aiming

- Select a target position inside the goal.
- Navigate through goal cells using the arrow keys.
- View the potential points for the selected target.
- Confirm the target before taking a shot.
- Quit the aiming phase when needed.

### ⚡ Shot Power System

- Control shooting power using an interactive power bar.
- Aim for the optimal power zone.
- Adjust shot power to influence where the ball lands.
- Receive feedback when a shot is too powerful or too weak.

### 🏆 Multiple Levels

- Play through a series of levels.
- Each level has its own target score, shot limit, and power range.
- Unlock new levels by achieving the required score.
- Replay a level when the target score is not reached.
- Select previously unlocked levels.

### 📊 Score Tracking

- Earn points based on successful shots and their landing positions.
- Accumulate points over a series of shots.
- Compare the final score with the level's target.
- Record scores for player statistics and leaderboard use.

### 📈 Player Statistics and Leaderboard

- View personal game statistics.
- Record scores after completing a level attempt.
- View the leaderboard to compare player performance.

### 🖥️ Terminal Interface

- Menu-based navigation.
- Keyboard-driven gameplay.
- Screen clearing and cursor control.
- Animated shot feedback and colored terminal output where supported.

---

## 🕹️ Gameplay

A typical game session follows this sequence:

1. **Launch the game.** The main menu presents Login, Register, Leaderboard, and Quit options.
2. **Access your account.** Register a new player or log in with an existing account.
3. **Enter the game menu.** Continue from your current level, select an unlocked level, view your statistics, or open the leaderboard.
4. **Review the level.** Check the number of shots, target score, and ideal power range.
5. **Aim at the goal.** Use the arrow keys to select a target cell.
6. **Lock your target.** Press Enter to confirm the selected position.
7. **Control the power.** Use the power-bar mechanic to determine your shot's strength.
8. **Watch the shot.** The game evaluates the shot, animates the result, and calculates points.
9. **Complete the level.** Reach the target score to unlock the next level.
10. **Continue playing.** Move to the next level, replay a failed level, or return to the menu.

## 🎯 Scoring System

The game evaluates each shot using its power and the selected target position.

The goal is divided into rows and columns. Different landing positions can produce different point values, determined by the game's scoring logic.

| Shot outcome | Result |
|---|---|
| Perfect shot | The ball reaches the selected target and awards its points. |
| Too much power | The ball lands higher than the selected target, potentially earning points. |
| Not enough power | The ball lands lower than the selected target, potentially earning points. |
| Shot over the bar | No points are awarded. |
| Shot too weak | No points are awarded. |

The total score is compared against the level's target score after all available shots have been taken.

**Level completion rule:** A player passes a level when their total score is greater than or equal to the required target score.

## 🏆 Level Progression

Each level is configured with parameters that control its gameplay:

- **Number of shots:** The attempts available to reach the target score.
- **Target score:** The minimum score required to pass.
- **Perfect power zone:** The range of power percentages considered ideal.
- **Power-bar speed:** Controls the power bar's behavior.

The level-selection menu displays whether each level is locked, currently unlocked, or completed.

Players cannot access locked levels. Completing a level unlocks the next one, while unsuccessful attempts can be repeated.

The game also congratulates players when they complete the final configured level.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| C | Core gameplay and application logic |
| GCC | Compilation |
| Standard C library | Input/output, strings, and other basic operations |
| ANSI escape sequences | Terminal screen control, cursor positioning, and visual effects |
| Keyboard input handling | Interactive aiming and gameplay controls |
| File handling, where implemented in the player module | Persistent player data, scores, and progress |
| Git and GitHub | Version control and source code hosting |

## 📂 Project Structure

The project uses separate modules for different responsibilities. Based on the headers included in `main.c`, the architecture includes the following components:

```text
Football-game-in-C/
│
├── main.c       # Main menu, gameplay flow, aiming, and level selection
├── goal.h       # Goal-related declarations
├── input.h      # Keyboard input declarations
├── utils.h      # Utility and console functions
├── player.h     # Player management and statistics declarations
├── level.h      # Level configuration declarations
├── power.h      # Shot-power and shot-evaluation declarations
│
├── goal.c       # Goal implementation, if present
├── input.c      # Input implementation, if present
├── utils.c      # Utility implementation, if present
├── player.c     # Player management implementation, if present
├── level.c      # Level implementation, if present
├── power.c      # Power system implementation, if present
│
└── README.md    # Project documentation
```

*Note: This is an architectural overview based on the modules referenced by `main.c`. The actual filenames, storage files, and directory arrangement may differ.*

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `main.c` | Main program flow, account menu, game menu, target selection, and level progression |
| `goal` | Goal rendering and target-point calculation |
| `input` | Keyboard input and key-event handling |
| `utils` | Console initialization, screen control, cursor visibility, and timing utilities |
| `player` | Registration, login, scores, player statistics, leaderboard, and progress saving |
| `level` | Level parameters, target scores, shot counts, and power settings |
| `power` | Power-bar execution, shot evaluation, and shot animation |

This modular design separates responsibilities and makes the project easier to understand, debug, and extend.

## 🚀 Installation and Setup

### Prerequisites

Before running the game, make sure you have:

- A C compiler such as GCC.
- Git, if you want to clone the repository.
- A terminal that supports the required keyboard input and ANSI escape sequences.

Windows users can use a compatible MinGW-w64 or MSYS2 GCC installation. Linux users can install GCC through their distribution's package manager.

Check whether GCC is available:

```bash
gcc --version
```

### Step 1: Clone the repository

```bash
git clone https://github.com/adilmahmudayon-hue/Football-game-in-C.git
```

### Step 2: Enter the project directory

```bash
cd Football-game-in-C
```

### Step 3: Compile the game

If all the corresponding `.c` implementation files are located in the project root, use:

```bash
gcc -std=c11 -Wall -Wextra main.c goal.c input.c utils.c player.c level.c power.c -o football
```

This command assumes the module filenames shown above. If your repository uses different filenames or subdirectories, adjust the command accordingly.

The `-Wall` and `-Wextra` flags enable useful compiler warnings.

### Step 4: Run the game

**Windows PowerShell:**

```powershell
.\football.exe
```

**Linux:**

```bash
./football
```

If your console initialization or keyboard-input implementation relies on platform-specific APIs, you may need the corresponding platform configuration or additional compiler settings.

## ⌨️ Controls

| Key | Action |
|---|---|
| Up Arrow | Move the target upward |
| Down Arrow | Move the target downward |
| Left Arrow | Move the target to the left |
| Right Arrow | Move the target to the right |
| Enter | Lock the selected target |
| Q | Quit the aiming phase |
| Number keys | Select menu options by entering the corresponding number |

The power-bar stopping control depends on the implementation of `runPowerBar()` and should be documented according to the actual controls in that module.

## 🧠 Programming Concepts

This project demonstrates the practical use of several C programming concepts.

### 1. Functions and modular programming

The program is divided into functions with specific responsibilities. Examples include `playLevel()`, `playSession()`, `levelSelect()`, and `gameMenu()`.

This improves readability and separates individual game operations.

### 2. Structures

The `Player` and `Level` structures organize related information.

- `Player` stores player-related data, including the name and current level.
- `Level` stores the settings required to run a particular level.

Structures make it easier to pass related data between functions.

### 3. Conditional statements

Conditional logic determines whether a shot hits the target, whether a level is passed, and whether the next level becomes available.

For example:

```c
int passed = (score >= lv.targetScore);
```

This expression checks whether the player's score meets the required target.

### 4. Loops

Loops manage repeated operations, including:

- Displaying menus until the player chooses to exit.
- Processing each shot in a level.
- Allowing repeated attempts at a failed level.
- Navigating the level-selection menu.

### 5. Pointers

Pointers are used to modify and access shared data.

For example:

```c
static int aimShot(const char *title, int *row, int *col);
```

The `row` and `col` pointers allow the function to update the selected target position directly.

### 6. Enumerations and constants

The shot result is represented by `ShotResult`, with outcomes such as `SHOT_HIT` and `SHOT_OVER`. Constants such as `MAX_LEVEL`, `ROWS`, and `COLS` help define the game's limits and configuration.

### 7. Input handling

The game processes numeric menu choices and special keyboard events. The aiming interface uses key codes to move the selected target and confirm or cancel an action.

### 8. String handling and formatted output

Functions such as `snprintf()` construct level-status messages, while formatted `printf()` calls display game instructions, scores, and results.

### 9. Game state and progression

The program maintains the current player, selected level, accumulated score, and shot results. These values determine how the game progresses from one stage to another.

### 10. Console control and animation

ANSI escape sequences are used to position output, clear parts of the screen, and control cursor visibility. Together with timing utilities, these operations create a more dynamic terminal interface.

## 🔮 Future Improvements

Potential enhancements for future versions include:

- [ ] Add more levels with varied goal layouts and scoring challenges.
- [ ] Introduce different stadium or goal designs.
- [ ] Add sound effects for shots and goals.
- [ ] Improve account-data validation and error handling.
- [ ] Add more detailed player performance statistics.
- [ ] Display historical scores and best performances.
- [ ] Add a practice mode without level restrictions.
- [ ] Add different difficulty settings.
- [ ] Improve portability across Windows and Linux terminals.
- [ ] Add screenshots or a gameplay recording to the repository.

These are possible extensions rather than features claimed to exist in the current version.

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome.

To contribute:

1. Fork the repository.
2. Create a branch for your feature or fix.
3. Make your changes.
4. Compile and test the game.
5. Commit your changes and push the branch.
6. Submit a pull request describing the improvement.

Example Git commands:

```bash
git checkout -b feature/new-game-mode
git add .
git commit -m "Add new game mode"
git push origin feature/new-game-mode
```

## 👨‍💻 Author

**Adil Mahmud Ayon**

- GitHub: [@adilmahmudayon-hue](https://github.com/adilmahmudayon-hue)
- Repository: [Football-game-in-C](https://github.com/adilmahmudayon-hue/Football-game-in-C)

## 📄 License

Please check the repository for its current license. If no license has been added, consider including one to clarify the permissions granted to users who want to reuse or modify the project.

---

If you enjoy the project, consider giving the repository a ⭐ on GitHub.

**Made with C and a passion for football. ⚽**
