#ifndef GOAL_H
#define GOAL_H

#define ROWS 4
#define COLS 9

// Draws the whole goal scene. cursorRow/cursorCol = -1 means no highlight.
void drawGoal(const char *title, int cursorRow, int cursorCol, int showBall);

// Animates the ball flying from the penalty spot to the chosen cell.
void animateShot(const char *title, int row, int col);

int getPoints(int row, int col);

#endif