// Game state
let gameState = {
    gameId: null,
    playerId: null,
    playerName: null,
    currentScreen: 'main-menu',
    showingTurnResult: false,
    lastTurnResult: null,
    showingPhaseResult: false,
    lastPhaseIndex: null,
    pendingPhaseResult: null,
    lastPhaseEndData: null
};

// API base URL
const API_BASE = '/api';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    showScreen('main-menu');
});

// Event Listeners
function initializeEventListeners() {
    // Main menu
    document.getElementById('create-game-btn').addEventListener('click', () => showScreen('create-game-screen'));
    document.getElementById('join-game-btn').addEventListener('click', () => {
        showScreen('join-game-screen');
        loadAvailableGames();
    });

    // Create game
    document.getElementById('create-confirm-btn').addEventListener('click', createGame);
    document.getElementById('back-to-menu-btn').addEventListener('click', () => showScreen('main-menu'));

    // Join game
    document.getElementById('join-confirm-btn').addEventListener('click', joinGame);
    document.getElementById('back-to-menu-join-btn').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('refresh-games-btn').addEventListener('click', loadAvailableGames);

    // Game lobby
    document.getElementById('copy-game-id-btn').addEventListener('click', copyGameId);
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('leave-game-btn').addEventListener('click', leaveGame);

    // Game actions
    document.getElementById('continue-btn').addEventListener('click', continueGame);
    document.getElementById('new-game-btn').addEventListener('click', () => showScreen('main-menu'));

    // Error modal
    document.getElementById('error-ok-btn').addEventListener('click', hideError);

    // Enter key handlers
    document.getElementById('player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createGame();
    });
    document.getElementById('join-player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
    document.getElementById('game-id').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
}

function showLoading() {
    showScreen('loading-screen');
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.add('active');
}

function hideError() {
    document.getElementById('error-modal').classList.remove('active');
}

// API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Unknown error');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Game functions
async function createGame() {
    const playerName = document.getElementById('player-name').value.trim();
    if (!playerName) {
        showError('Please enter your name');
        return;
    }

    try {
        showLoading();
        const result = await apiCall('/games', 'POST', { player_name: playerName });
        
        gameState.gameId = result.game_id;
        gameState.playerId = result.player_id;
        gameState.playerName = playerName;
        
        updateGameLobby(result.game_state);
        showScreen('game-lobby-screen');
        startGameStatePolling(); // Start polling for lobby updates
    } catch (error) {
        showError('Failed to create game: ' + error.message);
        showScreen('create-game-screen');
    }
}

async function joinGame(gameId = null) {
    const playerName = document.getElementById('join-player-name').value.trim();
    const gameIdInput = gameId || document.getElementById('game-id').value.trim();
    
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    if (!gameIdInput) {
        showError('Please enter a game ID or select a game');
        return;
    }

    try {
        showLoading();
        const result = await apiCall(`/games/${gameIdInput}/join`, 'POST', { player_name: playerName });
        
        gameState.gameId = gameIdInput;
        gameState.playerId = result.player_id;
        gameState.playerName = playerName;
        
        updateGameLobby(result.game_state);
        showScreen('game-lobby-screen');
        startGameStatePolling(); // Start polling for lobby updates
    } catch (error) {
        showError('Failed to join game: ' + error.message);
        showScreen('join-game-screen');
    }
}

async function startGame() {
    try {
        showLoading();
        const result = await apiCall(`/games/${gameState.gameId}/start`, 'POST');
        updateGameScreen(result.game_state);
        showScreen('game-screen');
        startGameStatePolling();
    } catch (error) {
        showError('Failed to start game: ' + error.message);
        showScreen('game-lobby-screen');
    }
}

async function makeGuess(guess) {
    try {
        const result = await apiCall(`/games/${gameState.gameId}/guess`, 'POST', {
            player_id: gameState.playerId,
            guess: guess
        });
        updateGameScreen(result.game_state);
    } catch (error) {
        showError('Failed to make guess: ' + error.message);
    }
}

