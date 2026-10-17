#include <conio.h>
#include "input.h"

Key readKey(void) {
    int ch = _getch();

    if (ch == 0 || ch == 224) {      // arrow keys send two codes
        switch (_getch()) {
            case 72: return KEY_UP;
            case 80: return KEY_DOWN;
            case 75: return KEY_LEFT;
            case 77: return KEY_RIGHT;
        }
        return KEY_OTHER;
    }

    if (ch == 13) return KEY_ENTER;
    if (ch == 'q' || ch == 'Q') return KEY_QUIT;
    return KEY_OTHER;
}   // readKey ends here

int keyPressed(void) {
    return _kbhit();
}