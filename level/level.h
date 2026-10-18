#ifndef LEVEL_H
#define LEVEL_H

#define MAX_LEVEL 15

typedef struct {
    int number;
    int shots;
    int targetScore;
    int powerSpeed;
    int sweetMin;
    int sweetMax;
    int vanish;
    int sway;
    int keeperSpeed;   // frames per step (lower = faster)
    int keeperRows;    // rows he covers from the bottom (0 = no keeper)
} Level;

Level getLevel(int number);

const char *getTierName(int levelNumber);   // Beginner, Easy, Medium, Hard, Pro

#endif