import pygame
from engine.config import TILE_SIZE


class BaseEntity:
    def __init__(self, x, y, width, height, color):
        self.x = x * TILE_SIZE
        self.y = y * TILE_SIZE
        self.width = width
        self.height = height
        self.color = color
        self.alive = True
        self.vx = 0
        self.vy = 0

    def update(self, collision_system, entities):
        pass

    def render(self, surface, camera_x, camera_y):
        rect = pygame.Rect(
            int(self.x - camera_x),
            int(self.y - camera_y),
            self.width,
            self.height
        )
        pygame.draw.rect(surface, self.color, rect)
        pygame.draw.rect(surface, (0, 0, 0), rect, 1)

    def get_rect(self):
        return pygame.Rect(self.x, self.y, self.width, self.height)
