import math


class MCTSNode:
    def __init__(self, state, parent=None, move=None):
        self.state = state
        self.parent = parent
        self.move = move
        self.children = []
        self.visits = 0
        self.wins = 0
        self.untried_moves = None

    def is_fully_expanded(self):
        return self.untried_moves is not None and len(self.untried_moves) == 0

    def is_terminal(self):
        return self.state.is_game_over()

    def add_child(self, child_node):
        self.children.append(child_node)

    def update(self, result):
        self.visits += 1
        self.wins += result

    def ucb_value(self, exploration_param=math.sqrt(2)):
        if self.visits == 0:
            return float('inf')
        return (self.wins / self.visits) + exploration_param * math.sqrt(
            2 * math.log(self.parent.visits) / self.visits
        )

    def best_child(self, exploration_param=math.sqrt(2)):
        return max(self.children, key=lambda c: c.ucb_value(exploration_param))

    def most_visited_child(self):
        return max(self.children, key=lambda c: c.visits)
