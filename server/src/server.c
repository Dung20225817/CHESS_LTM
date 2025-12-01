#include "server.h"
#include "client_handler.h"
#include <stdio.h>
#include <stdlib.h>

SOCKET server_socket;
CRITICAL_SECTION cs;

void init_server(int port) {
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        printf("WSAStartup failed\n");
        exit(1);
    }
    InitializeCriticalSection(&cs);

    server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket == INVALID_SOCKET) {
        printf("Socket creation failed\n");
        exit(1);
    }

    BOOL reuse = TRUE;
    setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, (const char *)&reuse, sizeof(reuse));

    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port);

    if (bind(server_socket, (struct sockaddr *)&addr, sizeof(addr)) == SOCKET_ERROR) {
        printf("Bind failed\n");
        exit(1);
    }

    listen(server_socket, SOMAXCONN);
    printf("[SERVER] Running on port %d...\n", port);
}

void run_server() {
    while (1) {
        SOCKET client = accept(server_socket, NULL, NULL);
        if (client == INVALID_SOCKET)
            continue;

        SOCKET *pclient = malloc(sizeof(SOCKET));
        *pclient = client;
        _beginthreadex(NULL, 0, client_thread, (void *)pclient, 0, NULL);
    }
}

void cleanup_server() {
    closesocket(server_socket);
    DeleteCriticalSection(&cs);
    WSACleanup();
}
