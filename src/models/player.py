from typing import List, Optional
from src.models.card import Card


class Player:
    def __init__(self, player_id: str, name: str):
        self.player_id = player_id
        self.name = name
        self.lives = 5
        self.hand: List[Card] = []
        self.guess: Optional[int] = None
        self.turns_won = 0
        self.is_eliminated = False
    
    def add_card(self, card: Card):
        """Add a card to the player's hand"""
        self.hand.append(card)
    
    def add_cards(self, cards: List[Card]):
        """Add multiple cards to the player's hand"""
        self.hand.extend(cards)
    
    def play_card(self, card_index: int) -> Card:
        """Play a card from the hand by index"""
        if card_index < 0 or card_index >= len(self.hand):
            raise ValueError("Invalid card index")
        return self.hand.pop(card_index)
    
    def play_card_by_value(self, number: int, seed_name: str) -> Card:
        """Play a card from the hand by number and seed"""
        from src.models.card import Seed
        
        for i, card in enumerate(self.hand):
            if card.number == number and card.seed.name == seed_name:
                return self.hand.pop(i)
        raise ValueError("Card not found in hand")
    
    def make_guess(self, guess: int):
        """Make a guess for the current phase"""
        if guess < 0:
            raise ValueError("Guess cannot be negative")
        self.guess = guess
    
    def win_turn(self):
        """Increment the number of turns won"""
        self.turns_won += 1
    
    def lose_life(self):
        """Lose a life and check if eliminated"""
        self.lives -= 1
        if self.lives <= 0:
            self.is_eliminated = True
    
    def reset_for_new_phase(self):
        """Reset player state for a new phase"""
        self.hand = []
        self.guess = None
        self.turns_won = 0
    
    def to_dict(self, include_hand=True):
        """Convert player to dictionary representation"""
        data = {
            'player_id': self.player_id,
            'name': self.name,
            'lives': self.lives,
            'guess': self.guess,
            'turns_won': self.turns_won,
            'is_eliminated': self.is_eliminated
        }
        
        if include_hand:
            data['hand'] = [card.to_dict() for card in self.hand]
        else:
            data['hand_size'] = len(self.hand)
        
        return data
    
    @classmethod
    def from_dict(cls, data):
        """Create player from dictionary representation"""
        player = cls(data['player_id'], data['name'])
        player.lives = data['lives']
        player.guess = data.get('guess')
        player.turns_won = data['turns_won']
        player.is_eliminated = data['is_eliminated']
        
        if 'hand' in data:
            from src.models.card import Card
            player.hand = [Card.from_dict(card_data) for card_data in data['hand']]
        
        return player

