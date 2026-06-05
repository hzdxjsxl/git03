import pygame
from engine.config import SCREEN_WIDTH, SCREEN_HEIGHT, FPS, TILE_SIZE
from engine.renderer import Renderer
from engine.collision import CollisionSystem
from game.map_generator import DungeonGenerator
from entities.player import Player
from entities.enemy import Enemy
from entities.chest import Chest


class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption('Pixel Dungeon Explorer')
        self.clock = pygame.time.Clock()
        self.renderer = Renderer(self.screen)
        self.running = True
        self.game_over = False
        self.attack_cooldown = 0
        self.init_new_game()

    def init_new_game(self):
        generator = DungeonGenerator()
        self.game_map, self.rooms, enemy_spawns, chest_spawns = generator.generate()
        self.collision_system = CollisionSystem(self.game_map)

        start_room = self.rooms[0]
        spawn_x = start_room.center_x
        spawn_y = start_room.center_y
        
        self.player = Player(spawn_x, spawn_y)
        
        offset = (TILE_SIZE - self.player.width) // 2
        self.player.x += offset
        self.player.y += offset

        self.entities = [self.player]

        for x, y in enemy_spawns:
            enemy = Enemy(x, y)
            enemy.x += offset
            enemy.y += offset
            self.entities.append(enemy)

        for x, y in chest_spawns:
            chest = Chest(x, y)
            chest.x += offset
            chest.y += offset
            self.entities.append(chest)

        self.game_over = False

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
                if event.key == pygame.K_r:
                    self.init_new_game()
                if event.key == pygame.K_SPACE and not self.game_over:
                    self.player_attack()
                if event.key == pygame.K_e and not self.game_over:
                    self.open_chest()

        if not self.game_over:
            keys = pygame.key.get_pressed()
            self.player.handle_input(keys)

    def player_attack(self):
        if self.attack_cooldown > 0:
            return

        self.attack_cooldown = 20
        attack_range = TILE_SIZE * 1.5

        for entity in self.entities:
            if isinstance(entity, Enemy) and entity.alive:
                dx = (self.player.x + self.player.width / 2) - (entity.x + entity.width / 2)
                dy = (self.player.y + self.player.height / 2) - (entity.y + entity.height / 2)
                distance = (dx ** 2 + dy ** 2) ** 0.5

                if distance <= attack_range:
                    entity.take_damage(20)
                    if not entity.alive:
                        self.player.add_gold(entity.gold_reward)

    def open_chest(self):
        interact_range = TILE_SIZE * 1.5

        for entity in self.entities:
            if isinstance(entity, Chest) and not entity.is_open:
                dx = (self.player.x + self.player.width / 2) - (entity.x + entity.width / 2)
                dy = (self.player.y + self.player.height / 2) - (entity.y + entity.height / 2)
                distance = (dx ** 2 + dy ** 2) ** 0.5

                if distance <= interact_range:
                    entity.open(self.player)
                    break

    def update(self):
        if self.game_over:
            return

        if self.attack_cooldown > 0:
            self.attack_cooldown -= 1

        for entity in self.entities:
            if entity.alive:
                entity.update(self.collision_system, self.entities)

        if not self.player.alive:
            self.game_over = True

    def render(self):
        self.screen.fill((20, 20, 30))

        if not self.game_over:
            self.renderer.update_camera(
                self.player.x, self.player.y,
                self.player.width, self.player.height
            )

        self.renderer.render_map(self.game_map)
        self.renderer.render_entities(self.entities)
        self.renderer.render_ui(self.player)

        if self.game_over:
            self.renderer.render_game_over()

        pygame.display.flip()

    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.render()
            self.clock.tick(FPS)

        pygame.quit()
