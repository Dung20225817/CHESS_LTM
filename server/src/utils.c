#include "utils.h"
#include <stdio.h>
#include <string.h>
#include "board.h"

char assign_player(Room *room, SOCKET client) {
    char color = (room->player_count == 0) ? 'w' : 'b';
    room->players[room->player_count].sock = client;
    room->players[room->player_count].color = color;
    room->player_count++;
    return color;
}

void send_initial_state(SOCKET client, Room *room, char color) {
    char msg[256];
    sprintf(msg, "{\"type\":\"assignColor\",\"color\":\"%s\"}", (color == 'w') ? "white" : "black");
    send(client, msg, (int)strlen(msg), 0);
    send(client, "\n", 1, 0);

    char json[4096];
    get_board_json(room, json);
    send(client, json, (int)strlen(json), 0);
    send(client, "\n", 1, 0);
}
