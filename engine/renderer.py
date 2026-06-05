import pygame
from engine.config import (
    TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, SCREEN_WIDTH, SCREEN_HEIGHT,
    WALL_TILE, FLOOR_TILE, CORRIDOR_TILE, COLORS
)


class Renderer:
    def __init__(self, screen):
        self.screen = screen
        self.camera_x = 0
        self.camera_y = 0

    def update_camera(self, player_x, player_y, player_width, player_height):
        target_x = player_x + player_width / 2 - SCREEN_WIDTH / 2
        target_y = player_y + player_height / 2 - SCREEN_HEIGHT / 2

        self.camera_x += (target_x - self.camera_x) * 0.1
        self.camera_y += (target_y - self.camera_y) * 0.1

        max_cam_x = MAP_WIDTH * TILE_SIZE - SCREEN_WIDTH
        max_cam_y = MAP_HEIGHT * TILE_SIZE - SCREEN_HEIGHT
        self.camera_x = max(0, min(self.camera_x, max_cam_x))
        self.camera_y = max(0, min(self.camera_y, max_cam_y))

    def render_map(self, game_map):
        start_x = max(0, int(self.camera_x // TILE_SIZE))
        start_y = max(0, int(self.camera_y // TILE_SIZE))
        end_x = min(MAP_WIDTH, int((self.camera_x + SCREEN_WIDTH) // TILE_SIZE) + 2)
        end_y = min(MAP_HEIGHT, int((self.camera_y + SCREEN_HEIGHT) // TILE_SIZE) + 2)

        for x in range(start_x, end_x):
            for y in range(start_y, end_y):
                tile_type = game_map[x][y]
                screen_x = x * TILE_SIZE - self.camera_x
                screen_y = y * TILE_SIZE - self.camera_y

                if tile_type == WALL_TILE:
                    color = COLORS['wall']
                elif tile_type == FLOOR_TILE:
                    color = COLORS['floor']
                else:
                    color = COLORS['corridor']

                pygame.draw.rect(
                    self.screen,
                    color,
                    (screen_x, screen_y, TILE_SIZE, TILE_SIZE)
                )
                pygame.draw.rect(
                    self.screen,
                    (30, 30, 40),
                    (screen_x, screen_y, TILE_SIZE, TILE_SIZE),
                    1
                )

    def render_entities(self, entities):
        for entity in entities:
            if entity.alive:
                entity.render(self.screen, self.camera_x, self.camera_y)

    def render_ui(self, player):
        pygame.draw.rect(self.screen, COLORS['ui_bg'], (0, 0, SCREEN_WIDTH, 60))

        font = pygame.font.Font(None, 28)

        health_text = font.render(f'HP: {player.health}/{player.max_health}', True, COLORS['ui_text'])
        self.screen.blit(health_text, (20, 15))

        gold_text = font.render(f'Gold: {player.gold}', True, COLORS['ui_text'])
        self.screen.blit(gold_text, (200, 15))

        controls_text = font.render('WASD/Arrows: Move | Space: Attack | E: Open Chest | R: New Dungeon', True, COLORS['ui_text'])
        self.screen.blit(controls_text, (350, 15))

    def render_game_over(self):
        font = pygame.font.Font(None, 72)
        text = font.render('GAME OVER', True, (255, 50, 50))
        text_rect = text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 30))
        self.screen.blit(text, text_rect)

        small_font = pygame.font.Font(None, 36)
        restart_text = small_font.render('Press R to restart or ESC to quit', True, COLORS['ui_text'])
        restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 30))
        self.screen.blit(restart_text, restart_rect)
