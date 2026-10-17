#ifndef INPUT_H
#define INPUT_H

typedef enum {
    KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT,
    KEY_ENTER, KEY_QUIT, KEY_OTHER
} Key;

Key readKey(void);

int keyPressed(void);   // 1 if a key is waiting (does not block)

#endif