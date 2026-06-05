import pygame
from entities.base_entity import BaseEntity
from engine.config import COLORS, PLAYER_SPEED, TILE_SIZE


class Player(BaseEntity):
    def __init__(self, x, y):
        super().__init__(x, y, 24, 24, COLORS['player'])
        self.max_health = 100
        self.health = self.max_health
        self.gold = 0
        self.keys = pygame.key.get_pressed()

    def handle_input(self, keys):
        self.vx = 0
        self.vy = 0

        if keys[pygame.K_w] or keys[pygame.K_UP]:
            self.vy = -PLAYER_SPEED
        if keys[pygame.K_s] or keys[pygame.K_DOWN]:
            self.vy = PLAYER_SPEED
        if keys[pygame.K_a] or keys[pygame.K_LEFT]:
            self.vx = -PLAYER_SPEED
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            self.vx = PLAYER_SPEED

        if self.vx != 0 and self.vy != 0:
            self.vx *= 0.707
            self.vy *= 0.707

    def update(self, collision_system, entities):
        new_x = self.x + self.vx
        if not collision_system.check_wall_collision(new_x, self.y, self.width, self.height):
            self.x = new_x

        new_y = self.y + self.vy
        if not collision_system.check_wall_collision(self.x, new_y, self.width, self.height):
            self.y = new_y

    def take_damage(self, amount):
        self.health -= amount
        if self.health <= 0:
            self.health = 0
            self.alive = False

    def add_gold(self, amount):
        self.gold += amount

    def get_tile_position(self):
        return (int((self.x + self.width / 2) // TILE_SIZE),
                int((self.y + self.height / 2) // TILE_SIZE))
