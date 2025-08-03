from typing import List, Dict, Optional, Tuple
from enum import Enum
import uuid
from src.models.card import Card, Deck
from src.models.player import Player


class GamePhase(Enum):
    WAITING = "waiting"
    GUESSING = "guessing"
    PLAYING = "playing"
    PHASE_END = "phase_end"
    GAME_OVER = "game_over"


class Game:
    PHASE_SEQUENCE = [2, 3, 4, 5, 4, 3]  # Cards per phase sequence
    
    def __init__(self, game_id: str = None):
        self.game_id = game_id or str(uuid.uuid4())
        self.players: List[Player] = []
        self.deck = Deck()
        self.current_phase_index = 0
        self.current_turn = 0
        self.current_player_index = 0
        self.phase = GamePhase.WAITING
        self.played_cards: List[Tuple[str, Card]] = []  # (player_id, card)
        self.turn_results: List[str] = []  # List of winning player_ids for each turn
        self.winner: Optional[str] = None
        self.max_players = 8
        self.min_players = 2
        self.guessing_order_start = 0  # Index of first player to guess in current phase
        self.current_guessing_player = 0  # Index of current player who should guess
    
    def add_player(self, player_id: str, name: str) -> bool:
        """Add a player to the game"""
        if len(self.players) >= self.max_players:
            return False
        
        if any(p.player_id == player_id for p in self.players):
            return False
        
        player = Player(player_id, name)
        self.players.append(player)
        return True
    
    def remove_player(self, player_id: str) -> bool:
        """Remove a player from the game"""
        for i, player in enumerate(self.players):
            if player.player_id == player_id:
                self.players.pop(i)
                return True
        return False
    
    def can_start(self) -> bool:
        """Check if the game can be started"""
        return (len(self.players) >= self.min_players and 
                self.phase == GamePhase.WAITING)
    
    def start_game(self) -> bool:
        """Start the game"""
        if not self.can_start():
            return False
        
        self.deck.shuffle()
        self._start_new_phase()
        return True
    
    def _start_new_phase(self):
        """Start a new phase of the game"""
        # Reset players for new phase
        for player in self.players:
            if not player.is_eliminated:
                player.reset_for_new_phase()
        
        # Deal cards for this phase
        cards_per_player = self.PHASE_SEQUENCE[self.current_phase_index]
        active_players = [p for p in self.players if not p.is_eliminated]
        
        # Check if we have enough cards
        total_cards_needed = len(active_players) * cards_per_player
        if self.deck.remaining_cards() < total_cards_needed:
            self.deck.reset()
            self.deck.shuffle()
        
        # Deal cards
        for player in active_players:
            cards = self.deck.deal(cards_per_player)
            player.add_cards(cards)
        
        self.current_turn = 0
        self.current_player_index = 0
        self.played_cards = []
        self.turn_results = []
        
        # Set up guessing order (anti-clockwise, starting from next player each phase)
        self.guessing_order_start = (self.guessing_order_start + 1) % len(active_players)
        self.current_guessing_player = self.guessing_order_start
        
        self.phase = GamePhase.GUESSING
    
    def make_guess(self, player_id: str, guess: int) -> bool:
        """Player makes a guess for the current phase"""
        if self.phase != GamePhase.GUESSING:
            return False
        
        player = self._get_player(player_id)
        if not player or player.is_eliminated:
            return False
        
        active_players = [p for p in self.players if not p.is_eliminated]
        
        # Check if it's this player's turn to guess (anti-clockwise order)
        current_guessing_player_obj = active_players[self.current_guessing_player]
        if current_guessing_player_obj.player_id != player_id:
            return False
        
        cards_in_phase = self.PHASE_SEQUENCE[self.current_phase_index]
        if guess < 0 or guess > cards_in_phase:
            return False
        
        # Check constraint: total guesses cannot equal cards in phase (except for last player)
        if not self._is_guess_valid(guess, active_players):
            return False
        
        player.make_guess(guess)
        
        # Move to next player in anti-clockwise order
        self.current_guessing_player = (self.current_guessing_player - 1) % len(active_players)
        
        # Check if all active players have made their guesses
        if all(p.guess is not None for p in active_players):
            self.phase = GamePhase.PLAYING
        
        return True
    
    def _is_guess_valid(self, guess: int, active_players: List) -> bool:
        """Check if a guess is valid according to the constraint rules"""
        cards_in_phase = self.PHASE_SEQUENCE[self.current_phase_index]
        
        # Calculate current total of guesses made so far
        current_total = sum(p.guess for p in active_players if p.guess is not None)
        
        # Count how many players have already guessed
        players_who_guessed = sum(1 for p in active_players if p.guess is not None)
        
        # If this is the first player, any guess is valid
        if players_who_guessed == 0:
            return True
        
        # Calculate what the new total would be with this guess
        new_total = current_total + guess
        
        # If the current total is already above the cards in phase, any guess is valid
        if current_total > cards_in_phase:
            return True
        
        # For ALL other players (including the last one), check if the new total would equal cards in phase
        # This is NOT allowed for ANY player except the first
        if new_total == cards_in_phase:
            return False
        
        return True
    
    def get_valid_guesses(self, player_id: str) -> List[int]:
        """Get list of valid guesses for a player"""
        if self.phase != GamePhase.GUESSING:
            return []
        
        player = self._get_player(player_id)
        if not player or player.is_eliminated:
            return []
        
        active_players = [p for p in self.players if not p.is_eliminated]
        current_guessing_player_obj = active_players[self.current_guessing_player]
        
        # If it's not this player's turn, return empty list
        if current_guessing_player_obj.player_id != player_id:
            return []
        
        cards_in_phase = self.PHASE_SEQUENCE[self.current_phase_index]
        valid_guesses = []
        
        for guess in range(cards_in_phase + 1):
            if self._is_guess_valid(guess, active_players):
                valid_guesses.append(guess)
        
        return valid_guesses
    
    def play_card(self, player_id: str, card_number: int, card_seed: str) -> bool:
        """Player plays a card"""
        if self.phase != GamePhase.PLAYING:
            return False
        
        player = self._get_player(player_id)
        if not player or player.is_eliminated:
            return False
        
        # Check if it's the player's turn
        active_players = [p for p in self.players if not p.is_eliminated]
        if active_players[self.current_player_index].player_id != player_id:
            return False
        
        try:
            card = player.play_card_by_value(card_number, card_seed)
            self.played_cards.append((player_id, card))
            
            # Move to next player
            self.current_player_index = (self.current_player_index + 1) % len(active_players)
            
            # Check if all players have played their cards for this turn
            if len(self.played_cards) == len(active_players):
                self._resolve_turn()
            
            return True
        except ValueError:
            return False
    
    def _resolve_turn(self):
        """Resolve the current turn and determine the winner"""
        if not self.played_cards:
            return
        
        # Find the strongest card
        strongest_card = None
        winner_id = None
        
        for player_id, card in self.played_cards:
            if strongest_card is None or card > strongest_card:
                strongest_card = card
                winner_id = player_id
        
        # Award the turn to the winner
        winner = self._get_player(winner_id)
        if winner:
            winner.win_turn()
        
        self.turn_results.append(winner_id)
        self.played_cards = []
        self.current_turn += 1
        
        # Check if the phase is complete
        cards_in_phase = self.PHASE_SEQUENCE[self.current_phase_index]
        if self.current_turn >= cards_in_phase:
            self._end_phase()
        else:
            # Set the winner as the first player for the next turn
            active_players = [p for p in self.players if not p.is_eliminated]
            for i, player in enumerate(active_players):
                if player.player_id == winner_id:
                    self.current_player_index = i
                    break
    
    def _end_phase(self):
        """End the current phase and check guesses"""
        self.phase = GamePhase.PHASE_END
        
        # Check each player's guess against their actual wins
        for player in self.players:
            if not player.is_eliminated and player.guess is not None:
                if player.turns_won != player.guess:
                    player.lose_life()
        
        # Check for game over condition
        active_players = [p for p in self.players if not p.is_eliminated]
        if len(active_players) <= 1:
            self.phase = GamePhase.GAME_OVER
            if active_players:
                self.winner = active_players[0].player_id
        else:
            # Move to next phase
            self.current_phase_index = (self.current_phase_index + 1) % len(self.PHASE_SEQUENCE)
            self._start_new_phase()
    
    def _get_player(self, player_id: str) -> Optional[Player]:
        """Get a player by ID"""
        for player in self.players:
            if player.player_id == player_id:
                return player
        return None
    
    def get_current_player(self) -> Optional[Player]:
        """Get the current player whose turn it is"""
        if self.phase != GamePhase.PLAYING:
            return None
        
        active_players = [p for p in self.players if not p.is_eliminated]
        if not active_players:
            return None
        
        return active_players[self.current_player_index]
    
    def to_dict(self, player_id: str = None):
        """Convert game to dictionary representation"""
        data = {
            'game_id': self.game_id,
            'phase': self.phase.value,
            'current_phase_index': self.current_phase_index,
            'cards_in_current_phase': self.PHASE_SEQUENCE[self.current_phase_index],
            'current_turn': self.current_turn,
            'played_cards': [
                {'player_id': pid, 'card': card.to_dict()} 
                for pid, card in self.played_cards
            ],
            'turn_results': self.turn_results,
            'winner': self.winner,
            'players': []
        }
        
        # Add guessing information
        active_players = [p for p in self.players if not p.is_eliminated]
        if active_players and self.phase == GamePhase.GUESSING:
            current_guessing_player_obj = active_players[self.current_guessing_player]
            data['current_guessing_player_id'] = current_guessing_player_obj.player_id
            
            # Add valid guesses for the requesting player
            if player_id:
                data['valid_guesses'] = self.get_valid_guesses(player_id)
        else:
            data['current_guessing_player_id'] = None
            data['valid_guesses'] = []
        
        # Add player information
        for player in self.players:
            if player_id and player.player_id == player_id:
                # Include full hand for the requesting player
                data['players'].append(player.to_dict(include_hand=True))
            else:
                # Hide hand for other players
                data['players'].append(player.to_dict(include_hand=False))
        
        # Add current player info for playing phase
        current_player = self.get_current_player()
        data['current_player_id'] = current_player.player_id if current_player else None
        
        return data

