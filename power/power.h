#ifndef POWER_H
#define POWER_H

typedef enum {
    SHOT_HIT,      // landed inside the goal grid
    SHOT_OVER,     // went over the crossbar
    SHOT_UNDER     // hit the ground before the goal
} ShotResult;

// Runs the power bar on the given screen line. Returns 0-100 when a key is pressed.
int runPowerBar(int line, int speed, int sweetMin, int sweetMax);

// Works out where the ball lands. landRow gets the row it ends up in
// (it can be outside 0..totalRows-1 for a miss).
ShotResult judgeShot(int power, int sweetMin, int sweetMax,
                     int targetRow, int totalRows, int *landRow);

#endif