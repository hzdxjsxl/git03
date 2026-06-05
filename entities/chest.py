import random
from entities.base_entity import BaseEntity
from engine.config import COLORS


class Chest(BaseEntity):
    def __init__(self, x, y):
        super().__init__(x, y, 24, 24, COLORS['chest'])
        self.is_open = False
        self.gold_amount = random.randint(10, 50)

    def open(self, player):
        if not self.is_open:
            self.is_open = True
            self.color = COLORS['chest_open']
            player.add_gold(self.gold_amount)
            return self.gold_amount
        return 0

    def update(self, collision_system, entities):
        pass
