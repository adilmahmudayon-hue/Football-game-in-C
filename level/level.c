#include "level.h"

static const Level levels[MAX_LEVEL] = {
    /* num shots target speed min max vanish sway */
       { 1, 3,  5, 2, 35, 70, 0,  0},
    { 2, 3,  7, 3, 40, 70, 0,  0},
    { 3, 3,  9, 3, 45, 70, 0,  0},
    { 4, 3, 11, 4, 50, 70, 0,  0},
    { 5, 3, 12, 5, 55, 70, 0,  0},
    { 6, 3,  9, 5, 58, 70, 1,  0},
    { 7, 3, 10, 5, 60, 70, 1,  0},
    { 8, 3, 11, 6, 62, 72, 1,  0},
    { 9, 3, 12, 6, 64, 72, 1,  0},
    {10, 3, 13, 7, 64, 72, 1,  0},
    {11, 3,  9, 6, 64, 74, 1, 14},
    {12, 3, 10, 6, 64, 74, 1, 12},
    {13, 3, 11, 7, 66, 74, 1, 10},
    {14, 3, 12, 7, 66, 74, 1,  8},
    {15, 3, 13, 7, 68, 76, 1,  6}
};

Level getLevel(int number) {
    if (number < 1) number = 1;
    if (number > MAX_LEVEL) number = MAX_LEVEL;
    return levels[number - 1];
}

const char *getTierName(int levelNumber) {
    if (levelNumber <= 3)  return "Beginner";
    if (levelNumber <= 6)  return "Easy";
    if (levelNumber <= 9)  return "Medium";
    if (levelNumber <= 12) return "Hard";
    return "Pro";
}