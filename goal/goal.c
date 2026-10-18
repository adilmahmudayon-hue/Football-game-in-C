#include <stdio.h>
#include "goal.h"
#include "utils.h"

#define RESET  "\x1b[0m"
#define BOLD   "\x1b[1;97m"
#define WHITE  "\x1b[97m"
#define GRAY   "\x1b[90m"
#define GREEN  "\x1b[32m"
#define YELLOW "\x1b[33m"
#define RED    "\x1b[1;31m"
#define SELECT "\x1b[1;30;43m"
#define KEEPER "\x1b[1;96m"

#define MARGIN 10
#define BALL_Y 14
#define BALL_X (31 + MARGIN)

static int points[ROWS][COLS] = {
    {5, 4, 3, 2, 3, 2, 3, 4, 5},
    {4, 3, 2, 1, 2, 1, 2, 3, 4},
    {4, 3, 2, 2, 1, 2, 2, 3, 4},
    {3, 2, 2, 1, 2, 1, 2, 2, 3}
};

static int vanished[ROWS][COLS];

/* ---------- vanishing targets ---------- */

void resetTargets(void) {
    for (int r = 0; r < ROWS; r++)
        for (int c = 0; c < COLS; c++)
            vanished[r][c] = 0;
}

void vanishTarget(int row, int col) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS)
        vanished[row][col] = 1;
}

int isVanished(int row, int col) {
    return vanished[row][col];
}

/* ---------- moving goal ---------- */

static int goalShift = MARGIN;
static int goalDir = 1;
static int goalTicks = 0;

void resetGoalPosition(void) {
    goalShift = MARGIN;
    goalDir = 1;
    goalTicks = 0;
}

int moveGoal(int framesPerStep) {
    if (framesPerStep <= 0) return 0;
    if (++goalTicks < framesPerStep) return 0;
    goalTicks = 0;

    goalShift += goalDir;
    if (goalShift >= 2 * MARGIN) { goalShift = 2 * MARGIN; goalDir = -1; }
    else if (goalShift <= 0)     { goalShift = 0;          goalDir = 1;  }
    return 1;
}

int goalCellX(int col) {
    return 7 + goalShift + 6 * col;
}

int goalColAt(int x) {
    int off = x - 4 - goalShift;
    if (off < 0 || off >= 6 * COLS) return -1;
    return off / 6;
}

/* ---------- goalkeeper ---------- */

static int keeperRows = 0;
static int kCol = 3;
static int kDir = 1;
static int kTicks = 0;

void resetKeeper(int rows) {
    keeperRows = rows;
    kCol = (COLS - KEEPER_W) / 2;
    kDir = 1;
    kTicks = 0;
}

int moveKeeper(int framesPerStep) {
    if (keeperRows <= 0 || framesPerStep <= 0) return 0;
    if (++kTicks < framesPerStep) return 0;
    kTicks = 0;

    kCol += kDir;
    if (kCol >= COLS - KEEPER_W) { kCol = COLS - KEEPER_W; kDir = -1; }
    else if (kCol <= 0)          { kCol = 0;               kDir = 1;  }
    return 1;
}

int keeperCovers(int row, int col) {
    if (keeperRows <= 0) return 0;
    if (row < ROWS - keeperRows) return 0;
    return col >= kCol && col < kCol + KEEPER_W;
}

int keeperCaught(int col) {
    return col == kCol + 1;          // middle = clean catch
}

/* ---------- drawing ---------- */

static const char *pointColor(int p) {
    if (p >= 5) return RED;
    if (p >= 3) return "\x1b[1;33m";
    if (p >= 2) return YELLOW;
    return GRAY;
}

// Draws the goalkeeper as a 15-character-wide figure in front of the goal.
static void drawKeeper(void) {
    if (keeperRows <= 0) return;

    int h = 2 * keeperRows;           // figure height in lines
    int topLine = 10 - h + 1;         // feet stand on the last goal row
    int left = goalCellX(kCol + 1) - 7;

    for (int i = 0; i < h; i++) {
        const char *s;
        if (i == 0)          s = "     (^_^)     ";
        else if (i == 1)     s = " \\==[#####]==/ ";
        else if (i == h - 1) s = "    /     \\    ";
        else                 s = "    |#####|    ";
        printf("\x1b[%d;%dH" KEEPER "%s" RESET, topLine + i, left, s);
    }
}

