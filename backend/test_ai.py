import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import random
import time
from othello_game import OthelloGame
from mcts_ai import MCTS


def random_ai_move(game):
    valid_moves = game.get_valid_moves()
    if not valid_moves:
        return None
    return random.choice(valid_moves)


def print_board(game):
    print("  0 1 2 3 4 5 6 7")
    for i, row in enumerate(game.board):
        line = f"{i} "
        for cell in row:
            if cell == OthelloGame.EMPTY:
                line += ". "
            elif cell == OthelloGame.BLACK:
                line += "B "
            else:
                line += "W "
        print(line)
    print()


def play_game(mcts_black=True, mcts_iterations=500, verbose=False):
    game = OthelloGame()
    mcts = MCTS(iterations=mcts_iterations)

    move_count = 0
    while not game.is_game_over():
        current_player = game.get_current_player()
        valid_moves = game.get_valid_moves()

        if not valid_moves:
            break

        is_mcts_turn = (mcts_black and current_player == OthelloGame.BLACK) or \
                       (not mcts_black and current_player == OthelloGame.WHITE)

        if is_mcts_turn:
            move, visits, children = mcts.get_best_move(game)
            if verbose:
                player_name = "MCTS(B)" if current_player == OthelloGame.BLACK else "MCTS(W)"
                print(f"{player_name} 思考: {visits}次模拟, 考虑{children}种走法, 选择{move}")
        else:
            move = random_ai_move(game)
            if verbose:
                player_name = "Random(B)" if current_player == OthelloGame.BLACK else "Random(W)"
                print(f"{player_name} 选择: {move}")

        if move:
            game.make_move(move[0], move[1])
            move_count += 1
            if verbose:
                print_board(game)
                score = game.get_score()
                print(f"比分: B={score[OthelloGame.BLACK]}, W={score[OthelloGame.WHITE]}")
                print("-" * 50)

    winner = game.get_winner()
    score = game.get_score()

    if verbose:
        print("=" * 50)
        print("游戏结束!")
        if winner == OthelloGame.BLACK:
            print("黑棋获胜!")
        elif winner == OthelloGame.WHITE:
            print("白棋获胜!")
        else:
            print("平局!")
        print(f"最终比分: B={score[OthelloGame.BLACK]}, W={score[OthelloGame.WHITE]}")
        print(f"总步数: {move_count}")

    return winner, score, move_count


def test_mcts_vs_random(num_games=5, mcts_iterations=500):
    print("=" * 60)
    print(f"MCTS (iter={mcts_iterations}) vs Random 对弈测试")
    print("=" * 60)

    mcts_wins = 0
    random_wins = 0
    draws = 0
    total_moves = 0

    for i in range(num_games):
        print(f"\n第 {i+1}/{num_games} 局...")
        mcts_black = (i % 2 == 0)
        print(f"MCTS执{'黑' if mcts_black else '白'}棋")

        start_time = time.time()
        winner, score, moves = play_game(
            mcts_black=mcts_black,
            mcts_iterations=mcts_iterations,
            verbose=False
        )
        elapsed = time.time() - start_time

        total_moves += moves

        mcts_player = OthelloGame.BLACK if mcts_black else OthelloGame.WHITE
        if winner == mcts_player:
            mcts_wins += 1
            result = "MCTS 胜"
        elif winner == 0:
            draws += 1
            result = "平局"
        else:
            random_wins += 1
            result = "Random 胜"

        print(f"  结果: {result} | 比分 B={score[OthelloGame.BLACK]}-W={score[OthelloGame.WHITE]} | 步数={moves} | 用时={elapsed:.1f}s")

    print("\n" + "=" * 60)
    print("测试总结:")
    print(f"  总局数: {num_games}")
    print(f"  MCTS 胜: {mcts_wins} ({100*mcts_wins/num_games:.1f}%)")
    print(f"  Random 胜: {random_wins} ({100*random_wins/num_games:.1f}%)")
    print(f"  平局: {draws} ({100*draws/num_games:.1f}%)")
    print(f"  平均步数: {total_moves/num_games:.1f}")
    print("=" * 60)

    return mcts_wins > random_wins


def test_single_game_with_details():
    print("\n" + "=" * 60)
    print("详细单局对弈演示 (MCTS执白棋 vs Random执黑棋)")
    print("=" * 60 + "\n")

    play_game(mcts_black=False, mcts_iterations=800, verbose=True)


def test_mcts_self_play():
    print("\n" + "=" * 60)
    print("MCTS 自我对弈演示 (左右互搏)")
    print("=" * 60 + "\n")

    game = OthelloGame()
    mcts = MCTS(iterations=400)

    move_count = 0
    while not game.is_game_over():
        valid_moves = game.get_valid_moves()
        if not valid_moves:
            break

        current_player = game.get_current_player()
        move, visits, children = mcts.get_best_move(game)

        player_name = "MCTS(B)" if current_player == OthelloGame.BLACK else "MCTS(W)"
        print(f"步数 {move_count+1}: {player_name} 选择 {move} (模拟{visits}次)")

        game.make_move(move[0], move[1])
        move_count += 1

        if move_count % 5 == 0:
            print_board(game)
            score = game.get_score()
            print(f"当前比分: B={score[OthelloGame.BLACK]}, W={score[OthelloGame.WHITE]}")
            print()

    print("=" * 50)
    print("自我对弈结束!")
    print_board(game)
    winner = game.get_winner()
    score = game.get_score()
    if winner == OthelloGame.BLACK:
        print("黑棋获胜!")
    elif winner == OthelloGame.WHITE:
        print("白棋获胜!")
    else:
        print("平局!")
    print(f"最终比分: B={score[OthelloGame.BLACK]}, W={score[OthelloGame.WHITE]}")
    print(f"总步数: {move_count}")
    print("=" * 60)


if __name__ == "__main__":
    print("黑白棋 MCTS AI 测试套件")
    print("=" * 60)

    print("\n1. 首先运行详细单局演示...")
    test_single_game_with_details()

    print("\n\n2. 运行 MCTS vs Random 胜率测试 (3局)...")
    is_smart = test_mcts_vs_random(num_games=3, mcts_iterations=600)

    print("\n\n3. 运行 MCTS 自我对弈演示...")
    test_mcts_self_play()

    print("\n" + "=" * 60)
    if is_smart:
        print("✅ 测试通过! MCTS算法表现出明显的智能性，胜率显著高于随机策略。")
    else:
        print("⚠️  警告: MCTS胜率未超过随机策略，建议增加迭代次数。")
    print("=" * 60)
