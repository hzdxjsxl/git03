import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from othello_game import OthelloGame
from mcts_ai import MCTS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

game = OthelloGame()
ai = MCTS(iterations=800)


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/api/reset', methods=['POST'])
def reset_game():
    game.reset()
    return jsonify({
        'board': game.get_board(),
        'current_player': game.get_current_player(),
        'valid_moves': game.get_valid_moves(),
        'score': game.get_score(),
        'game_over': False,
        'winner': None
    })


@app.route('/api/state', methods=['GET'])
def get_state():
    return jsonify({
        'board': game.get_board(),
        'current_player': game.get_current_player(),
        'valid_moves': game.get_valid_moves(),
        'score': game.get_score(),
        'game_over': game.is_game_over(),
        'winner': game.get_winner()
    })


@app.route('/api/move', methods=['POST'])
def make_move():
    data = request.get_json()
    row = data.get('row')
    col = data.get('col')

    if not game.is_valid_move(row, col):
        return jsonify({'error': 'Invalid move'}), 400

    game.make_move(row, col)

    response = {
        'board': game.get_board(),
        'current_player': game.get_current_player(),
        'valid_moves': game.get_valid_moves(),
        'score': game.get_score(),
        'game_over': game.is_game_over(),
        'winner': game.get_winner(),
        'player_move': (row, col)
    }

    if game.is_game_over():
        return jsonify(response)

    if len(game.get_valid_moves()) > 0 and game.get_current_player() == OthelloGame.WHITE:
        return jsonify(response)

    return jsonify(response)


@app.route('/api/ai_move', methods=['POST'])
def ai_move():
    if game.is_game_over():
        return jsonify({'error': 'Game is over'}), 400

    if len(game.get_valid_moves()) == 0:
        return jsonify({'error': 'No valid moves'}), 400

    move, visits, children = ai.get_best_move(game)
    game.make_move(move[0], move[1])

    return jsonify({
        'board': game.get_board(),
        'current_player': game.get_current_player(),
        'valid_moves': game.get_valid_moves(),
        'score': game.get_score(),
        'game_over': game.is_game_over(),
        'winner': game.get_winner(),
        'ai_move': move,
        'simulations': visits,
        'considered_moves': children
    })


if __name__ == '__main__':
    print("Starting Othello MCTS AI server...")
    print(f"AI iterations: {ai.iterations}")
    app.run(host='0.0.0.0', port=5000, debug=False)