async function playCard(cardNumber, cardSeed) {
    try {
        const result = await apiCall(`/games/${gameState.gameId}/play`, 'POST', {
            player_id: gameState.playerId,
            card_number: cardNumber,
            card_seed: cardSeed
        });
        updateGameScreen(result.game_state);
    } catch (error) {
        showError('Failed to play card: ' + error.message);
    }
}

async function loadAvailableGames() {
    try {
        const result = await apiCall('/games');
        displayAvailableGames(result.games);
    } catch (error) {
        console.error('Failed to load games:', error);
    }
}

async function getGameState() {
    try {
        const result = await apiCall(`/games/${gameState.gameId}/state?player_id=${gameState.playerId}`);
        return result.game_state;
    } catch (error) {
        console.error('Failed to get game state:', error);
        return null;
    }
}

// UI update functions
function updateGameLobby(game) {
    document.getElementById('lobby-game-id').textContent = game.game_id;
    
    const playersContainer = document.getElementById('lobby-players');
    playersContainer.innerHTML = '';
    
    game.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-lives">${'♥'.repeat(player.lives)}</span>
        `;
        playersContainer.appendChild(playerDiv);
    });
}

function updateGameScreen(game) {
    // Check if we should show turn result
    if (shouldShowTurnResult(game)) {
        showTurnResult(game);
        return;
    }
    
    // Check if we should show phase end result
    if (shouldShowPhaseResult(game)) {
        showPhaseEndSequence(game);
        return;
    }
    
    // Update phase info
    document.getElementById('current-phase').textContent = game.current_phase_index + 1;
    document.getElementById('cards-in-phase').textContent = game.cards_in_current_phase;
    document.getElementById('current-turn').textContent = game.current_turn + 1;
    
    // Update players status
    updatePlayersStatus(game);
    
    // Show appropriate game phase
    showGamePhase(game);
}

function shouldShowTurnResult(game) {
    // Show turn result if we're not already showing one and we have a new turn result
    if (gameState.showingTurnResult) {
        return false;
    }
    
    const hasNewTurnResult = game.turn_results.length > 0 && 
                            game.turn_results[game.turn_results.length - 1] !== gameState.lastTurnResult;
    
    // Show for regular turns in playing phase (when cards are cleared)
    if (game.phase === 'playing' && game.played_cards.length === 0 && hasNewTurnResult) {
        return true;
    }
    
    // Show for final turn when entering phase_end
    if (game.phase === 'phase_end' && hasNewTurnResult) {
        return true;
    }
    
    return false;
}

function shouldShowPhaseResult(game) {
    // Show phase result if we're in phase_end and haven't shown it yet
    if (gameState.showingPhaseResult || gameState.showingTurnResult) {
        return false;
    }
    
    // Check if we're in phase_end and this is a new phase end
    const isNewPhaseEnd = game.phase === 'phase_end' && 
                         (!gameState.lastPhaseEndData || 
                          gameState.lastPhaseEndData.current_phase_index !== game.current_phase_index);
    
    return isNewPhaseEnd;
}

function showPhaseEndSequence(game) {
    gameState.lastPhaseEndData = {
        current_phase_index: game.current_phase_index,
        players: JSON.parse(JSON.stringify(game.players)) // Deep copy for comparison
    };
    
    // Check if there's a final turn result to show first
    if (game.turn_results.length > 0 && 
        game.turn_results[game.turn_results.length - 1] !== gameState.lastTurnResult) {
        
        // Store phase result data to show after turn result
        gameState.pendingPhaseResult = game;
        showTurnResult(game, true);
    } else {
        // Show phase result directly
        showPhaseResult(game);
    }
}

function showTurnResult(game, isPhaseEndTurn = false) {
    gameState.showingTurnResult = true;
    const lastTurnIndex = game.turn_results.length - 1;
    const winnerPlayerId = game.turn_results[lastTurnIndex];
    const winner = game.players.find(p => p.player_id === winnerPlayerId);
    
    gameState.lastTurnResult = winnerPlayerId;
    
    // Create turn result banner (not full overlay, so cards remain visible)
    const banner = document.createElement('div');
    banner.className = 'turn-result-banner';
    banner.innerHTML = `
        <div class="turn-result-message">
            <span class="winner-name">${winner ? winner.name : 'Unknown'}</span>
            <span class="takes-hand">takes the hand!</span>
        </div>
        <div class="turn-result-timer">
            <div class="timer-bar"></div>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    // Animate the timer bar
    const timerBar = banner.querySelector('.timer-bar');
    timerBar.style.animation = 'timer-countdown 3s linear';
    
    // Remove banner after 3 seconds
    setTimeout(() => {
        document.body.removeChild(banner);
        gameState.showingTurnResult = false;
        
        // If this was the last turn of a phase, show phase results next
        if (isPhaseEndTurn && gameState.pendingPhaseResult) {
            showPhaseResult(gameState.pendingPhaseResult);
            gameState.pendingPhaseResult = null;
        } else {
            // Update the game screen normally
            updateGameScreenNormal(game);
        }
    }, 3000);
}

