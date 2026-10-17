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

// Lets the player pick a target cell. Returns 1 if confirmed, 0 if they quit.
// Lets the player pick a target cell. Returns 1 if confirmed, 0 if they quit.
static int aimShot(const char *title, int *row, int *col, int sway) {
    *row = 1;
    *col = COLS / 2;
    const char *warn = "";
    int needDraw = 1;

    clearScreen();
    hideCursor();

    while (1) {
        if (needDraw) {
            drawGoal(title, *row, *col, 1);
            if (isVanished(*row, *col))
                printf("Target: row %d, column %d  =  GONE\x1b[K\n",
                       *row + 1, *col + 1);
            else
                printf("Target: row %d, column %d  =  %d points\x1b[K\n",
                       *row + 1, *col + 1, getPoints(*row, *col));
            printf("Arrows: move   Enter: lock target   Q: quit\x1b[K\n");
            printf("%s\x1b[K\n", warn);
            needDraw = 0;
        }

        if (!keyPressed()) {
            sleepMs(20);
            if (moveGoal(sway)) needDraw = 1;
            continue;
        }

        Key k = readKey();
        warn = "";
        needDraw = 1;
        switch (k) {
            case KEY_UP:    if (*row > 0)        (*row)--; break;
            case KEY_DOWN:  if (*row < ROWS - 1) (*row)++; break;
            case KEY_LEFT:  if (*col > 0)        (*col)--; break;
            case KEY_RIGHT: if (*col < COLS - 1) (*col)++; break;
            case KEY_ENTER:
                if (isVanished(*row, *col)) {
                    warn = "That target has vanished! Pick another one.";
                    break;
                }
                return 1;
            case KEY_QUIT:  showCursor(); return 0;
            default: break;
        }
    }
}


static const char *gTitle;
static int gRow, gCol, gSway;

static void tickGoal(void) {
    if (moveGoal(gSway)) drawGoal(gTitle, gRow, gCol, 1);
}

// Returns 1 = passed, 0 = failed, -1 = quit
// Returns 1 = passed, 0 = failed, -1 = quit
static int playLevel(Player *player, int levelNum) {
    Level lv = getLevel(levelNum);
    int score = 0;

    resetTargets();
    resetGoalPosition();
    gSway = lv.sway;

    for (int shot = 1; shot <= lv.shots; shot++) {
        char title[80];
        snprintf(title, sizeof title,
                 "LEVEL %d | Shot %d/%d | Score %d/%d",
                 lv.number, shot, lv.shots, score, lv.targetScore);

        int row, col;
        if (!aimShot(title, &row, &col, lv.sway)) return -1;

        int lockedX = goalCellX(col);     // where the ball will fly
        gTitle = title;
        gRow = row;
        gCol = col;

        printf("\x1b[16;1H\x1b[JTarget locked: row %d, column %d (%d points)\n",
               row + 1, col + 1, getPoints(row, col));
        if (lv.sway)
            printf("\x1b[20;1HThe goal is moving! The ball lands where the goal is when you stop the bar.");

        int power = runPowerBar(17, lv.powerSpeed, lv.sweetMin, lv.sweetMax,
                                tickGoal);

        int landRow;
        ShotResult result = judgeShot(power, lv.sweetMin, lv.sweetMax,
                                      row, ROWS, &landRow);
        int landCol = goalColAt(lockedX);
        if (result == SHOT_HIT && landCol < 0) result = SHOT_WIDE;

        animateShot(title, result == SHOT_HIT ? landRow : row, landCol,
                    lockedX, result);

        printf("\x1b[21;1H\x1b[J");
        int pts = 0;
        if (result == SHOT_HIT) {
            if (isVanished(landRow, landCol)) {
                printf("The ball flew through the gap where a target used to be. No points.\n");
            } else {
                pts = getPoints(landRow, landCol);
                if (landRow == row && landCol == col)
                    printf("PERFECT! The ball hit your target: +%d points!\n", pts);
                else if (landCol != col)
                    printf("The goal moved! The ball hit another target: +%d points.\n", pts);
                else if (landRow < row)
                    printf("Too much power! The ball landed %d row(s) higher: +%d points.\n",
                           row - landRow, pts);
                else
                    printf("Not enough power! The ball landed %d row(s) lower: +%d points.\n",
                           landRow - row, pts);

                if (lv.vanish) {
                    vanishTarget(landRow, landCol);
                    printf("That target has vanished!\n");
                }
            }
        } else if (result == SHOT_WIDE) {
            printf("The goal moved away! The ball missed wide of the post. No points.\n");
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
        if (levelNum < MAX_LEVEL && levelNum + 1 > player->level) {
            saveProgress(player, levelNum + 1);
            printf("Level %d unlocked.\n", levelNum + 1);
        }
        return 1;
    }
    printf("Level failed. You needed %d more points.\n",
           lv.targetScore - score);
    return 0;
}

static void playSession(Player *player, int levelNum) {
    while (1) {
        Level lv = getLevel(levelNum);

        clearScreen();
        printf("=== LEVEL %d ===\n\n", lv.number);
        printf("Shots: %d\nTarget score: %d\n", lv.shots, lv.targetScore);
        printf("Perfect power zone: %d%% - %d%%\n", lv.sweetMin, lv.sweetMax);
            if (lv.vanish)
        printf("\nWARNING: every target you score on vanishes!\n");
         
            if (lv.sway)
        printf("WARNING: the goal moves left and right!\n");
        
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
            levelNum++;
        } else {
            if (askTwo("Repeat this level", "Quit to menu") == 2) return;
        }
    }
}

