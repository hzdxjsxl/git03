const API_BASE = '/api';

let gameState = null;
let isPlayerTurn = true;
let lastMove = null;
let totalSimulations = 0;
let aiMoveCount = 0;

const boardEl = document.getElementById('board');
const blackScoreEl = document.getElementById('black-score');
const whiteScoreEl = document.getElementById('white-score');
const gameStatusEl = document.getElementById('game-status');
const aiThinkingEl = document.getElementById('ai-thinking');
const simCountEl = document.getElementById('sim-count');
const moveCountEl = document.getElementById('move-count');
const totalSimEl = document.getElementById('total-sim');
const aiMoveNumEl = document.getElementById('ai-move-num');
const gameOverEl = document.getElementById('game-over');
const winnerTextEl = document.getElementById('winner-text');
const finalScoreEl = document.getElementById('final-score');
const resetBtn = document.getElementById('reset-btn');
const playAgainBtn = document.getElementById('play-again-btn');

function initBoard() {
    boardEl.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.tabIndex = 0;
            cell.setAttribute('role', 'button');
            cell.setAttribute('aria-label', `Cell ${row},${col}`);
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', handleCellClick);
            boardEl.appendChild(cell);
        }
    }
}

function updateAIInfo(simulations, consideredMoves) {
    if (simulations !== undefined && simulations !== null) {
        simCountEl.textContent = simulations;
    }
    if (consideredMoves !== undefined && consideredMoves !== null) {
        moveCountEl.textContent = consideredMoves;
    }
    if (totalSimEl) totalSimEl.textContent = totalSimulations;
    if (aiMoveNumEl) aiMoveNumEl.textContent = aiMoveCount;
}

function resetAIInfo() {
    simCountEl.textContent = '0';
    moveCountEl.textContent = '0';
    totalSimulations = 0;
    aiMoveCount = 0;
    if (totalSimEl) totalSimEl.textContent = '0';
    if (aiMoveNumEl) aiMoveNumEl.textContent = '0';
}

function renderBoard() {
    if (!gameState) return;

    const cells = boardEl.querySelectorAll('.cell');
    const validMoves = new Set(
        gameState.valid_moves.map(m => `${m[0]},${m[1]}`)
    );

    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const piece = gameState.board[row][col];

        cell.innerHTML = '';
        cell.classList.remove('valid-move');

        if (piece === 1) {
            const disc = document.createElement('div');
            disc.className = 'disc black';
            if (lastMove && lastMove[0] === row && lastMove[1] === col) {
                disc.classList.add('last-move');
            }
            cell.appendChild(disc);
        } else if (piece === 2) {
            const disc = document.createElement('div');
            disc.className = 'disc white';
            if (lastMove && lastMove[0] === row && lastMove[1] === col) {
                disc.classList.add('last-move');
            }
            cell.appendChild(disc);
        }

        if (isPlayerTurn && validMoves.has(`${row},${col}`)) {
            cell.classList.add('valid-move');
        }
    });

    blackScoreEl.textContent = gameState.score[1];
    whiteScoreEl.textContent = gameState.score[2];

    updatePlayerHighlight();
}

function updatePlayerHighlight() {
    const blackInfo = document.querySelector('.player-info.black');
    const whiteInfo = document.querySelector('.player-info.white');

    blackInfo.classList.remove('active');
    whiteInfo.classList.remove('active');

    if (gameState.current_player === 1) {
        blackInfo.classList.add('active');
    } else {
        whiteInfo.classList.add('active');
    }
}

function updateStatus() {
    if (gameState.game_over) {
        gameStatusEl.textContent = '游戏结束';
        aiThinkingEl.classList.add('hidden');
        showGameOver();
        return;
    }

    if (isPlayerTurn) {
        if (gameState.valid_moves.length === 0) {
            gameStatusEl.textContent = '你无法落子，AI继续';
            isPlayerTurn = false;
            setTimeout(requestAIMove, 800);
        } else {
            gameStatusEl.textContent = '轮到你下棋';
        }
        aiThinkingEl.classList.add('hidden');
    } else {
        gameStatusEl.textContent = 'AI思考中...';
        aiThinkingEl.classList.remove('hidden');
    }
}

