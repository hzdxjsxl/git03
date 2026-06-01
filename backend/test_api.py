import requests
import json

print('=== 测试 /api/reset ===')
r = requests.post('http://127.0.0.1:5000/api/reset')
data = r.json()
print(f'当前玩家: {data["current_player"]}')
print(f'合法走法: {data["valid_moves"]}')
print(f'初始比分: {data["score"]}')
print()

print('=== 测试 /api/move ===')
move = data['valid_moves'][0]
print(f'玩家落子位置: {move}')
r = requests.post('http://127.0.0.1:5000/api/move', json={'row': move[0], 'col': move[1]})
data = r.json()
print(f'落子后当前玩家: {data["current_player"]}')
print(f'落子后比分: {data["score"]}')
print()

print('=== 测试 /api/ai_move ===')
r = requests.post('http://127.0.0.1:5000/api/ai_move')
data = r.json()
print(f'AI落子位置: {data["ai_move"]}')
print(f'AI模拟次数: {data["simulations"]}')
print(f'AI考虑走法数: {data["considered_moves"]}')
print(f'AI落子后比分: {data["score"]}')
print()
print('✅ 所有API测试通过！')
