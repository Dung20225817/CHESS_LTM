#include "room.h"
#include "board.h"
#include "utils.h"
#include <stdio.h>

Room rooms[MAX_ROOMS];
int room_count = 0;

int get_or_create_room(const char *room_name) {
    for (int i = 0; i < room_count; i++) {
        if (strcmp(rooms[i].name, room_name) == 0)
            return i;
    }
    if (room_count >= MAX_ROOMS)
        return -1;

    strncpy(rooms[room_count].name, room_name, sizeof(rooms[room_count].name) - 1);
    init_board(rooms[room_count].board, &rooms[room_count].turn);
    rooms[room_count].player_count = 0;

    printf("[Server] Created new room: %s\n", room_name);
    return room_count++;
}

void remove_player(Room *room, SOCKET client) {
    for (int i = 0; i < room->player_count; i++) {
        if (room->players[i].sock == client) {
            for (int j = i; j < room->player_count - 1; j++)
                room->players[j] = room->players[j + 1];
            room->player_count--;
            break;
        }
    }
}

void broadcast_room(Room *room, const char *msg) {
    for (int i = 0; i < room->player_count; i++) {
        send(room->players[i].sock, msg, (int)strlen(msg), 0);
        send(room->players[i].sock, "\n", 1, 0);
    }
}
