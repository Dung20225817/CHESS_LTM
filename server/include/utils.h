#ifndef UTILS_H
#define UTILS_H

#include "room.h"
#include <winsock2.h>

void broadcast_room(Room *room, const char *msg);
void send_initial_state(SOCKET client, Room *room, char color);
char assign_player(Room *room, SOCKET client);

#endif