function showPhaseResult(game) {
    gameState.showingPhaseResult = true;
    
    // Find players who lost lives in this phase by comparing guess vs actual wins
    const playersWhoLost = [];
    const eliminatedPlayers = [];
    
    game.players.forEach(player => {
        if (player.is_eliminated) {
            eliminatedPlayers.push(player);
        } else if (player.guess !== null && player.guess !== player.turns_won) {
            // Player lost if their guess didn't match their actual wins
            playersWhoLost.push(player);
        }
    });
    
    // Create phase result overlay
    const overlay = document.createElement('div');
    overlay.className = 'phase-result-overlay';
    
    let resultMessage = '';
    let resultDetails = '';
    
    if (eliminatedPlayers.length > 0) {
        const eliminatedNames = eliminatedPlayers.map(p => p.name).join(', ');
        resultMessage = 'Players Eliminated!';
        resultDetails = `${eliminatedNames} ${eliminatedPlayers.length === 1 ? 'has' : 'have'} been eliminated from the game!`;
    } else if (playersWhoLost.length > 0) {
        const loserNames = playersWhoLost.map(p => p.name).join(', ');
        resultMessage = 'Phase Complete!';
        resultDetails = `${loserNames} ${playersWhoLost.length === 1 ? 'lost a life' : 'lost lives'} this phase!`;
    } else {
        resultMessage = 'Phase Complete!';
        resultDetails = 'All players guessed correctly!';
    }
    
    overlay.innerHTML = `
        <div class="phase-result-content">
            <h3>${resultMessage}</h3>
            <div class="phase-info">
                <div class="phase-message">${resultDetails}</div>
                <div class="phase-number">Phase ${game.current_phase_index + 1} Results</div>
            </div>
            <div class="phase-result-timer">
                <div class="timer-bar"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate the timer bar
    const timerBar = overlay.querySelector('.timer-bar');
    timerBar.style.animation = 'timer-countdown 4s linear';
    
    // Remove overlay after 4 seconds
    setTimeout(() => {
        document.body.removeChild(overlay);
        gameState.showingPhaseResult = false;
        
        // Update the game screen normally
        updateGameScreenNormal(game);
    }, 4000);
}

function updateGameScreenNormal(game) {
    // Track phase changes for phase result overlay
    gameState.lastPhaseIndex = game.current_phase_index;
    
    // Update phase info
    document.getElementById('current-phase').textContent = game.current_phase_index + 1;
    document.getElementById('cards-in-phase').textContent = game.cards_in_current_phase;
    document.getElementById('current-turn').textContent = game.current_turn + 1;
    
    // Update players status
    updatePlayersStatus(game);
    
    // Show appropriate game phase
    showGamePhase(game);
}

function updatePlayersStatus(game) {
    const playersContainer = document.getElementById('players-info');
    playersContainer.innerHTML = '';
    
    game.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-status';
        
        if (player.player_id === game.current_player_id) {
            playerDiv.classList.add('current-player');
        }
        
        if (player.is_eliminated) {
            playerDiv.classList.add('eliminated');
        }
        
        const guessText = player.guess !== null ? `Guess: ${player.guess}` : 'No guess';
        const winsText = `Wins: ${player.turns_won}`;
        
        playerDiv.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-lives">${'♥'.repeat(player.lives)}</div>
            <div class="player-guess">${guessText}</div>
            <div class="player-wins">${winsText}</div>
        `;
        
        playersContainer.appendChild(playerDiv);
    });
}

