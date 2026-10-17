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

#define MARGIN 10                 // the goal can slide 0..2*MARGIN characters
#define BALL_Y 14
#define BALL_X (31 + MARGIN)      // penalty spot, under the middle of the goal

static int points[ROWS][COLS] = {
    {5, 3, 2, 1, 1, 1, 2, 3, 5},
    {3, 2, 1, 1, 1, 1, 1, 2, 3},
    {3, 2, 1, 1, 1, 1, 1, 2, 3},
    {2, 1, 1, 1, 1, 1, 1, 1, 2}
};

static int vanished[ROWS][COLS];

static int goalShift = MARGIN;    // current horizontal position
static int goalDir = 1;
static int goalTicks = 0;

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

static const char *pointColor(int p) {
    if (p >= 5) return RED;
    if (p >= 2) return YELLOW;
    return GRAY;
}

void drawGoal(const char *title, int cursorRow, int cursorCol, int showBall) {
    int width = COLS * 6 + 1;
    int pad = 2 + goalShift;

    printf("\x1b[H");
    printf(BOLD "%s" RESET "\x1b[K\n\x1b[K\n", title);

    printf("%*s" WHITE "#", pad, "");
    for (int i = 0; i < width; i++) printf("=");
    printf("#" RESET "\x1b[K\n");

    for (int r = 0; r < ROWS; r++) {
        printf("%*s" WHITE "#" RESET, pad, "");
        for (int c = 0; c < COLS; c++) {
            printf(GRAY "|" RESET);

            if (vanished[r][c]) {
                if (r == cursorRow && c == cursorCol)
                    printf(SELECT "[ - ]" RESET);
                else
                    printf("     ");
            } else if (r == cursorRow && c == cursorCol) {
                printf(SELECT "[ %d ]" RESET, points[r][c]);
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

    printf(GREEN "  ");
    for (int i = 0; i < width + 2 + 2 * MARGIN; i++) printf("~");
    printf(RESET "\x1b[K\n");

    if (showBall) {
        printf("%*s" BOLD ".-." RESET "\x1b[K\n", 29 + MARGIN, "");
        printf("%*s" BOLD "( O )" RESET "\x1b[K\n", 28 + MARGIN, "");
        printf("%*s" BOLD "'-'" RESET "\x1b[K\n", 29 + MARGIN, "");
    } else {
        printf("\x1b[K\n\x1b[K\n\x1b[K\n");
    }
}

static void flyBall(const char *title, int row, int col,
                    int endY, int endX, int arcHeight, int frames) {
    for (int i = 1; i <= frames; i++) {
        double t = (double)i / frames;
        double y = BALL_Y + (endY - BALL_Y) * t - 4.0 * arcHeight * t * (1.0 - t);
        double x = BALL_X + (endX - BALL_X) * t;
        int iy = (int)(y + 0.5);
        int ix = (int)(x + 0.5);

        drawGoal(title, row, col, 0);
        if (iy >= 1 && iy <= 15)
            printf("\x1b[%d;%dH" BOLD "(O)" RESET, iy, ix - 1);
        fflush(stdout);
        sleepMs(45);
    }
}

void animateShot(const char *title, int row, int col, int targetX,
                 ShotResult result) {
    if (result == SHOT_HIT) {
        flyBall(title, row, col, 4 + 2 * row, targetX, 3, 16);
    } else if (result == SHOT_WIDE) {
        // flies toward the goal but lands beside it
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