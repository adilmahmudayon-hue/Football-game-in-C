#include "level.h"

static const Level levels[MAX_LEVEL] = {
    /* num shots tgt spd min max van sway kSpd kRows */
    { 1, 3,  5, 2, 35, 70, 0,  0,  0, 0},
    { 2, 3,  7, 3, 40, 70, 0,  0,  0, 0},
    { 3, 3,  9, 3, 45, 70, 0,  0,  0, 0},
    { 4, 3, 11, 4, 50, 70, 0,  0, 25, 2},
    { 5, 3, 12, 5, 55, 70, 0,  0, 22, 2},
    { 6, 3,  9, 5, 58, 70, 1,  0, 20, 2},
    { 7, 3, 10, 5, 60, 70, 1,  0, 18, 2},
    { 8, 3, 11, 6, 62, 72, 1,  0, 16, 2},
    { 9, 3, 12, 6, 64, 72, 1,  0, 14, 2},
    {10, 3, 13, 7, 64, 72, 1,  0, 12, 3},
    {11, 3,  9, 6, 64, 74, 1, 14, 11, 3},
    {12, 3, 10, 6, 64, 74, 1, 12, 10, 3},
    {13, 3, 11, 7, 66, 74, 1, 10,  9, 3},
    {14, 3, 12, 7, 66, 74, 1,  8,  8, 3},
    {15, 3, 13, 7, 68, 76, 1,  6,  7, 3}
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