function showGamePhase(game) {
    // Hide all phases
    document.querySelectorAll('.game-phase').forEach(phase => {
        phase.classList.remove('active');
    });
    
    // Show appropriate phase
    switch (game.phase) {
        case 'guessing':
            document.getElementById('guessing-phase').classList.add('active');
            updateGuessingPhase(game);
            break;
        case 'playing':
            document.getElementById('playing-phase').classList.add('active');
            updatePlayingPhase(game);
            break;
        case 'phase_end':
            document.getElementById('phase-end').classList.add('active');
            updatePhaseEnd(game);
            break;
        case 'game_over':
            document.getElementById('game-over').classList.add('active');
            updateGameOver(game);
            break;
    }
}

function updateGuessingPhase(game) {
    const currentPlayer = game.players.find(p => p.player_id === gameState.playerId);
    
    // Show player's hand during guessing phase
    updatePlayerHandForGuessing(game);
    
    // Check if it's this player's turn to guess
    const isMyTurnToGuess = game.current_guessing_player_id === gameState.playerId;
    
    if (currentPlayer && currentPlayer.guess === null && isMyTurnToGuess) {
        // Show guess buttons with constraints
        const guessContainer = document.getElementById('guess-buttons');
        guessContainer.innerHTML = '';
        
        // Use valid guesses from backend
        const validGuesses = game.valid_guesses || [];
        
        if (validGuesses.length > 0) {
            validGuesses.forEach(guess => {
                const button = document.createElement('button');
                button.className = 'guess-btn';
                button.textContent = guess;
                button.addEventListener('click', () => makeGuess(guess));
                guessContainer.appendChild(button);
            });
        } else {
            guessContainer.innerHTML = '<p>No valid guesses available</p>';
        }
    } else if (currentPlayer && currentPlayer.guess !== null) {
        // Player has already guessed
        document.getElementById('guess-buttons').innerHTML = '<p>You have made your guess. Waiting for other players...</p>';
    } else {
        // Not this player's turn to guess
        const currentGuessingPlayer = game.players.find(p => p.player_id === game.current_guessing_player_id);
        const playerName = currentGuessingPlayer ? currentGuessingPlayer.name : 'Unknown';
        document.getElementById('guess-buttons').innerHTML = `<p>Waiting for ${playerName} to make their guess...</p>`;
    }
    
    // Show other players' guesses with turn order indication
    updateOtherGuessesWithOrder(game);
}

function updateOtherGuessesWithOrder(game) {
    const container = document.getElementById('other-guesses');
    container.innerHTML = '<h4>Player Guesses (Anti-clockwise order):</h4>';
    
    game.players.forEach(player => {
        const guessDiv = document.createElement('div');
        guessDiv.className = 'guess-item';
        
        // Highlight current guessing player
        if (player.player_id === game.current_guessing_player_id) {
            guessDiv.classList.add('current-guesser');
        }
        
        const guessText = player.guess !== null ? player.guess : '?';
        const statusText = player.player_id === game.current_guessing_player_id ? ' (guessing now)' : '';
        
        guessDiv.innerHTML = `
            <span>${player.name}${statusText}</span>
            <span>${guessText}</span>
        `;
        
        container.appendChild(guessDiv);
    });
}

function updateOtherGuesses(game) {
    const container = document.getElementById('other-guesses');
    container.innerHTML = '<h4>Player Guesses:</h4>';
    
    game.players.forEach(player => {
        const guessDiv = document.createElement('div');
        guessDiv.className = 'guess-item';
        
        const guessText = player.guess !== null ? player.guess : '?';
        guessDiv.innerHTML = `
            <span>${player.name}</span>
            <span>${guessText}</span>
        `;
        
        container.appendChild(guessDiv);
    });
}

