#ifndef POWER_H
#define POWER_H

typedef enum {
    SHOT_HIT,      // landed inside the goal grid
    SHOT_OVER,     // went over the crossbar
    SHOT_UNDER,    // hit the ground before the goal
    SHOT_WIDE      // missed the goal sideways
} ShotResult;

// Runs the power bar. onTick (can be NULL) is called every frame,
// so the goal can keep moving while the bar runs.
int runPowerBar(int line, int speed, int sweetMin, int sweetMax,
                void (*onTick)(void));

ShotResult judgeShot(int power, int sweetMin, int sweetMax,
                     int targetRow, int totalRows, int *landRow);

#endif