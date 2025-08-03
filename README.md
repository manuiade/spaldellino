# Spaldellino - Italian Card Game

A web-based implementation of the traditional Italian card game "Spaldellino" built with Python Flask backend and vanilla JavaScript frontend.

## Game Rules

Spaldellino is a card game for 2-8 players using a standard Italian deck of 40 cards.

### Card Values
- **Numbers**: Ace (1), 2, 3, 4, 5, 6, 7, Jack (8), Knight (9), King (10)
- **Seeds**: Bastoni (weakest) < Spade < Coppe < Denari (strongest)
- **Card Strength**: Determined first by number, then by seed

### Game Flow
1. **Lives**: Each player starts with 5 lives
2. **Phases**: Cards dealt in sequence: 2, 3, 4, 5, 4, 3 (then repeats)
3. **Guessing**: Players guess how many turns they'll win in each phase
4. **Playing**: Players play cards clockwise, strongest card wins the turn
5. **Scoring**: Players who fail to meet their guess lose 1 life
6. **Elimination**: Players with 0 lives are eliminated
7. **Victory**: Last player standing wins!

## Features

- **Real-time Multiplayer**: Support for 2-8 players
- **Responsive Design**: Works on desktop and mobile devices
- **Game Lobby**: Create or join games with unique game IDs
- **Live Game State**: Real-time updates during gameplay
- **Beautiful UI**: Modern, gradient-based design with smooth animations

## Technology Stack

- **Backend**: Python Flask with REST API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Modern CSS with gradients and animations
- **Deployment**: Production-ready Flask application

## Project Structure

```
spaldellino_game/
├── src/
│   ├── models/
│   │   ├── card.py          # Card and Deck classes
│   │   ├── player.py        # Player class
│   │   └── game.py          # Game logic and state management
│   ├── routes/
│   │   ├── game.py          # Game API endpoints
│   │   └── user.py          # User management (template)
│   ├── static/
│   │   ├── index.html       # Main HTML structure
│   │   ├── styles.css       # CSS styling
│   │   └── script.js        # JavaScript game logic
│   └── main.py              # Flask application entry point
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## API Endpoints

### Game Management
- `POST /api/games` - Create a new game
- `GET /api/games` - List available games
- `POST /api/games/{id}/join` - Join a game
- `POST /api/games/{id}/start` - Start a game
- `GET /api/games/{id}/state` - Get game state
- `DELETE /api/games/{id}` - Delete a game

### Game Actions
- `POST /api/games/{id}/guess` - Make a guess for the current phase
- `POST /api/games/{id}/play` - Play a card

## Local Development

1. **Clone and Setup**:
   ```bash
   cd spaldellino_game
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   python src/main.py
   ```

3. **Access the Game**:
   Open your browser to `http://localhost:5000`

## Deployment

The application is deployed and accessible at:
**https://ogh5izc8mn6p.manus.space**

### Latest Features (v2.2) - Final Bug Fix
- **Correctly Fixed Guessing Constraints**: Now properly enforces that NO player (except the first) can make a guess that would cause the total to equal the number of cards in the phase
- **Applies to ALL Players**: The constraint now correctly applies to all players including the last player
- **Only Exception**: The first player can guess any number they want
- **Freedom After Exceeding**: Once the total exceeds the number of cards in the phase, subsequent players can guess freely

### Previous Features
- **Turn Result Display**: Added a 3-second overlay showing the winner of each turn with animated timer
- **Anti-clockwise Guessing Order**: Players must guess in anti-clockwise order, starting from a different player each phase
- **Italian Briscola Card Graphics**: Authentic Piacentine-style card design with traditional Italian symbols and layout
- **Enhanced Turn Management**: Clear indication of whose turn it is to guess with visual highlighting
- **Real-time Lobby Updates**: Players in the game lobby now see real-time updates when new players join
- **Auto-transition to Game**: When the game starts, all players are automatically moved from lobby to game screen
- **Hand Display During Guessing**: Players can now see their cards during the guessing phase to make informed decisions
- **Enhanced Polling**: Improved real-time updates across all game phases

## How to Play

1. **Create or Join a Game**:
   - Click "Create Game" to start a new game
   - Or click "Join Game" and enter a game ID

2. **Game Lobby**:
   - Wait for other players to join (2-8 players)
   - Share the game ID with friends
   - Click "Start Game" when ready

3. **Guessing Phase**:
   - Look at your cards
   - Guess how many turns you think you'll win
   - Wait for all players to make their guesses

4. **Playing Phase**:
   - When it's your turn, click a card to play it
   - The strongest card wins the turn
   - Continue until all cards are played

5. **Phase Results**:
   - See if your guess was correct
   - Players with wrong guesses lose a life
   - Continue to the next phase

6. **Victory**:
   - Last player with lives remaining wins!

## Game Features

- **Card Visualization**: Beautiful card representations with Italian seed symbols
- **Real-time Updates**: Game state updates automatically
- **Player Status**: Live tracking of lives, guesses, and wins
- **Turn Indicators**: Clear indication of whose turn it is
- **Responsive Design**: Optimized for all screen sizes
- **Error Handling**: Comprehensive error messages and validation

## Contributing

This is a complete implementation of the Spaldellino card game. The codebase is well-structured and documented for easy modification and extension.

## License

This project is created for educational and entertainment purposes.

