#ifndef PLAYER_H
#define PLAYER_H

#define NAME_LEN 20
#define PASS_LEN 20

typedef struct {
    char name[NAME_LEN];
    char password[PASS_LEN];
    int highScore;
    int gamesPlayed;
    int totalScore;
    int level;
} Player;

int  registerPlayer(Player *p);
int  loginPlayer(Player *p);
void recordScore(Player *p, int score);
void saveProgress(Player *p, int level);
void showStats(const Player *p);
void showLeaderboard(void);

#endif