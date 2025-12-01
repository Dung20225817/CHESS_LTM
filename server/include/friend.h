#ifndef FRIEND_H
#define FRIEND_H

#define FRIEND_FILE "friend.txt"
#define ACCOUNT_FILE "account.txt"

typedef struct Friend {
    char username[32];
} Friend;

// Lấy username từ user_id
int get_username_from_id(int user_id, char *username);

// Lấy danh sách bạn bè của user_id
int get_friends(int user_id, Friend *friends, int max_size);

// Thêm bạn mới từ JSON {"friend_a":"alice","friend_b":"bob"}
void make_friend(const char *json);

#endif // FRIEND_H
