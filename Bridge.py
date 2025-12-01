# Bridge.py — version: one TCP per player
import asyncio
import json
import websockets
from typing import Dict
import ssl

C_HOST = "127.0.0.1"
C_PORT = 6000

player_tcp: Dict[websockets.WebSocketServerProtocol, asyncio.StreamWriter] = {}
player_task: Dict[websockets.WebSocketServerProtocol, asyncio.Task] = {}
rooms: Dict[str, list] = {}  # room_id -> list of websockets


async def handle_tcp_to_browser(ws, reader):
    """Liên tục đọc từ TCP và chuyển về browser"""
    try:
        while True:
            line = await reader.readline()
            if not line:
                print(f"[Bridge] TCP closed by C server ({ws.remote_address})")
                break
            msg = line.decode().strip()
            if msg:
                print(f"[Bridge <- C][{ws.remote_address}] {msg}")
                # Thêm thông báo nếu là assignColor
                try:
                    data = json.loads(msg)
                    if data.get("type") == "assignColor":
                        # Tạo thông báo rõ ràng cho FE
                        notify = json.dumps({
                            "type": "info",
                            "msg": f"Bạn được gán màu {data.get('color')}"
                        })
                        await ws.send(notify)
                        print(f"[Bridge -> FE] Sent color info: {notify}")
                except Exception:
                    pass
                await ws.send(msg)
    except asyncio.CancelledError:
        print(f"[Bridge] TCP reader cancelled for {ws.remote_address}")
    except Exception as e:
        print(f"[Bridge][ERROR] TCP reader error for {ws.remote_address}: {e}")
    finally:
        if ws in player_tcp:
            del player_tcp[ws]
        if ws in player_task:
            del player_task[ws]


async def handler(ws):
    room_id = None
    try:
        async for raw in ws:
            print(f"[Bridge <- Browser] {raw}")
            try:
                data = json.loads(raw)
            except Exception:
                await ws.send(json.dumps({"type": "error", "msg": "invalid json"}))
                continue

            msg_type = data.get("type")

            # --- LOGIN/REGISTER ---
            if msg_type in ["LOGIN", "REGISTER"]:
                username = data.get("username")
                password = data.get("password")

                if not username or not password:
                    await ws.send(json.dumps({"type": "error", "msg": "missing username/password"}))
                    continue

                # tạo TCP tới C server
                try:
                    reader, writer = await asyncio.open_connection(C_HOST, C_PORT)
                except Exception as e:
                    print(f"[Bridge][ERROR] Cannot connect to C server for {msg_type}: {e}")
                    await ws.send(json.dumps({"type": "error", "msg": "C server offline"}))
                    continue

                # gửi yêu cầu tới C server
                auth_msg = json.dumps({"type": msg_type, "username": username, "password": password})
                writer.write((auth_msg + "\n").encode())
                await writer.drain()
                print(f"[Bridge -> C] {auth_msg}")

                # chờ phản hồi từ C server
                try:
                    line = await asyncio.wait_for(reader.readline(), timeout=3)
                    if not line:
                        raise Exception("no response")
                    msg = line.decode().strip()
                    print(f"[Bridge <- C] {msg}")
                    await ws.send(msg)
                except Exception as e:
                    print(f"[Bridge][ERROR] {msg_type} timeout or failed: {e}")
                    await ws.send(json.dumps({"type": msg_type, "success": False}))
                finally:
                    writer.close()
                    await writer.wait_closed()
                continue
            
            # --- GET_FRIENDS ---
            if msg_type == "GET_FRIENDS":
                user_id = data.get("user_id")
                if not user_id:
                    await ws.send(json.dumps({"type": "error", "msg": "missing user_id"}))
                    continue

                # Gửi tới C server để lấy danh sách bạn bè (theo cách bạn làm TCP)
                try:
                    reader, writer = await asyncio.open_connection(C_HOST, C_PORT)
                except Exception as e:
                    await ws.send(json.dumps({"type": "error", "msg": "C server offline"}))
                    continue

                msg_to_c = json.dumps({"type": "GET_FRIENDS", "user_id": user_id})
                writer.write((msg_to_c + "\n").encode())
                await writer.drain()
                print(f"[Bridge -> C] {msg_to_c}")

                # chờ phản hồi
                try:
                    line = await asyncio.wait_for(reader.readline(), timeout=3)
                    if not line:
                        raise Exception("no response")
                    msg = line.decode().strip()
                    print(f"[Bridge <- C] {msg}")
                    await ws.send(msg)  # gửi về browser
                except Exception as e:
                    print(f"[Bridge][ERROR] GET_FRIENDS failed: {e}")
                    await ws.send(json.dumps({"type": "GET_FRIENDS", "friends": []}))
                finally:
                    writer.close()
                    await writer.wait_closed()
                continue




            # --- JOIN ---
            if msg_type == "join":
                room_id = str(data.get("room"))
                if not room_id:
                    await ws.send(json.dumps({"type": "error", "msg": "missing room"}))
                    continue

                rooms.setdefault(room_id, [])
                if len(rooms[room_id]) >= 2:
                    await ws.send(json.dumps({"type": "error", "msg": "Room full"}))
                    print(f"[Bridge][WARN] Room {room_id} full -> rejected")
                    continue

                # Tạo TCP riêng cho người chơi
                try:
                    reader, writer = await asyncio.open_connection(C_HOST, C_PORT)
                except Exception as e:
                    print(f"[Bridge][ERROR] Cannot connect to C server: {e}")
                    await ws.send(json.dumps({"type": "error", "msg": "C server offline"}))
                    continue

                player_tcp[ws] = writer
                rooms[room_id].append(ws)
                print(f"[JOIN] {ws.remote_address} joined room {room_id} (total={len(rooms[room_id])})")
                

                # Gửi JOIN tới C server
                join_msg = json.dumps({"type": "join", "room": room_id})
                writer.write((join_msg + "\n").encode())
                await writer.drain()
                print(f"[Bridge -> C][{ws.remote_address}] {join_msg}")

                # Bắt đầu đọc từ TCP gửi về browser
                player_task[ws] = asyncio.create_task(handle_tcp_to_browser(ws, reader))
                continue

            # --- MOVE ---
            if msg_type == "move":
                writer = player_tcp.get(ws)
                if not writer:
                    await ws.send(json.dumps({"type": "error", "msg": "not joined"}))
                    continue
                try:
                    writer.write((raw + "\n").encode())
                    await writer.drain()
                    print(f"[Bridge -> C][{ws.remote_address}] {raw}")
                except Exception as e:
                    print(f"[Bridge][ERROR] send move failed: {e}")
                    await ws.send(json.dumps({"type": "error", "msg": "send failed"}))
                continue

            await ws.send(json.dumps({"type": "error", "msg": "unknown message type"}))

    except websockets.exceptions.ConnectionClosed:
        print(f"[Bridge] Browser {ws.remote_address} disconnected")
    finally:
        # cleanup
        if ws in player_tcp:
            writer = player_tcp.pop(ws)
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass
        if ws in player_task:
            player_task[ws].cancel()
        if room_id and room_id in rooms and ws in rooms[room_id]:
            rooms[room_id].remove(ws)
            print(f"[DISCONNECT] {ws.remote_address} left room {room_id}")
            if not rooms[room_id]:
                del rooms[room_id]
                print(f"[Bridge] Room {room_id} deleted")


async def main():
    print("Bridge WebSocket running wss://0.0.0.0:8765")
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Bridge stopped")
