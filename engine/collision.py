from engine.config import TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, WALL_TILE


class CollisionSystem:
    def __init__(self, game_map):
        self.game_map = game_map

    def check_wall_collision(self, x, y, width, height):
        tile_x1 = int(x // TILE_SIZE)
        tile_y1 = int(y // TILE_SIZE)
        tile_x2 = int((x + width - 1) // TILE_SIZE)
        tile_y2 = int((y + height - 1) // TILE_SIZE)

        for tx in range(tile_x1, tile_x2 + 1):
            for ty in range(tile_y1, tile_y2 + 1):
                if tx < 0 or ty < 0 or tx >= MAP_WIDTH or ty >= MAP_HEIGHT:
                    return True
                if self.game_map[tx][ty] == WALL_TILE:
                    return True
        return False

    def check_entity_collision(self, entity1, entity2):
        return (entity1.x < entity2.x + entity2.width and
                entity1.x + entity1.width > entity2.x and
                entity1.y < entity2.y + entity2.height and
                entity1.y + entity1.height > entity2.y)

    def get_nearby_entities(self, entity, entities, radius):
        nearby = []
        for other in entities:
            if other != entity:
                dx = (entity.x + entity.width / 2) - (other.x + other.width / 2)
                dy = (entity.y + entity.height / 2) - (other.y + other.height / 2)
                distance = (dx ** 2 + dy ** 2) ** 0.5
                if distance <= radius:
                    nearby.append(other)
        return nearby
