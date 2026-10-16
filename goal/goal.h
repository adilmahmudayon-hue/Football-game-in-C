#ifndef GOAL_H
#define GOAL_H

#include "power.h"

#define ROWS 4
#define COLS 9

// Draws the whole goal scene. cursorRow/cursorCol = -1 means no highlight.
void drawGoal(const char *title, int cursorRow, int cursorCol, int showBall);

// Flies the ball from the penalty spot depending on the shot result.
void animateShot(const char *title, int row, int col, ShotResult result);

void resetTargets(void);                  // bring all targets back
void vanishTarget(int row, int col);      // remove one target
int  isVanished(int row, int col);        // 1 if the target is gone

int getPoints(int row, int col);

#endif