from enum import Enum
from typing import List


class Seed(Enum):
    BASTONI = 1
    SPADE = 2
    COPPE = 3
    DENARI = 4


class Card:
    def __init__(self, number: int, seed: Seed):
        if number < 1 or number > 10:
            raise ValueError("Card number must be between 1 and 10")
        self.number = number
        self.seed = seed
    
    def __str__(self):
        return f"{self.number} of {self.seed.name}"
    
    def __repr__(self):
        return f"Card({self.number}, {self.seed})"
    
    def __eq__(self, other):
        if not isinstance(other, Card):
            return False
        return self.number == other.number and self.seed == other.seed
    
    def __lt__(self, other):
        if not isinstance(other, Card):
            return NotImplemented
        if self.number != other.number:
            return self.number < other.number
        return self.seed.value < other.seed.value
    
    def __le__(self, other):
        return self < other or self == other
    
    def __gt__(self, other):
        return not self <= other
    
    def __ge__(self, other):
        return not self < other
    
    def to_dict(self):
        return {
            'number': self.number,
            'seed': self.seed.name
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(data['number'], Seed[data['seed']])


class Deck:
    def __init__(self):
        self.cards = []
        self._create_deck()
    
    def _create_deck(self):
        """Create a standard Italian deck of 40 cards"""
        self.cards = []
        for seed in Seed:
            for number in range(1, 11):
                self.cards.append(Card(number, seed))
    
    def shuffle(self):
        """Shuffle the deck"""
        import random
        random.shuffle(self.cards)
    
    def deal(self, num_cards: int) -> List[Card]:
        """Deal a specified number of cards from the deck"""
        if num_cards > len(self.cards):
            raise ValueError("Not enough cards in deck")
        
        dealt_cards = []
        for _ in range(num_cards):
            dealt_cards.append(self.cards.pop())
        
        return dealt_cards
    
    def remaining_cards(self) -> int:
        """Return the number of cards remaining in the deck"""
        return len(self.cards)
    
    def reset(self):
        """Reset the deck to full 40 cards"""
        self._create_deck()