// Shows level details and asks Play or Back. Returns 1 to play, 0 for back.
static int levelPreview(int levelNum) {
    Level lv = getLevel(levelNum);

    clearScreen();
    printf("=== LEVEL %d ===\n\n", lv.number);
    printf("Shots:        %d\n", lv.shots);
    printf("Target score: %d\n", lv.targetScore);
    printf("Exact zone:   %d%% - %d%%\n", lv.sweetMin, lv.sweetMax);
        if (lv.vanish)
        printf("\nWARNING: every target you score on vanishes!\n");

    return askTwo("Play", "Back to menu") == 1;
}


static void levelSelect(Player *player) {
    int choice;

    while (1) {
        clearScreen();
        
                printf("=== SELECT LEVEL ===\n\n");
        printf("Player: %s\n\n", player->name);
        
        for (int n = 1; n <= MAX_LEVEL; n++) {
            Level lv = getLevel(n);
            const char *status;
            if (n > player->level)       status = "LOCKED";
            else if (n == player->level) status = "UNLOCKED (current)";
            else                         status = "COMPLETED";

            printf("  %d. Level %d   target %2d   zone %d%%-%d%%   [%s]\n",
                   n, n, lv.targetScore, lv.sweetMin, lv.sweetMax, status);
        }
        printf("\n  0. Back\n\nChoose a level: ");

        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n');
            continue;
        }
        while (getchar() != '\n');

        if (choice == 0) return;
        if (choice < 1 || choice > MAX_LEVEL) continue;

        if (choice > player->level) {
            printf("\nLevel %d is locked. Complete level %d first.\n",
                   choice, choice - 1);
            pause();

            } 

            else if (levelPreview(choice)) {
            playSession(player, choice);
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
               printf("=== MENU ===\n\n");
        printf("Player: %s\n", player->name);
        printf("Level:  %d\n\n", player->level);
        printf("1. Play (continue level %d)\n", player->level);
        printf("2. Select level\n");
        printf("3. My stats\n");
        printf("4. Leaderboard\n");
                printf("5. Log out\n\nChoose: ");

        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n');
            continue;
        }
        while (getchar() != '\n');

        if (choice == 1) {
            playSession(player, player->level);
        } else if (choice == 2) {
            levelSelect(player);
        } else if (choice == 3) {
            clearScreen();
            showStats(player);
            pause();
        } else if (choice == 4) {
            clearScreen();
            showLeaderboard();
            pause();
        } else if (choice == 5) {
            return;
        }
    }
}

int main(void) {
    Player player;
    initConsole();

    while (loginMenu(&player)) {
        gameMenu(&player);      // when this returns, we go back to the login page
    }

    printf("\nThanks for playing!\n");
    return 0;
}