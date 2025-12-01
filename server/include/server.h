#ifndef SERVER_H
#define SERVER_H

#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>

extern SOCKET server_socket;
extern CRITICAL_SECTION cs;

void init_server(int port);
void run_server();
void cleanup_server();

#endif