function updatePlayerHandForGuessing(game) {
    const currentPlayer = game.players.find(p => p.player_id === gameState.playerId);
    if (!currentPlayer || !currentPlayer.hand) return;
    
    // Find or create hand display area in guessing phase
    let handContainer = document.getElementById('guessing-hand-cards');
    if (!handContainer) {
        // Create hand display area if it doesn't exist
        const guessingPhase = document.getElementById('guessing-phase');
        const handSection = document.createElement('div');
        handSection.className = 'guessing-hand-section';
        handSection.innerHTML = `
            <h4>Your Cards</h4>
            <div id="guessing-hand-cards" class="hand-cards-display">
                <!-- Player's cards will be shown here -->
            </div>
        `;
        
        // Insert before guess controls
        const guessControls = guessingPhase.querySelector('.guess-controls');
        guessingPhase.insertBefore(handSection, guessControls);
        handContainer = document.getElementById('guessing-hand-cards');
    }
    
    // Clear and populate hand
    handContainer.innerHTML = '';
    
    currentPlayer.hand.forEach(card => {
        const cardDiv = createCardElement(card, false);
        cardDiv.classList.add('guessing-card');
        handContainer.appendChild(cardDiv);
    });
}

function updatePlayingPhase(game) {
    // Update current player info
    const currentPlayerText = document.getElementById('current-player-text');
    if (game.current_player_id === gameState.playerId) {
        currentPlayerText.textContent = 'Your turn - Choose a card to play';
    } else {
        const currentPlayer = game.players.find(p => p.player_id === game.current_player_id);
        currentPlayerText.textContent = `Waiting for ${currentPlayer ? currentPlayer.name : 'player'} to play`;
    }
    
    // Update played cards
    updatePlayedCards(game);
    
    // Update player's hand
    updatePlayerHand(game);
}

function updatePlayedCards(game) {
    const container = document.getElementById('played-cards-area');
    container.innerHTML = '';
    
    game.played_cards.forEach(playedCard => {
        const cardDiv = createCardElement(playedCard.card, false);
        cardDiv.classList.add('played-card');
        
        const player = game.players.find(p => p.player_id === playedCard.player_id);
        const label = document.createElement('div');
        label.className = 'player-label';
        label.textContent = player ? player.name : 'Unknown';
        cardDiv.appendChild(label);
        
        container.appendChild(cardDiv);
    });
}

function updatePlayerHand(game) {
    const currentPlayer = game.players.find(p => p.player_id === gameState.playerId);
    if (!currentPlayer) return;
    
    const container = document.getElementById('hand-cards');
    container.innerHTML = '';
    
    const isMyTurn = game.current_player_id === gameState.playerId;
    
    currentPlayer.hand.forEach(card => {
        const cardDiv = createCardElement(card, isMyTurn);
        if (isMyTurn) {
            cardDiv.classList.add('playable');
            cardDiv.addEventListener('click', () => playCard(card.number, card.seed));
        }
        container.appendChild(cardDiv);
    });
}

function createCardElement(card, clickable = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    
    if (clickable) {
        cardDiv.style.cursor = 'pointer';
    }
    
    // Italian Briscola card styling
    const seedInfo = getItalianSeedInfo(card.seed);
    const numberDisplay = getItalianNumberDisplay(card.number);
    
    cardDiv.innerHTML = `
        <div class="card-header">
            <div class="card-number">${numberDisplay}</div>
            <div class="card-seed-small ${seedInfo.class}">${seedInfo.symbol}</div>
        </div>
        <div class="card-center">
            <div class="card-seed-large ${seedInfo.class}">${seedInfo.symbol}</div>
        </div>
        <div class="card-footer">
            <div class="card-number rotated">${numberDisplay}</div>
            <div class="card-seed-small rotated ${seedInfo.class}">${seedInfo.symbol}</div>
        </div>
    `;
    
    // Add seed-specific background styling
    cardDiv.classList.add(`card-${seedInfo.class}`);
    
    return cardDiv;
}

