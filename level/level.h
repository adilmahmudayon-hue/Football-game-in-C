#ifndef LEVEL_H
#define LEVEL_H

#define MAX_LEVEL 5

typedef struct {
    int number;
    int shots;
    int targetScore;
    int powerSpeed;    // bar speed (higher = faster)
    int sweetMin;      // green zone start (0-100)
    int sweetMax;      // green zone end (0-100)
} Level;

Level getLevel(int number);

#endif