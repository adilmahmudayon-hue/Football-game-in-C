#ifndef GOAL_H
#define GOAL_H

#include "power.h"

#define ROWS 4
#define COLS 9

void drawGoal(const char *title, int cursorRow, int cursorCol, int showBall);

// targetX = screen column the ball flies to. row/col = cell it lands in
// (col is -1 if the ball misses the goal).
void animateShot(const char *title, int row, int col, int targetX,
                 ShotResult result);

int  getPoints(int row, int col);

void resetTargets(void);
void vanishTarget(int row, int col);
int  isVanished(int row, int col);

void resetGoalPosition(void);      // put the goal back in the middle
int  moveGoal(int framesPerStep);  // returns 1 if the goal moved
int  goalCellX(int col);           // screen column of a cell's center
int  goalColAt(int x);  

#define KEEPER_W 3                 // keeper is 3 columns wide

void resetKeeper(int rows);        // rows covered from the bottom, 0 = no keeper
int  moveKeeper(int framesPerStep);   // returns 1 if he moved
int  keeperCovers(int row, int col);  // 1 if the keeper stands on this cell
int  keeperCaught(int col);        // 1 = clean catch, 0 = pushed away// which column is at screen column x, or -1

#endif