function getItalianSeedInfo(seed) {
    const seedMap = {
        'BASTONI': {
            symbol: '🌿',
            class: 'bastoni',
            color: '#8B4513',
            name: 'Bastoni'
        },
        'SPADE': {
            symbol: '⚔️',
            class: 'spade',
            color: '#000',
            name: 'Spade'
        },
        'COPPE': {
            symbol: '🏆',
            class: 'coppe',
            color: '#FFD700',
            name: 'Coppe'
        },
        'DENARI': {
            symbol: '💰',
            class: 'denari',
            color: '#FF6B6B',
            name: 'Denari'
        }
    };
    
    return seedMap[seed] || seedMap['BASTONI'];
}

function getItalianNumberDisplay(number) {
    const numberMap = {
        1: 'A',
        2: '2',
        3: '3',
        4: '4',
        5: '5',
        6: '6',
        7: '7',
        8: 'J',  // Jack (Fante)
        9: 'C',  // Cavallo (Knight)
        10: 'R'  // Re (King)
    };
    
    return numberMap[number] || number.toString();
}

function updatePhaseEnd(game) {
    const container = document.getElementById('phase-results');
    container.innerHTML = '<h4>Phase Results:</h4>';
    
    game.players.forEach(player => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'player-result';
        
        const success = player.guess === player.turns_won;
        const resultText = success ? '✅ Correct!' : '❌ Wrong!';
        
        resultDiv.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div>Guessed: ${player.guess}, Won: ${player.turns_won}</div>
            <div class="result-status">${resultText}</div>
            <div>Lives: ${player.lives}</div>
        `;
        
        if (player.is_eliminated) {
            resultDiv.innerHTML += '<div style="color: #ff6b6b; font-weight: bold;">ELIMINATED</div>';
        }
        
        container.appendChild(resultDiv);
    });
}

function updateGameOver(game) {
    const container = document.getElementById('game-results');
    
    if (game.winner) {
        const winner = game.players.find(p => p.player_id === game.winner);
        container.innerHTML = `
            <h4>🎉 ${winner ? winner.name : 'Unknown'} Wins! 🎉</h4>
            <p>Congratulations!</p>
        `;
    } else {
        container.innerHTML = '<h4>Game Over</h4><p>No winner determined.</p>';
    }
}

function displayAvailableGames(games) {
    const container = document.getElementById('games-list');
    container.innerHTML = '';
    
    if (games.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center;">No games available</p>';
        return;
    }
    
    games.forEach(game => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game-item';
        gameDiv.innerHTML = `
            <div>
                <div>Game ID: ${game.game_id}</div>
                <div>Players: ${game.players}/${game.max_players}</div>
            </div>
            <button class="btn btn-small">Join</button>
        `;
        
        gameDiv.addEventListener('click', () => {
            document.getElementById('game-id').value = game.game_id;
        });
        
        const joinBtn = gameDiv.querySelector('button');
        joinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            joinGame(game.game_id);
        });
        
        container.appendChild(gameDiv);
    });
}

// Utility functions
function copyGameId() {
    const gameId = gameState.gameId;
    if (gameId) {
        navigator.clipboard.writeText(gameId).then(() => {
            const btn = document.getElementById('copy-game-id-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }
}

function leaveGame() {
    gameState.gameId = null;
    gameState.playerId = null;
    gameState.playerName = null;
    stopGameStatePolling();
    showScreen('main-menu');
}

function continueGame() {
    // Just refresh the game state
    if (gameState.gameId) {
        getGameState().then(game => {
            if (game) {
                updateGameScreen(game);
            }
        });
    }
}

// Game state polling
let pollingInterval = null;

function startGameStatePolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    pollingInterval = setInterval(async () => {
        if (gameState.gameId) {
            const game = await getGameState();
            if (game) {
                // Update based on current screen
                if (gameState.currentScreen === 'game-lobby-screen') {
                    updateGameLobby(game);
                    // Auto-start game if it has started
                    if (game.phase !== 'waiting') {
                        updateGameScreen(game);
                        showScreen('game-screen');
                        // Continue polling for game screen
                    }
                } else if (gameState.currentScreen === 'game-screen') {
                    updateGameScreen(game);
                }
            }
        }
    }, 2000); // Poll every 2 seconds
}

function stopGameStatePolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}