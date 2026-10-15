#ifndef LEVEL_H
#define LEVEL_H

#define MAX_LEVEL 5

typedef struct {
    int number;
    int shots;
    int targetScore;
} Level;

Level getLevel(int number);

#endif