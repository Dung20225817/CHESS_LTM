CC = gcc
CFLAGS = -Iinclude -Wall -O2
SRC = src/main.c src/server.c src/client_handler.c src/room.c src/board.c src/utils.c src/auth.c src/friend.c
OUT = c_server.exe

all:
	$(CC) $(SRC) $(CFLAGS) -o $(OUT) -lws2_32

clean:
	del /Q $(OUT)
