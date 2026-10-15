#include "level.h"

static const Level levels[MAX_LEVEL] = {
    {1, 3,  6},
    {2, 3,  8},
    {3, 3, 10},
    {4, 3, 12},
    {5, 3, 14}
};

Level getLevel(int number) {
    if (number < 1) number = 1;
    if (number > MAX_LEVEL) number = MAX_LEVEL;
    return levels[number - 1];
}