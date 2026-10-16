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

// Screen layout (1-based): title on line 1, crossbar on line 3,
// cell (r,c) is centered at line 4+2r, column 7+6c.
#define BALL_Y 14
#define BALL_X 31

static int points[ROWS][COLS] = {
    {5, 3, 2, 1, 1, 1, 2, 3, 5},
    {3, 2, 1, 1, 1, 1, 1, 2, 3},
    {3, 2, 1, 1, 1, 1, 1, 2, 3},
    {2, 1, 1, 1, 1, 1, 1, 1, 2}
};

static int vanished[ROWS][COLS];

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

static const char *pointColor(int p) {
    if (p >= 5) return RED;
    if (p >= 2) return YELLOW;
    return GRAY;
}

void drawGoal(const char *title, int cursorRow, int cursorCol, int showBall) {
    int width = COLS * 6 + 1;

    printf("\x1b[H");
    printf(BOLD "%s" RESET "\x1b[K\n\x1b[K\n", title);

    printf("  " WHITE "#");
    for (int i = 0; i < width; i++) printf("=");
    printf("#" RESET "\x1b[K\n");

        for (int r = 0; r < ROWS; r++) {
        printf("  " WHITE "#" RESET);
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
        }   // <-- this closing brace was missing
        printf(GRAY "|" WHITE "#" RESET "\x1b[K\n");

        if (r < ROWS - 1) {
            printf("  " WHITE "#" RESET GRAY);
            for (int c = 0; c < COLS; c++) printf("+-----");
            printf("+" WHITE "#" RESET "\x1b[K\n");
        } else {
            printf("  " WHITE "#" GREEN);
            for (int i = 0; i < width; i++) printf("~");
            printf(WHITE "#" RESET "\x1b[K\n");
        }
    }
    
    printf(GREEN "  ");
    for (int i = 0; i < width + 2; i++) printf("~");
    printf(RESET "\x1b[K\n");

    if (showBall) {
        printf("                             " BOLD ".-." RESET "\x1b[K\n");
        printf("                            " BOLD "( O )" RESET "\x1b[K\n");
        printf("                             " BOLD "'-'" RESET "\x1b[K\n");
    } else {
        printf("\x1b[K\n\x1b[K\n\x1b[K\n");
    }
}

// Flies the ball from the penalty spot to (endY, endX) along an arc.
// arcHeight = how many lines the ball rises above a straight line.
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

void animateShot(const char *title, int row, int col, ShotResult result) {
    int targetX = 7 + 6 * col;

    if (result == SHOT_HIT) {
        // row is the row the ball lands in
        int targetY = 4 + 2 * row;
        flyBall(title, row, col, targetY, targetX, 3, 16);
    } else if (result == SHOT_UNDER) {
        // drops onto the grass in front of the goal
        flyBall(title, -1, -1, 12, targetX, 2, 14);
    } else {
        // flies up past the crossbar and off the screen
        flyBall(title, -1, -1, -6, targetX, 0, 16);
    }
}

int getPoints(int row, int col) {
    if (vanished[row][col]) return 0;
    return points[row][col];
}