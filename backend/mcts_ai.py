import random
import math
from mcts_node import MCTSNode
from othello_game import OthelloGame


class MCTS:
    def __init__(self, iterations=1000, exploration_param=math.sqrt(2)):
        self.iterations = iterations
        self.exploration_param = exploration_param

    def select(self, node):
        while node.is_fully_expanded() and not node.is_terminal():
            node = node.best_child(self.exploration_param)
        return node

    def expand(self, node):
        if node.is_terminal():
            return node

        if node.untried_moves is None:
            node.untried_moves = node.state.get_valid_moves()
            random.shuffle(node.untried_moves)

        if len(node.untried_moves) == 0:
            return node

        move = node.untried_moves.pop()
        new_state = node.state.clone()
        new_state.make_move(move[0], move[1])

        child_node = MCTSNode(new_state, parent=node, move=move)
        node.add_child(child_node)

        return child_node

    def simulate(self, state):
        sim_state = state.clone()

        while not sim_state.is_game_over():
            valid_moves = sim_state.get_valid_moves()
            if not valid_moves:
                break
            move = random.choice(valid_moves)
            sim_state.make_move(move[0], move[1])

        winner = sim_state.get_winner()
        return winner

    def backpropagate(self, node, result):
        while node is not None:
            current_player = node.state.get_current_player()
            opponent = OthelloGame.WHITE if current_player == OthelloGame.BLACK else OthelloGame.BLACK

            if result == opponent:
                node.update(1)
            elif result == 0:
                node.update(0.5)
            else:
                node.update(0)

            node = node.parent

    def get_best_move(self, game_state):
        root = MCTSNode(game_state.clone())

        valid_moves = game_state.get_valid_moves()
        if not valid_moves:
            return None, 0, 0

        for _ in range(self.iterations):
            selected_node = self.select(root)
            expanded_node = self.expand(selected_node)
            result = self.simulate(expanded_node.state)
            self.backpropagate(expanded_node, result)

        if not root.children:
            return random.choice(valid_moves), 0, len(valid_moves)

        best_child = root.most_visited_child()
        return best_child.move, root.visits, len(root.children)
