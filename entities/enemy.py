import random
import math
from entities.base_entity import BaseEntity
from entities.state_machine import State, StateMachine
from engine.config import COLORS, ENEMY_SPEED, TILE_SIZE


class EnemyIdleState(State):
    def __init__(self):
        super().__init__('idle')
        self.wait_time = 0

    def enter(self, entity):
        self.wait_time = random.randint(30, 90)

    def update(self, entity, collision_system, entities):
        self.wait_time -= 1
        if self.wait_time <= 0:
            entity.state_machine.change_state(entity, EnemyPatrolState())

        player = entity.find_player(entities)
        if player:
            entity.state_machine.change_state(entity, EnemyChaseState(player))


class EnemyPatrolState(State):
    def __init__(self):
        super().__init__('patrol')
        self.target_x = 0
        self.target_y = 0
        self.move_time = 0

    def enter(self, entity):
        angle = random.uniform(0, math.pi * 2)
        self.target_x = entity.x + math.cos(angle) * TILE_SIZE * 3
        self.target_y = entity.y + math.sin(angle) * TILE_SIZE * 3
        self.move_time = 60

    def update(self, entity, collision_system, entities):
        self.move_time -= 1
        dx = self.target_x - entity.x
        dy = self.target_y - entity.y
        dist = math.sqrt(dx * dx + dy * dy)

        if dist > 1 and self.move_time > 0:
            vx = (dx / dist) * ENEMY_SPEED * 0.5
            vy = (dy / dist) * ENEMY_SPEED * 0.5
            entity.move_with_collision(vx, vy, collision_system)
        else:
            entity.state_machine.change_state(entity, EnemyIdleState())

        player = entity.find_player(entities)
        if player:
            entity.state_machine.change_state(entity, EnemyChaseState(player))


class EnemyChaseState(State):
    def __init__(self, player):
        super().__init__('chase')
        self.player = player
        self.attack_cooldown = 0

    def update(self, entity, collision_system, entities):
        if not self.player.alive:
            entity.state_machine.change_state(entity, EnemyIdleState())
            return

        dx = self.player.x - entity.x
        dy = self.player.y - entity.y
        dist = math.sqrt(dx * dx + dy * dy)

        if dist < TILE_SIZE * 1.2:
            if self.attack_cooldown <= 0:
                self.player.take_damage(10)
                self.attack_cooldown = 60
            else:
                self.attack_cooldown -= 1
        elif dist < TILE_SIZE * 8:
            vx = (dx / dist) * ENEMY_SPEED
            vy = (dy / dist) * ENEMY_SPEED
            entity.move_with_collision(vx, vy, collision_system)
        else:
            entity.state_machine.change_state(entity, EnemyIdleState())


class Enemy(BaseEntity):
    def __init__(self, x, y):
        super().__init__(x, y, 24, 24, COLORS['enemy'])
        self.max_health = 30
        self.health = self.max_health
        self.damage = 10
        self.state_machine = StateMachine(EnemyIdleState())
        self.gold_reward = random.randint(5, 20)

    def update(self, collision_system, entities):
        self.state_machine.update(self, collision_system, entities)

    def move_with_collision(self, vx, vy, collision_system):
        new_x = self.x + vx
        if not collision_system.check_wall_collision(new_x, self.y, self.width, self.height):
            self.x = new_x

        new_y = self.y + vy
        if not collision_system.check_wall_collision(self.x, new_y, self.width, self.height):
            self.y = new_y

    def find_player(self, entities):
        from entities.player import Player
        for entity in entities:
            if isinstance(entity, Player) and entity.alive:
                dx = entity.x - self.x
                dy = entity.y - self.y
                dist = math.sqrt(dx * dx + dy * dy)
                if dist < TILE_SIZE * 8:
                    return entity
        return None

    def take_damage(self, amount):
        self.health -= amount
        if self.health <= 0:
            self.alive = False
