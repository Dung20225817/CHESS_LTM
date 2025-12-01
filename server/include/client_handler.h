#ifndef CLIENT_HANDLER_H
#define CLIENT_HANDLER_H

#include <winsock2.h>
#include <process.h>

#define BUF_SIZE 4096

unsigned __stdcall client_thread(void *arg);

#endif
