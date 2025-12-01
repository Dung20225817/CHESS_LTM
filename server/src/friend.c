#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define FRIEND_FILE "friend.txt"
#define ACCOUNT_FILE "account.txt" 

typedef struct Friend {
    char username[32];
} Friend;

// Lấy username từ user_id
int get_username_from_id(int user_id, char *username) {
    FILE *fp = fopen(ACCOUNT_FILE, "r");
    if (!fp) return 0;

    int id;
    char name[32], pass[32];
    while (fscanf(fp, "%d %31s %31s", &id, name, pass) == 3) {
        if (id == user_id) {
            strncpy(username, name, 32);
            username[31] = '\0';
            fclose(fp);
            return 1;
        }
    }

    fclose(fp);
    return 0;
}

// Lấy danh sách bạn bè của user_id
int get_friends(int user_id, Friend *friends, int max_size) {
    FILE *fp = fopen(FRIEND_FILE, "r");
    if (!fp) {
        printf("Cannot open friend.txt\n");
        return 0;
    }

    int count = 0;
    int stt, a_id, b_id;
    while (fscanf(fp, "%d %d %d", &stt, &a_id, &b_id) == 3) {
        if (a_id == user_id || b_id == user_id) {
            int friend_id = (a_id == user_id) ? b_id : a_id;
            char username[32];
            if (get_username_from_id(friend_id, username)) {
                if (count < max_size) {
                    strncpy(friends[count].username, username, 32);
                    friends[count].username[31] = '\0';
                    count++;
                }
            }
        }
    }

    fclose(fp);
    return count;
}

void make_friend(const char *json)
{
    char friendA[32], friendB[32];

    // 1. Tách friend_a
    char *p1 = strstr(json, "\"friend_a\"");
    if (!p1) return;
    p1 = strchr(p1, ':');
    p1++;
    while (*p1 == ' ' || *p1 == '\"') p1++;
    char *endA = strchr(p1, '\"');
    strncpy(friendA, p1, endA - p1);
    friendA[endA - p1] = '\0';

    // 2. Tách friend_b
    char *p2 = strstr(json, "\"friend_b\"");
    if (!p2) return;
    p2 = strchr(p2, ':');
    p2++;
    while (*p2 == ' ' || *p2 == '\"') p2++;
    char *endB = strchr(p2, '\"');
    strncpy(friendB, p2, endB - p2);
    friendB[endB - p2] = '\0';

    // 3. Tìm số thứ tự (đếm số dòng)
    FILE *fp = fopen(FRIEND_FILE, "a+");
    if (!fp) {
        printf("Cannot open friend.txt\n");
        return;
    }

    int stt = 1;
    char tmp[256];
    rewind(fp);
    while (fgets(tmp, sizeof(tmp), fp)) {
        stt++;
    }

    // 4. Ghi dữ liệu vào file
    fprintf(fp, "%d %s %s\n", stt, friendA, friendB);
    fclose(fp);

    printf("Saved: %d %s %s\n", stt, friendA, friendB);
}
