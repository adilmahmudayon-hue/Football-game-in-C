#include <stdio.h>
#include <string.h>

#include "player.h"
#include "level.h"
#include <direct.h>

#define MAX_PLAYERS 100
#define PLAYER_FILE "data/players.txt"


static void ensureDataDir(void) {
    _mkdir("data");   // does nothing if the folder already exists
}

static void flushInput(void) {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

static int loadAll(Player list[]) {
    FILE *f = fopen(PLAYER_FILE, "r");
    if (!f) return 0;

    char line[128];
    int n = 0;
    while (n < MAX_PLAYERS && fgets(line, sizeof line, f)) {
        int level = 1;
        int got = sscanf(line, "%19s %19s %d %d %d %d",
                         list[n].name, list[n].password,
                         &list[n].highScore, &list[n].gamesPlayed,
                         &list[n].totalScore, &level);
        if (got >= 5) {
            list[n].level = (got == 6 && level >= 1 && level <= MAX_LEVEL)
                            ? level : 1;
            n++;
        }
    }
    fclose(f);
    return n;
}

static void saveAll(const Player list[], int n) {
    ensureDataDir();
    FILE *f = fopen(PLAYER_FILE, "w");
    
    if (!f) {
        printf("Error: could not save %s\n", PLAYER_FILE);
        return;
    }
    for (int i = 0; i < n; i++) {
        fprintf(f, "%s %s %d %d %d %d\n",
                list[i].name, list[i].password,
                list[i].highScore, list[i].gamesPlayed,
                list[i].totalScore, list[i].level);
    }
    fclose(f);
}

static void savePlayer(const Player *p) {
    Player list[MAX_PLAYERS];
    int n = loadAll(list);
    for (int i = 0; i < n; i++) {
        if (strcmp(list[i].name, p->name) == 0) {
            list[i] = *p;
            break;
        }
    }
    saveAll(list, n);
}

int registerPlayer(Player *p) {
    Player list[MAX_PLAYERS];
    int n = loadAll(list);

    if (n >= MAX_PLAYERS) {
        printf("Player limit reached.\n");
        return 0;
    }

    char name[NAME_LEN], pass[PASS_LEN];

    printf("Choose a username (no spaces): ");
    scanf("%19s", name);
    flushInput();

    for (int i = 0; i < n; i++) {
        if (strcmp(list[i].name, name) == 0) {
            printf("That username is already taken.\n");
            return 0;
        }
    }

    printf("Choose a password (no spaces): ");
    scanf("%19s", pass);
    flushInput();

    strcpy(list[n].name, name);
    strcpy(list[n].password, pass);
    list[n].highScore = 0;
    list[n].gamesPlayed = 0;
    list[n].totalScore = 0;
    list[n].level = 1;

    saveAll(list, n + 1);
    *p = list[n];
    printf("Account created. Welcome, %s!\n", name);
    return 1;
}

int loginPlayer(Player *p) {
    Player list[MAX_PLAYERS];
    int n = loadAll(list);

    char name[NAME_LEN], pass[PASS_LEN];

    printf("Username: ");
    scanf("%19s", name);
    flushInput();
    printf("Password: ");
    scanf("%19s", pass);
    flushInput();

    for (int i = 0; i < n; i++) {
        if (strcmp(list[i].name, name) == 0 &&
            strcmp(list[i].password, pass) == 0) {
            *p = list[i];
            printf("Welcome back, %s!\n", name);
            return 1;
        }
    }
    printf("Wrong username or password.\n");
    return 0;
}

void recordScore(Player *p, int score) {
    p->gamesPlayed++;
    p->totalScore += score;
    if (score > p->highScore) {
        p->highScore = score;
        printf("NEW HIGH SCORE: %d!\n", score);
    }
    savePlayer(p);      // updates this player's line in data/players.txt
}

void saveProgress(Player *p, int level) {
    p->level = level;
    savePlayer(p);
}

void showStats(const Player *p) {
    printf("Player:       %s\n", p->name);
    printf("Level:        %d / %d\n", p->level, MAX_LEVEL);
    printf("High score:   %d\n", p->highScore);
    printf("Games played: %d\n", p->gamesPlayed);
    printf("Total score:  %d\n", p->totalScore);
    if (p->gamesPlayed > 0)
        printf("Average:      %.1f\n", (double)p->totalScore / p->gamesPlayed);
}

void showLeaderboard(void) {
    Player list[MAX_PLAYERS];
    int n = loadAll(list);

    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (list[j].highScore < list[j + 1].highScore) {
                Player tmp = list[j];
                list[j] = list[j + 1];
                list[j + 1] = tmp;
            }
        }
    }

    printf("=== TOP PLAYERS ===\n\n");
    if (n == 0) {
        printf("No players yet.\n");
        return;
    }
    int top = n < 5 ? n : 5;
    for (int i = 0; i < top; i++) {
        printf("%d. %-15s %d  (level %d)\n",
               i + 1, list[i].name, list[i].highScore, list[i].level);
    }
}