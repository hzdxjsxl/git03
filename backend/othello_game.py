class OthelloGame:
    EMPTY = 0
    BLACK = 1
    WHITE = 2
    BOARD_SIZE = 8

    def __init__(self):
        self.board = None
        self.current_player = None
        self.reset()

    def reset(self):
        self.board = [[self.EMPTY for _ in range(self.BOARD_SIZE)] for _ in range(self.BOARD_SIZE)]
        mid = self.BOARD_SIZE // 2
        self.board[mid - 1][mid - 1] = self.WHITE
        self.board[mid][mid] = self.WHITE
        self.board[mid - 1][mid] = self.BLACK
        self.board[mid][mid - 1] = self.BLACK
        self.current_player = self.BLACK

    def get_board(self):
        return [row[:] for row in self.board]

    def set_board(self, board, current_player):
        self.board = [row[:] for row in board]
        self.current_player = current_player

    def get_current_player(self):
        return self.current_player

    def _opponent(self, player):
        return self.WHITE if player == self.BLACK else self.BLACK

    def _is_valid_position(self, row, col):
        return 0 <= row < self.BOARD_SIZE and 0 <= col < self.BOARD_SIZE

    def _get_flips(self, row, col, player):
        if not self._is_valid_position(row, col) or self.board[row][col] != self.EMPTY:
            return []

        opponent = self._opponent(player)
        directions = [(-1, -1), (-1, 0), (-1, 1),
                      (0, -1),          (0, 1),
                      (1, -1),  (1, 0), (1, 1)]

        all_flips = []

        for dr, dc in directions:
            flips = []
            r, c = row + dr, col + dc
            while self._is_valid_position(r, c) and self.board[r][c] == opponent:
                flips.append((r, c))
                r += dr
                c += dc
            if flips and self._is_valid_position(r, c) and self.board[r][c] == player:
                all_flips.extend(flips)

        return all_flips

    def is_valid_move(self, row, col, player=None):
        if player is None:
            player = self.current_player
        return len(self._get_flips(row, col, player)) > 0

    def get_valid_moves(self, player=None):
        if player is None:
            player = self.current_player
        moves = []
        for row in range(self.BOARD_SIZE):
            for col in range(self.BOARD_SIZE):
                if self.is_valid_move(row, col, player):
                    moves.append((row, col))
        return moves

    def make_move(self, row, col, player=None):
        if player is None:
            player = self.current_player

        flips = self._get_flips(row, col, player)
        if not flips:
            return False

        self.board[row][col] = player
        for r, c in flips:
            self.board[r][c] = player

        self.current_player = self._opponent(player)

        if not self.get_valid_moves(self.current_player):
            self.current_player = self._opponent(self.current_player)

        return True

    def get_score(self):
        black_count = sum(row.count(self.BLACK) for row in self.board)
        white_count = sum(row.count(self.WHITE) for row in self.board)
        return {self.BLACK: black_count, self.WHITE: white_count}

    def is_game_over(self):
        return (len(self.get_valid_moves(self.BLACK)) == 0 and
                len(self.get_valid_moves(self.WHITE)) == 0)

    def get_winner(self):
        if not self.is_game_over():
            return None
        score = self.get_score()
        if score[self.BLACK] > score[self.WHITE]:
            return self.BLACK
        elif score[self.WHITE] > score[self.BLACK]:
            return self.WHITE
        return 0

    def clone(self):
        new_game = OthelloGame()
        new_game.board = [row[:] for row in self.board]
        new_game.current_player = self.current_player
        return new_game
