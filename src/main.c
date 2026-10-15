#include <stdio.h>
#include "goal.h"
#include "input.h"
#include "utils.h"
#include "player.h"
#include "level.h"
#include "power.h"

static void pause(void) {
    printf("\nPress any key to continue...");
    readKey();
}

static int askTwo(const char *a, const char *b) {
    int choice;
    while (1) {
        printf("\n1. %s\n2. %s\n\nChoose: ", a, b);
        if (scanf("%d", &choice) == 1) {
            while (getchar() != '\n');
            if (choice == 1 || choice == 2) return choice;
        } else {
            while (getchar() != '\n');
        }
    }
}

// Lets the player pick a target cell. Returns 1 if confirmed, 0 if they quit.
static int aimShot(const char *title, int *row, int *col) {
    *row = 1;
    *col = COLS / 2;

    clearScreen();
    hideCursor();

    while (1) {
        drawGoal(title, *row, *col, 1);
        printf("Target: row %d, column %d  =  %d points\x1b[K\n",
               *row + 1, *col + 1, getPoints(*row, *col));
        printf("Arrows: move   Enter: lock target   Q: quit\x1b[K\n");

        switch (readKey()) {
            case KEY_UP:    if (*row > 0)        (*row)--; break;
            case KEY_DOWN:  if (*row < ROWS - 1) (*row)++; break;
            case KEY_LEFT:  if (*col > 0)        (*col)--; break;
            case KEY_RIGHT: if (*col < COLS - 1) (*col)++; break;
            case KEY_ENTER: return 1;
            case KEY_QUIT:  showCursor(); return 0;
            default: break;
        }
    }
}

// Returns 1 = passed, 0 = failed, -1 = quit
static int playLevel(Player *player, int levelNum) {
    Level lv = getLevel(levelNum);
    int score = 0;

    for (int shot = 1; shot <= lv.shots; shot++) {
        char title[80];
        snprintf(title, sizeof title,
                 "LEVEL %d | Shot %d/%d | Score %d/%d",
                 lv.number, shot, lv.shots, score, lv.targetScore);

        int row, col;
        if (!aimShot(title, &row, &col)) return -1;

               // power phase
        printf("\x1b[16;1H\x1b[JTarget locked: row %d, column %d (%d points)\n",
               row + 1, col + 1, getPoints(row, col));
        int power = runPowerBar(17, lv.powerSpeed, lv.sweetMin, lv.sweetMax);

        int landRow;
        ShotResult result = judgeShot(power, lv.sweetMin, lv.sweetMax,
                                      row, ROWS, &landRow);

        // for a hit, the ball ends in landRow; otherwise it just needs the column
        animateShot(title, result == SHOT_HIT ? landRow : row, col, result);

        printf("\x1b[21;1H\x1b[J");
        int pts = 0;
        if (result == SHOT_HIT) {
            pts = getPoints(landRow, col);
            if (landRow == row)
                printf("PERFECT! The ball hit your target: +%d points!\n", pts);
            else if (landRow < row)
                printf("Too much power! The ball landed %d row(s) higher: +%d points.\n",
                       row - landRow, pts);
            else
                printf("Not enough power! The ball landed %d row(s) lower: +%d points.\n",
                       landRow - row, pts);
        } else if (result == SHOT_OVER) {
            printf("Way too strong! The ball sailed over the bar. No points.\n");
        } else {
            printf("Way too weak! The ball hit the ground before the goal. No points.\n");
        }
        score += pts;
        sleepMs(1600);
        showCursor();
    }

    clearScreen();
    printf("=== LEVEL %d RESULT ===\n\n", lv.number);
    printf("Your score: %d   Target: %d\n\n", score, lv.targetScore);

    int passed = (score >= lv.targetScore);
    recordScore(player, score);

    if (passed) {
        printf("LEVEL COMPLETE!\n");
        if (levelNum < MAX_LEVEL) {
            saveProgress(player, levelNum + 1);
            printf("Level %d unlocked.\n", levelNum + 1);
        }
        return 1;
    }
    printf("Level failed. You needed %d more points.\n",
           lv.targetScore - score);
    return 0;
}

static void playSession(Player *player) {
    while (1) {
        int levelNum = player->level;
        Level lv = getLevel(levelNum);

        clearScreen();
        printf("=== LEVEL %d ===\n\n", lv.number);
        printf("Shots: %d\nTarget score: %d\n", lv.shots, lv.targetScore);
        printf("Perfect power zone: %d%% - %d%%\n", lv.sweetMin, lv.sweetMax);
        
                printf("\nLock your target, then stop the power bar.\n");
        printf("Green = exact target, lower = lands lower, higher = lands higher.\n");
        
        pause();

        int result = playLevel(player, levelNum);
        if (result == -1) return;

        if (result == 1) {
            if (levelNum == MAX_LEVEL) {
                printf("\nCONGRATULATIONS! You completed all %d levels!\n",
                       MAX_LEVEL);
                pause();
                return;
            }
            if (askTwo("Next level", "Back to menu") == 2) return;
        } else {
            if (askTwo("Repeat this level", "Quit to menu") == 2) return;
        }
    }
}

static int loginMenu(Player *player) {
    int choice;

    while (1) {
        clearScreen();
        printf("=== FOOTBALL SHOOTOUT ===\n\n");
        printf("1. Login\n2. Register\n3. Leaderboard\n4. Quit\n\nChoose: ");

        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n');
            continue;
        }
        while (getchar() != '\n');

        clearScreen();
        if (choice == 1) {
            if (loginPlayer(player)) { pause(); return 1; }
            pause();
        } else if (choice == 2) {
            if (registerPlayer(player)) { pause(); return 1; }
            pause();
        } else if (choice == 3) {
            showLeaderboard();
            pause();
        } else if (choice == 4) {
            return 0;
        }
    }
}

static void gameMenu(Player *player) {
    int choice;

    while (1) {
        clearScreen();
        printf("=== MENU (%s) - Level %d ===\n\n", player->name, player->level);
        printf("1. Play\n2. My stats\n3. Leaderboard\n4. Quit\n\nChoose: ");

        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n');
            continue;
        }
        while (getchar() != '\n');

        if (choice == 1) {
            playSession(player);
        } else if (choice == 2) {
            clearScreen();
            showStats(player);
            pause();
        } else if (choice == 3) {
            clearScreen();
            showLeaderboard();
            pause();
        } else if (choice == 4) {
            return;
        }
    }
}

int main(void) {
    Player player;
    initConsole();

    if (loginMenu(&player)) {
        gameMenu(&player);
    }
    printf("\nThanks for playing!\n");
    return 0;
}