function showGameOver() {
    const winner = gameState.winner;
    const blackScore = gameState.score[1];
    const whiteScore = gameState.score[2];

    if (winner === 1) {
        winnerTextEl.textContent = '🎉 恭喜你获胜！';
    } else if (winner === 2) {
        winnerTextEl.textContent = '🤖 AI 获胜！';
    } else {
        winnerTextEl.textContent = '🤝 平局！';
    }

    finalScoreEl.textContent = `最终比分: 黑棋 ${blackScore} - ${whiteScore} 白棋`;
    gameOverEl.classList.remove('hidden');
}

let aiMovePending = false;

async function handleCellClick(e) {
    if (!isPlayerTurn || !gameState || gameState.game_over) return;
    if (aiMovePending) return;

    const row = parseInt(e.currentTarget.dataset.row);
    const col = parseInt(e.currentTarget.dataset.col);

    const isValid = gameState.valid_moves.some(m => m[0] === row && m[1] === col);
    if (!isValid) return;

    try {
        isPlayerTurn = false;
        updateStatus();

        const response = await fetch(`${API_BASE}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ row, col })
        });

        if (!response.ok) {
            console.error('Move API error:', response.status);
            isPlayerTurn = true;
            updateStatus();
            return;
        }

        const data = await response.json();
        gameState = data;
        lastMove = data.player_move || null;
        renderBoard();

        if (gameState.game_over) {
            updateStatus();
            return;
        }

        if (gameState.current_player === 2) {
            setTimeout(requestAIMove, 400);
        } else {
            isPlayerTurn = true;
            updateStatus();
        }
    } catch (error) {
        console.error('Error making move:', error);
        isPlayerTurn = true;
        updateStatus();
    }
}

async function requestAIMove() {
    if (gameState.game_over) return;
    if (aiMovePending) return;
    aiMovePending = true;

    isPlayerTurn = false;
    updateStatus();

    try {
        const response = await fetch(`${API_BASE}/ai_move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.error('AI move API error:', response.status);
            isPlayerTurn = true;
            updateStatus();
            aiMovePending = false;
            return;
        }

        const data = await response.json();

        gameState = data;
        lastMove = data.ai_move || null;

        const simulations = data.simulations;
        const consideredMoves = data.considered_moves;

        if (typeof simulations === 'number') {
            totalSimulations += simulations;
        }
        aiMoveCount += 1;

        updateAIInfo(simulations, consideredMoves);

        renderBoard();

        if (gameState.game_over) {
            updateStatus();
            aiMovePending = false;
            return;
        }

        if (gameState.current_player === 1 && gameState.valid_moves.length > 0) {
            isPlayerTurn = true;
        } else if (gameState.current_player === 2) {
            setTimeout(() => {
                aiMovePending = false;
                requestAIMove();
            }, 400);
            updateStatus();
            return;
        } else {
            isPlayerTurn = true;
        }
        updateStatus();
    } catch (error) {
        console.error('Error getting AI move:', error);
        isPlayerTurn = true;
        updateStatus();
    }

    aiMovePending = false;
}

async function resetGame() {
    try {
        const response = await fetch(`${API_BASE}/reset`, {
            method: 'POST'
        });

        if (!response.ok) {
            console.error('Reset API error:', response.status);
            return;
        }

        gameState = await response.json();
        lastMove = null;
        isPlayerTurn = true;
        aiMovePending = false;
        gameOverEl.classList.add('hidden');
        resetAIInfo();
        renderBoard();
        updateStatus();
    } catch (error) {
        console.error('Error resetting game:', error);
    }
}

async function initGame() {
    initBoard();
    await resetGame();
}

resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);

initGame();
