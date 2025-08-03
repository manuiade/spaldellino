from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from src.models.game import Game, GamePhase
import uuid

game_bp = Blueprint('game', __name__)

# In-memory storage for games (in production, use a database)
games = {}


@game_bp.route('/games', methods=['POST'])
@cross_origin()
def create_game():
    """Create a new game"""
    try:
        data = request.get_json()
        player_name = data.get('player_name', 'Player')
        player_id = str(uuid.uuid4())
        
        game = Game()
        game.add_player(player_id, player_name)
        games[game.game_id] = game
        
        return jsonify({
            'success': True,
            'game_id': game.game_id,
            'player_id': player_id,
            'game_state': game.to_dict(player_id)
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@game_bp.route('/games/<game_id>/join', methods=['POST'])
@cross_origin()
def join_game(game_id):
    """Join an existing game"""
    try:
        if game_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        game = games[game_id]
        data = request.get_json()
        player_name = data.get('player_name', 'Player')
        player_id = str(uuid.uuid4())
        
        if not game.add_player(player_id, player_name):
            return jsonify({'success': False, 'error': 'Cannot join game (full or already started)'}), 400
        
        return jsonify({
            'success': True,
            'player_id': player_id,
            'game_state': game.to_dict(player_id)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@game_bp.route('/games/<game_id>/start', methods=['POST'])
@cross_origin()
def start_game(game_id):
    """Start the game"""
    try:
        if game_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        game = games[game_id]
        
        if not game.start_game():
            return jsonify({'success': False, 'error': 'Cannot start game (not enough players or already started)'}), 400
        
        return jsonify({
            'success': True,
            'game_state': game.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@game_bp.route('/games/<game_id>/guess', methods=['POST'])
@cross_origin()
def make_guess(game_id):
    """Make a guess for the current phase"""
    try:
        if game_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        game = games[game_id]
        data = request.get_json()
        player_id = data.get('player_id')
        guess = data.get('guess')
        
        if not game.make_guess(player_id, guess):
            return jsonify({'success': False, 'error': 'Invalid guess or not guessing phase'}), 400
        
        return jsonify({
            'success': True,
            'game_state': game.to_dict(player_id)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@game_bp.route('/games/<game_id>/play', methods=['POST'])
@cross_origin()
def play_card(game_id):
    """Play a card"""
    try:
        if game_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        game = games[game_id]
        data = request.get_json()
        player_id = data.get('player_id')
        card_number = data.get('card_number')
        card_seed = data.get('card_seed')
        
        if not game.play_card(player_id, card_number, card_seed):
            return jsonify({'success': False, 'error': 'Invalid card play'}), 400
        
        return jsonify({
            'success': True,
            'game_state': game.to_dict(player_id)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@game_bp.route('/games/<game_id>/state', methods=['GET'])
@cross_origin()
def get_game_state(game_id):
    """Get the current game state"""
    try:
        if game_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        game = games[game_id]
        player_id = request.args.get('player_id')
        
        return jsonify({
            'success': True,
            'game_state': game.to_dict(player_id)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@game_bp.route('/games', methods=['GET'])
@cross_origin()
def list_games():
    """List all available games"""
    try:
        game_list = []
        for game_id, game in games.items():
            if game.phase == GamePhase.WAITING:
                game_list.append({
                    'game_id': game_id,
                    'players': len(game.players),
                    'max_players': game.max_players
                })
        
        return jsonify({
            'success': True,
            'games': game_list
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@game_bp.route('/games/<game_id>', methods=['DELETE'])
@cross_origin()
def delete_game(game_id):
    """Delete a game"""
    try:
        if game_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        del games[game_id]
        
        return jsonify({
            'success': True,
            'message': 'Game deleted'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

