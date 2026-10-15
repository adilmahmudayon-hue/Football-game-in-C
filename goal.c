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
#define SELECT "\x1b[1;30;43m"     // black text on yellow background

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

static const char *pointColor(int p) {
    if (p >= 5) return RED;
    if (p >= 2) return YELLOW;
    return GRAY;
}

void drawGoal(const char *title, int cursorRow, int cursorCol, int showBall) {
    int width = COLS * 6 + 1;                 // inner width of the goal

    printf("\x1b[H");                         // cursor to top-left, no flicker
    printf(BOLD "%s" RESET "\x1b[K\n\x1b[K\n", title);

    // crossbar
    printf("  " WHITE "#");
    for (int i = 0; i < width; i++) printf("=");
    printf("#" RESET "\x1b[K\n");

    for (int r = 0; r < ROWS; r++) {
        // row of cells
        printf("  " WHITE "#" RESET);
        for (int c = 0; c < COLS; c++) {
            printf(GRAY "|" RESET);
            if (r == cursorRow && c == cursorCol)
                printf(SELECT "[ %d ]" RESET, points[r][c]);
            else
                printf("%s  %d  " RESET, pointColor(points[r][c]), points[r][c]);
        }
        printf(GRAY "|" WHITE "#" RESET "\x1b[K\n");

        // net line, or grass under the last row
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

    // grass strip, then the ball on the penalty spot
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

void animateShot(const char *title, int row, int col) {
    int targetY = 4 + 2 * row;
    int targetX = 7 + 6 * col;
    int frames = 12;

    for (int i = 1; i <= frames; i++) {
        double t = (double)i / frames;
        int y = (int)(BALL_Y + (targetY - BALL_Y) * t + 0.5);
        int x = (int)(BALL_X + (targetX - BALL_X) * t + 0.5);

        drawGoal(title, row, col, 0);
        printf("\x1b[%d;%dH" BOLD "(O)" RESET, y, x - 1);
        fflush(stdout);
        sleepMs(45);
    }
    printf("\x1b[17;1H");                     // move below the picture
}

int getPoints(int row, int col) {
    return points[row][col];
}