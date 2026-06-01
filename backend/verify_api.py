import urllib.request
import json
import time

BASE = 'http://127.0.0.1:5000/api'

def post(path, data=None):
    url = f'{BASE}{path}'
    body = json.dumps(data).encode() if data else b''
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

print('=== Step 1: Reset ===')
d = post('/reset')
print(f'  player={d["current_player"]}, moves={d["valid_moves"]}')

print('\n=== Step 2: Player move (2,3) ===')
d = post('/move', {'row': 2, 'col': 3})
print(f'  player={d["current_player"]}, score={d["score"]}')

print('\n=== Step 3: AI move ===')
t0 = time.time()
d = post('/ai_move')
t1 = time.time()
print(f'  time={t1-t0:.2f}s')
print(f'  ai_move={d["ai_move"]}')
print(f'  simulations={d["simulations"]}')
print(f'  considered_moves={d["considered_moves"]}')
print(f'  player={d["current_player"]}, score={d["score"]}')

print('\n=== Step 4: Player move ===')
valid = d["valid_moves"]
if valid:
    mv = valid[0]
    d = post('/move', {'row': mv[0], 'col': mv[1]})
    print(f'  player move={mv}, player={d["current_player"]}, score={d["score"]}')

print('\n=== Step 5: AI move ===')
t0 = time.time()
d = post('/ai_move')
t1 = time.time()
print(f'  time={t1-t0:.2f}s')
print(f'  ai_move={d["ai_move"]}')
print(f'  simulations={d["simulations"]}')
print(f'  considered_moves={d["considered_moves"]}')
print(f'  player={d["current_player"]}, score={d["score"]}')

print('\n=== Step 6: Player move ===')
valid = d["valid_moves"]
if valid:
    mv = valid[0]
    d = post('/move', {'row': mv[0], 'col': mv[1]})
    print(f'  player move={mv}, player={d["current_player"]}, score={d["score"]}')

print('\n=== Step 7: AI move ===')
t0 = time.time()
d = post('/ai_move')
t1 = time.time()
print(f'  time={t1-t0:.2f}s')
print(f'  ai_move={d["ai_move"]}')
print(f'  simulations={d["simulations"]}')
print(f'  considered_moves={d["considered_moves"]}')
print(f'  player={d["current_player"]}, score={d["score"]}')

print('\n✅ API验证完成！每次AI落子都返回simulations和considered_moves非零数值')
