#include "client_handler.h"
#include "room.h"
#include "board.h"
#include "utils.h"
#include "server.h"
#include "auth.h"
#include "friend.h" // chứa get_friends, make_friend, struct Friend

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

unsigned __stdcall client_thread(void *arg)
{
    SOCKET client = *(SOCKET *)arg;
    free(arg);

    char buf[BUF_SIZE];

    int n = recv(client, buf, BUF_SIZE - 1, 0);
    if (n <= 0)
    {
        closesocket(client);
        return 0;
    }

    buf[n] = '\0';
    printf("[Server] Received: %s\n", buf);

    // 🔹 Kiểm tra nếu là LOGIN hoặc REGISTER message
    if (strstr(buf, "\"type\""))
    {
        char username[64] = {0}, password[64] = {0};
        char *type = strstr(buf, "\"type\"");
        char *u = strstr(buf, "\"username\"");
        char *p = strstr(buf, "\"password\"");

        if (u && p)
        {
            sscanf(u, "\"username\"%*[^'\"]\"%63[^\"]", username);
            sscanf(p, "\"password\"%*[^'\"]\"%63[^\"]", password);
        }

        // Xử lý LOGIN
        if (strstr(type, "LOGIN"))
        {
            printf("[Server] Processing login...\n");
            char *user_id = check_login(username, password);
            if (user_id)
            {
                char ok[256];
                snprintf(ok, sizeof(ok), "{\"type\":\"LOGIN\",\"success\":true,\"user_id\":\"%s\"}\n", user_id);
                send(client, ok, (int)strlen(ok), 0);
                printf("[Server] %s (id=%s) login OK\n", username, user_id);
                free(user_id);
            }
            else
            {
                const char *fail = "{\"type\":\"LOGIN\",\"success\":false}\n";
                send(client, fail, strlen(fail), 0);
                printf("[Server] %s login failed\n", username);
                closesocket(client);
                return 0;
            }
        }
        // Xử lý REGISTER
        else if (strstr(type, "REGISTER"))
        {
            printf("[Server] Processing register...\n");
            char *user_id = register_user(username, password);
            if (user_id)
            {
                char ok[256];
                snprintf(ok, sizeof(ok), "{\"type\":\"REGISTER\",\"success\":true,\"user_id\":\"%s\"}\n", user_id);
                send(client, ok, (int)strlen(ok), 0);
                printf("[Server] %s (id=%s) register OK\n", username, user_id);
                free(user_id);
            }
            else
            {
                const char *fail = "{\"type\":\"REGISTER\",\"success\":false}\n";
                send(client, fail, strlen(fail), 0);
                printf("[Server] %s register failed\n", username);
                closesocket(client);
                return 0;
            }
        }
    }

    // 🔹 Xử lý GET_FRIENDS
    if (strstr(buf, "\"type\": \"GET_FRIENDS\""))
    {
        int user_id = 0;
        char username[32];

        // Trích xuất user_id từ JSON
        char *p = strstr(buf, "\"user_id\"");
        if (p)
        {
            char user_id_str[16] = {0};
            sscanf(p, "\"user_id\"%*[^'\"]\"%15[^\"]", user_id_str);
            user_id = atoi(user_id_str);
        }

        if (user_id > 0)
        {
            Friend friends[100];
            int n = get_friends(user_id, friends, 100);

            char response[4096];
            int offset = snprintf(response, sizeof(response), "{\"type\":\"GET_FRIENDS\",\"friends\":[");
            for (int i = 0; i < n; i++)
            {
                if (i > 0)
                    offset += snprintf(response + offset, sizeof(response) - offset, ",");
                offset += snprintf(response + offset, sizeof(response) - offset, "{\"username\":\"%s\"}", friends[i].username);
            }
            snprintf(response + offset, sizeof(response) - offset, "]}");

            send(client, response, (int)strlen(response), 0);
            printf("[Server] Sent friends list for user_id=%d\n", user_id);
        }
        else
        {
            const char *fail = "{\"type\":\"GET_FRIENDS\",\"friends\":[]}";
            send(client, fail, strlen(fail), 0);
        }

        closesocket(client);
        return 0;
    }

    // 🔹 Xử lý MAKE_FRIEND
    if (strstr(buf, "\"type\":\"MAKE_FRIEND\""))
    {
        make_friend(buf); // dùng JSON client gửi: {"type":"MAKE_FRIEND","friend_a":"alice","friend_b":"bob"}

        const char *ok = "{\"type\":\"MAKE_FRIEND\",\"success\":true}";
        send(client, ok, strlen(ok), 0);

        closesocket(client);
        return 0;
    }

    // 🔹 phần cũ: xử lý room, move...
    char room_name[32] = {0};

    printf("[DEBUG] Checking join: %s\n", buf);

    // Xử lý JSON message từ Bridge
    if (strstr(buf, "\"type\":\"join\"") || strstr(buf, "\"type\": \"join\""))
    {
        char *room = strstr(buf, "\"room\"");
        if (room)
        {
            sscanf(room, "\"room\"%*[^'\"]\"%31[^\"]", room_name);
            printf("[Server] Join room request: %s\n", room_name);
        }
        else
        {
            printf("[Server] Room field not found in JSON!\n");
        }
    }

    if (!room_name[0])
    {
        closesocket(client);
        return 0;
    }

    int room_idx = get_or_create_room(room_name);
    if (room_idx == -1)
    {
        closesocket(client);
        return 0;
    }

    Room *room = &rooms[room_idx];
    char player_color = assign_player(room, client);
    // Gửi màu quân cho player
    printf("[Server] Player assigned color: %s\n", (player_color == 'w') ? "white" : "black");
    // Sau đó gửi trạng thái bàn cờ
    send_initial_state(client, room, player_color);

    while ((n = recv(client, buf, BUF_SIZE - 1, 0)) > 0)
    {
        buf[n] = '\0';
        printf("[Server] Move received: %s\n", buf);

        char from[3] = {0}, to[3] = {0};
        char *p = strstr(buf, "\"move\":\"");
        if (!p)
            continue;
        p += 8;
        strncpy(from, p, 2);
        strncpy(to, p + 2, 2);

        EnterCriticalSection(&cs);
        promotion_move(room, from, to);

        char result = check_game_over(room);
        if (result)
        {
            char msg[128];
            if (result == 'w')
                sprintf(msg, "{\"type\":\"gameOver\",\"winner\":\"white\",\"reason\":\"checkmate\"}");
            else if (result == 'b')
                sprintf(msg, "{\"type\":\"gameOver\",\"winner\":\"black\", \"reason\":\"checkmate\"}");
            else
                sprintf(msg, "{\"type\":\"gameOver\",\"winner\":\"draw\"}");

            broadcast_room(room, msg);
            init_board(room->board, &room->turn);
        }
        else
        {
            char json[4096];
            get_board_json(room, json);
            broadcast_room(room, json);
        }
        LeaveCriticalSection(&cs);
    }

    remove_player(room, client);
    closesocket(client);
    return 0;
}
