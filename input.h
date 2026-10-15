#ifndef INPUT_H
#define INPUT_H

typedef enum {
    KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT,
    KEY_ENTER, KEY_QUIT, KEY_OTHER
} Key;

Key readKey(void);

#endif