#ifndef LEVEL_H
#define LEVEL_H

#define MAX_LEVEL 10

typedef struct {
    int number;
    int shots;
    int targetScore;
    int powerSpeed;    // bar speed (higher = faster)
    int sweetMin;      // exact zone start (0-100)
    int sweetMax;      // exact zone end (0-100)
    int vanish;        // 1 = a scored target disappears
} Level;

Level getLevel(int number);

#endif