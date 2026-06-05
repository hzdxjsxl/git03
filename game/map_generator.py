import random
from engine.config import (
    MAP_WIDTH, MAP_HEIGHT, WALL_TILE, FLOOR_TILE, CORRIDOR_TILE,
    ROOM_MIN_SIZE, ROOM_MAX_SIZE, MAX_ROOMS, MAX_ENEMIES_PER_ROOM, MAX_CHESTS_PER_ROOM
)


class Room:
    def __init__(self, x, y, w, h):
        self.x1 = x
        self.y1 = y
        self.x2 = x + w
        self.y2 = y + h
        self.center_x = (self.x1 + self.x2) // 2
        self.center_y = (self.y1 + self.y2) // 2

    def intersect(self, other):
        return (self.x1 <= other.x2 and self.x2 >= other.x1 and
                self.y1 <= other.y2 and self.y2 >= other.y1)


class DungeonGenerator:
    def __init__(self):
        self.rooms = []
        self.map = []
        self.enemy_spawns = []
        self.chest_spawns = []

    def generate(self):
        self._init_map()
        self._generate_rooms()
        self._connect_rooms()
        self._place_entities()
        return self.map, self.rooms, self.enemy_spawns, self.chest_spawns

    def _init_map(self):
        self.map = [[WALL_TILE for _ in range(MAP_HEIGHT)] for _ in range(MAP_WIDTH)]

    def _generate_rooms(self):
        for _ in range(MAX_ROOMS * 3):
            if len(self.rooms) >= MAX_ROOMS:
                break

            w = random.randint(ROOM_MIN_SIZE, ROOM_MAX_SIZE)
            h = random.randint(ROOM_MIN_SIZE, ROOM_MAX_SIZE)
            x = random.randint(1, MAP_WIDTH - w - 1)
            y = random.randint(1, MAP_HEIGHT - h - 1)

            new_room = Room(x, y, w, h)
            if not any(new_room.intersect(room) for room in self.rooms):
                self._carve_room(new_room)
                self.rooms.append(new_room)

    def _carve_room(self, room):
        for x in range(room.x1, room.x2):
            for y in range(room.y1, room.y2):
                self.map[x][y] = FLOOR_TILE

    def _connect_rooms(self):
        for i in range(1, len(self.rooms)):
            prev = self.rooms[i - 1]
            curr = self.rooms[i]

            if random.random() < 0.5:
                self._carve_h_corridor(prev.center_x, curr.center_x, prev.center_y)
                self._carve_v_corridor(prev.center_y, curr.center_y, curr.center_x)
            else:
                self._carve_v_corridor(prev.center_y, curr.center_y, prev.center_x)
                self._carve_h_corridor(prev.center_x, curr.center_x, curr.center_y)

    def _carve_h_corridor(self, x1, x2, y):
        for x in range(min(x1, x2), max(x1, x2) + 1):
            if 0 <= x < MAP_WIDTH and 0 <= y < MAP_HEIGHT:
                self.map[x][y] = CORRIDOR_TILE

    def _carve_v_corridor(self, y1, y2, x):
        for y in range(min(y1, y2), max(y1, y2) + 1):
            if 0 <= x < MAP_WIDTH and 0 <= y < MAP_HEIGHT:
                self.map[x][y] = CORRIDOR_TILE

    def _place_entities(self):
        for room in self.rooms[1:]:
            num_enemies = random.randint(0, MAX_ENEMIES_PER_ROOM)
            for _ in range(num_enemies):
                x = random.randint(room.x1 + 1, room.x2 - 2)
                y = random.randint(room.y1 + 1, room.y2 - 2)
                self.enemy_spawns.append((x, y))

            if random.random() < 0.5:
                num_chests = random.randint(0, MAX_CHESTS_PER_ROOM)
                for _ in range(num_chests):
                    x = random.randint(room.x1 + 1, room.x2 - 2)
                    y = random.randint(room.y1 + 1, room.y2 - 2)
                    self.chest_spawns.append((x, y))
