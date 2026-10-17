#include <stdio.h>
#include <conio.h>
#include "power.h"
#include "utils.h"

#define BAR_CELLS 40

#define RESET  "\x1b[0m"
#define GRAY   "\x1b[90m"
#define YELLOW "\x1b[33m"
#define GREEN  "\x1b[1;32m"
#define RED    "\x1b[1;31m"

static const char *zoneColor(int value, int sweetMin, int sweetMax) {
    if (value < sweetMin) return YELLOW;
    if (value > sweetMax) return RED;
    return GREEN;
}

static void drawBar(int line, int power, int sweetMin, int sweetMax) {
    printf("\x1b[%d;1H  POWER [", line);
    for (int i = 0; i < BAR_CELLS; i++) {
        int value = i * 100 / (BAR_CELLS - 1);
        if (value <= power)
            printf("%s#" RESET, zoneColor(value, sweetMin, sweetMax));
        else
            printf(GRAY "." RESET);
    }
    printf("] %3d%%\x1b[K", power);
    fflush(stdout);
}

int runPowerBar(int line, int speed, int sweetMin, int sweetMax,
                void (*onTick)(void)) {
    int power = 0;
    int dir = 1;

    while (_kbhit()) _getch();            // ignore keys pressed earlier

        printf("\x1b[%d;1H  " YELLOW "lower" RESET "   " GREEN "exact" RESET
           "   " RED "higher" RESET "\x1b[K", line + 1);
           
    printf("\x1b[%d;1H  Press any key to shoot!\x1b[K", line + 2);

       while (1) {
        if (onTick) onTick();
        drawBar(line, power, sweetMin, sweetMax);
        

        if (_kbhit()) {
            while (_kbhit()) _getch();    // clear the key (arrow keys send 2 codes)
            return power;
        }

        sleepMs(20);
        power += dir * speed;
        if (power >= 100) { power = 100; dir = -1; }
        else if (power <= 0) { power = 0; dir = 1; }
    }
}


#define ROW_STEP 15    // every 15% outside the green zone moves the ball one more row

ShotResult judgeShot(int power, int sweetMin, int sweetMax,
                     int targetRow, int totalRows, int *landRow) {
    int offset = 0;                 // positive = higher, negative = lower

    if (power < sweetMin)
        offset = -(1 + (sweetMin - power - 1) / ROW_STEP);
    else if (power > sweetMax)
        offset = 1 + (power - sweetMax - 1) / ROW_STEP;

    int r = targetRow - offset;     // row 0 is the top of the goal
    *landRow = r;

    if (r < 0) return SHOT_OVER;
    if (r >= totalRows) return SHOT_UNDER;
    return SHOT_HIT;
}