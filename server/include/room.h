#ifndef ROOM_H
#define ROOM_H

#include <winsock2.h>
#include <string.h>

#define MAX_CLIENTS 2
#define MAX_ROOMS 8

typedef struct {
    SOCKET sock;
    char color; // 'w' hoặc 'b'
} Player;

typedef struct {
    char name[32];
    char board[8][8];
    char turn;
    int player_count;
    Player players[MAX_CLIENTS];
} Room;

extern Room rooms[MAX_ROOMS];
extern int room_count;

int get_or_create_room(const char *room_name);
void broadcast_room(Room *room, const char *msg);
void remove_player(Room *room, SOCKET client);

#endif
