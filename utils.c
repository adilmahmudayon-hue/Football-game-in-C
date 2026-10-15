#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
#include "utils.h"

#ifndef ENABLE_VIRTUAL_TERMINAL_PROCESSING
#define ENABLE_VIRTUAL_TERMINAL_PROCESSING 0x0004
#endif

void initConsole(void) {
    HANDLE h = GetStdHandle(STD_OUTPUT_HANDLE);
    DWORD mode = 0;
    if (GetConsoleMode(h, &mode))
        SetConsoleMode(h, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

void clearScreen(void) {
    system("cls");
}

void sleepMs(int ms) {
    Sleep(ms);
}

void hideCursor(void) { printf("\x1b[?25l"); }
void showCursor(void) { printf("\x1b[?25h"); }