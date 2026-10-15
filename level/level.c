#include "level.h"

static const Level levels[MAX_LEVEL] = {
    /* num shots target speed min max */
    {1, 3,  4, 2, 35, 70},
    {2, 3,  6, 3, 40, 70},
    {3, 3,  8, 3, 45, 70},
    {4, 3, 10, 4, 50, 70},
    {5, 3, 12, 5, 55, 70}
};

Level getLevel(int number) {
    if (number < 1) number = 1;
    if (number > MAX_LEVEL) number = MAX_LEVEL;
    return levels[number - 1];
}