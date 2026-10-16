#include "level.h"

static const Level levels[MAX_LEVEL] = {
    /* num shots target speed min max vanish */
    { 1, 3,  4, 2, 35, 70, 0},
    { 2, 3,  6, 3, 40, 70, 0},
    { 3, 3,  8, 3, 45, 70, 0},
    { 4, 3, 10, 4, 50, 70, 0},
    { 5, 3, 12, 5, 55, 70, 0},
    { 6, 3,  8, 5, 58, 70, 1},
    { 7, 3,  9, 5, 60, 70, 1},
    { 8, 3, 10, 6, 62, 72, 1},
    { 9, 3, 11, 6, 64, 72, 1},
    {10, 3, 12, 7, 64, 72, 1}
};

Level getLevel(int number) {
    if (number < 1) number = 1;
    if (number > MAX_LEVEL) number = MAX_LEVEL;
    return levels[number - 1];
}