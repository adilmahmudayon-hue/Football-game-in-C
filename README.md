# ⚽ Football Shootout — Football Shooting Game in C and JavaScript

A football shooting game with two versions: a **terminal game in C** (Windows) and an **online web game** you can play from anywhere, on desktop or phone. Aim at regions of the goal, time your shot power, beat the goalkeeper, and clear 15 levels.

## 🌍 Play Online

**👉 [Play now: football-game-in-c.onrender.com](https://football-game-in-c.onrender.com)**

- Works on desktop (keyboard) and on phones (on-screen touch buttons).
- Create an account or log in, and your progress is saved online.
- The game runs on free hosting, so the **first load can take up to a minute** while the server wakes up. Please wait and it will start.
- On a phone, turn the screen sideways for a bigger goal, and use *Add to Home screen* in your browser menu to open it like an app.

**Links**

| What | Link |
|---|---|
| Play the game | https://football-game-in-c.onrender.com |
| Leaderboard data (JSON) | https://football-game-in-c.onrender.com/api/leaderboard |
| Source code | https://github.com/adilmahmudayon-hue/Football-game-in-C |

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [How to Play](#-how-to-play)
- [Levels and Ranks](#-levels-and-ranks)
- [Project Structure](#-project-structure)
- [Run the Web Version Locally](#-run-the-web-version-locally)
- [Build the Console Version](#-build-the-console-version)
- [Deploying Your Own Copy](#-deploying-your-own-copy)
- [Data Storage](#-data-storage)
- [Technologies Used](#-technologies-used)
- [Future Improvements](#-future-improvements)
- [Author](#-author)

## 🎮 Overview

Players register or log in, pick a level, aim at a cell inside the goal and stop a power bar. The power decides how high the ball lands compared to the target. The game awards points and checks whether the player reached the target score to unlock the next level.

The C version follows a modular approach, with separate modules for the goal, input, players, levels, power and utilities. The web version uses the same game rules, with accounts stored in an online database.

## ✨ Features

### Both versions

- Player accounts: registration and login
- 9x4 goal with a points grid (corners and edges are worth the most)
- Power bar that controls the height of the shot
- 15 levels with 3 shots each and a target score
- Ranks: Beginner, Easy, Medium, Hard and Pro
- **Goalkeeper** from level 4. He slides across the goal, catches shots on his middle column and pushes them away on his sides. He is faster and taller on higher levels.
- **Vanishing targets** from level 6: a target you score on disappears for the rest of the level
- **Moving goal** from level 11: the goal slides left and right, so you have to aim ahead of it
- Level select with locked levels and a Play / Back preview
- Saved high score, total score, games played and current level
- Leaderboard of the top players

### Console version

- ANSI colors and a text-based ball flight animation
- Accounts saved locally in `data/players.txt`

### Web version

- Canvas graphics: goal, net, grass, goalkeeper, power bar and animated ball
- Touch controls for phones
- Online accounts with **hashed passwords** stored in a Supabase (Postgres) database
- Quit level button during play

## 🕹️ How to Play

1. Register an account or log in.
2. Choose **Play** to continue, or **Select level** to pick an unlocked level.
3. Move the target over the goal.
4. Lock the target.
5. Stop the power bar.
6. Reach the target score before you run out of shots to unlock the next level.

### Controls

| Action | Keyboard | Phone |
|---|---|---|
| Move target | Arrow keys | Arrow buttons |
| Lock target | Enter | LOCK / SHOOT |
| Stop power bar | Space or Enter (any key in console) | LOCK / SHOOT |
| Quit level | Esc (Q in console) | Quit level button |

### Shot outcomes

| Power | Result |
|---|---|
| In the exact zone | The ball lands on your target. |
| Above the zone | The ball lands 1 or 2 rows higher and may still score. |
| Below the zone | The ball lands 1 or 2 rows lower and may still score. |
| Top-row target, too much power | Over the bar, no points. |
| Bottom-row target, too little power | Hits the ground, no points. |
| Lands on the goalkeeper | Caught or pushed away, no points. The target does not vanish. |
| Lands on a vanished target | The ball flies through the gap, no points. |
| Goal has moved away (levels 11+) | The ball goes wide, no points. |

## 🏆 Levels and Ranks

| Level | Rank | Target | Bar speed | Exact zone | Mechanics |
|---|---|---|---|---|---|
| 1 | Beginner | 5 | 2 | 35% - 70% | none |
| 2 | Beginner | 7 | 3 | 40% - 70% | none |
| 3 | Beginner | 9 | 3 | 45% - 70% | none |
| 4 | Easy | 11 | 4 | 50% - 70% | goalkeeper |
| 5 | Easy | 12 | 5 | 55% - 70% | goalkeeper |
| 6 | Easy | 9 | 5 | 58% - 70% | + vanishing targets |
| 7 | Medium | 10 | 5 | 60% - 70% | + vanishing targets |
| 8 | Medium | 11 | 6 | 62% - 72% | + vanishing targets |
| 9 | Medium | 12 | 6 | 64% - 72% | + vanishing targets |
| 10 | Hard | 13 | 7 | 64% - 72% | taller goalkeeper |
| 11 | Hard | 9 | 6 | 64% - 74% | + moving goal |
| 12 | Hard | 10 | 6 | 64% - 74% | + moving goal |
| 13 | Pro | 11 | 7 | 66% - 74% | + faster moving goal |
| 14 | Pro | 12 | 7 | 66% - 74% | + faster moving goal |
| 15 | Pro | 13 | 7 | 68% - 76% | fastest goal and goalkeeper |

## 📂 Project Structure

```text
Football-game-in-C/
├── src/main.c            console game: menus and level loop
├── goal/                 goal, goalkeeper, vanishing targets, animation
├── input/                keyboard input
├── level/                level settings and rank names
├── player/               accounts, stats, leaderboard (console)
├── power/                power bar and shot evaluation
├── utils/                console and timing helpers
├── web/                  web game
│   ├── index.html
│   ├── style.css
│   ├── game.js           canvas game
│   ├── levels.js         level data
│   └── menu.js           login, menus, touch controls
├── server.js             Node server: web files and API
├── auth.js               password hashing
├── import.js             one-time import of players.txt into Supabase
├── package.json
├── data/                 console game saves (not uploaded)
└── README.md
```

## 💻 Run the Web Version Locally

Requirements: Node.js and a free Supabase project (see [Deploying Your Own Copy](#-deploying-your-own-copy)).

```powershell
npm install
$env:SUPABASE_URL = "https://YOUR-PROJECT.supabase.co"
$env:SUPABASE_SERVICE_KEY = "YOUR-SECRET-KEY"
node server.js
```

Open http://localhost:3000. The two variables only last for the terminal window where you set them.

## 🖥️ Build the Console Version

Requirements: Windows, GCC (MinGW), and a terminal with ANSI color support (VS Code terminal or Windows Terminal).

```powershell
gcc src/main.c goal/goal.c input/input.c utils/utils.c player/player.c level/level.c power/power.c -Igoal -Iinput -Iutils -Iplayer -Ilevel -Ipower -o game.exe
.\game.exe
```

Run it from the repository root so the `data/` folder is created there.

## ☁️ Deploying Your Own Copy

The game is hosted on [Render](https://render.com) as a Node web service.

1. Create a Supabase project and run this in its SQL Editor:

```sql
create table players (
  name text primary key,
  password_hash text not null,
  high_score int not null default 0,
  games_played int not null default 0,
  total_score int not null default 0,
  level int not null default 1
);
alter table players enable row level security;
```

2. On Render, create a **Web Service** from your GitHub repo with Build Command `npm install` and Start Command `npm start`.
3. Add the environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (the **secret** key) in Render's **Environment** settings.
4. Keep the secret key private. Never commit it to the repository.

## 💾 Data Storage

- **Web version:** players are stored in a Supabase Postgres table. Passwords are hashed with scrypt and salted. Data survives restarts and redeploys.
- **Console version:** players are stored locally in `data/players.txt`, which is not uploaded to GitHub.
- The two versions keep **separate accounts and scores**. An account created on the website cannot be used in the console game, and the other way round.

## 🛠️ Technologies Used

- **C** and **GCC (MinGW)** for the console game
- **ANSI escape sequences** and Windows console APIs for terminal graphics and input
- **HTML5 canvas, CSS and JavaScript** for the web game
- **Node.js** for the server
- **Supabase (Postgres)** for online data storage
- **Render** for hosting
- **Git and GitHub** for version control

## 🔮 Future Improvements

- [ ] Sound effects
- [ ] Screenshots and a gameplay demo
- [ ] Shared accounts between the console and web versions
- [ ] Persistent login sessions
- [ ] Rank shown in the web in-game display
- [ ] Add a license

## 👨‍💻 Author

**Adil Mahmud Ayon**

- GitHub: [@adilmahmudayon-hue](https://github.com/adilmahmudayon-hue)
- Project: [Football-game-in-C](https://github.com/adilmahmudayon-hue/Football-game-in-C)

---

⭐ If you like this project, consider starring the repository!

**Built with C, JavaScript and a passion for football. ⚽**