void drawGoal(const char *title, int cursorRow, int cursorCol, int showBall) {
    int width = COLS * 6 + 1;
    int pad = 2 + goalShift;

    printf("\x1b[H");
    printf(BOLD "%s" RESET "\x1b[K\n\x1b[K\n", title);

    // crossbar (line 3)
    printf("%*s" WHITE "#", pad, "");
    for (int i = 0; i < width; i++) printf("=");
    printf("#" RESET "\x1b[K\n");

    for (int r = 0; r < ROWS; r++) {
        printf("%*s" WHITE "#" RESET, pad, "");
        for (int c = 0; c < COLS; c++) {
            printf(GRAY "|" RESET);

            if (r == cursorRow && c == cursorCol) {
                if (vanished[r][c])
                    printf(SELECT "[ - ]" RESET);
                else
                    printf(SELECT "[ %d ]" RESET, points[r][c]);
            } else if (vanished[r][c]) {
                printf("     ");
            } else {
                printf("%s  %d  " RESET, pointColor(points[r][c]), points[r][c]);
            }
        }
        printf(GRAY "|" WHITE "#" RESET "\x1b[K\n");

        if (r < ROWS - 1) {
            printf("%*s" WHITE "#" RESET GRAY, pad, "");
            for (int c = 0; c < COLS; c++) printf("+-----");
            printf("+" WHITE "#" RESET "\x1b[K\n");
        } else {
            printf("%*s" WHITE "#" GREEN, pad, "");
            for (int i = 0; i < width; i++) printf("~");
            printf(WHITE "#" RESET "\x1b[K\n");
        }
    }

    // grass strip (line 12)
    printf(GREEN "  ");
    for (int i = 0; i < width + 2 + 2 * MARGIN; i++) printf("~");
    printf(RESET "\x1b[K\n");

    // ball on the penalty spot (lines 13-15)
    if (showBall) {
        printf("%*s" BOLD ".-." RESET "\x1b[K\n", BALL_X - 2, "");
        printf("%*s" BOLD "( O )" RESET "\x1b[K\n", BALL_X - 3, "");
        printf("%*s" BOLD "'-'" RESET "\x1b[K\n", BALL_X - 2, "");
    } else {
        printf("\x1b[K\n\x1b[K\n\x1b[K\n");
    }

    drawKeeper();                     // drawn last, so he stands in front

    printf("\x1b[16;1H");
}

/* ---------- ball flight ---------- */

static void flyBallFrom(const char *title, int row, int col,
                        int startY, int startX, int endY, int endX,
                        int arcHeight, int frames) {
    for (int i = 1; i <= frames; i++) {
        double t = (double)i / frames;
        double y = startY + (endY - startY) * t - 4.0 * arcHeight * t * (1.0 - t);
        double x = startX + (endX - startX) * t;
        int iy = (int)(y + 0.5);
        int ix = (int)(x + 0.5);

        drawGoal(title, row, col, 0);
        if (iy >= 1 && iy <= 15)
            printf("\x1b[%d;%dH" BOLD "(O)" RESET, iy, ix - 1);
        fflush(stdout);
        sleepMs(45);
    }
}

static void flyBall(const char *title, int row, int col,
                    int endY, int endX, int arcHeight, int frames) {
    flyBallFrom(title, row, col, BALL_Y, BALL_X, endY, endX, arcHeight, frames);
}

void animateShot(const char *title, int row, int col, int targetX,
                 ShotResult result) {
    if (result == SHOT_HIT) {
        flyBall(title, row, col, 4 + 2 * row, targetX, 3, 16);
    } else if (result == SHOT_SAVED) {
        int y = 4 + 2 * row;
        flyBall(title, row, col, y, targetX, 3, 14);
        if (keeperCaught(col)) {
            flyBallFrom(title, -1, -1, y, targetX, 11, targetX, 1, 6);
        } else {
            int side = (col < kCol + 1) ? -1 : 1;
            flyBallFrom(title, -1, -1, y, targetX, 11, targetX + side * 14, 3, 10);
        }
    } else if (result == SHOT_WIDE) {
        flyBall(title, -1, -1, 4 + 2 * row, targetX, 3, 16);
    } else if (result == SHOT_UNDER) {
        flyBall(title, -1, -1, 12, targetX, 2, 14);
    } else {
        flyBall(title, -1, -1, -6, targetX, 0, 16);
    }
}

int getPoints(int row, int col) {
    if (vanished[row][col]) return 0;
    return points[row][col];
}