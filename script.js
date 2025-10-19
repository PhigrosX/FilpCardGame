// --- DOM 元素获取 ---
const gameBoard = document.querySelector('.game-board');
const levelDisplay = document.querySelector('#level');
const timerDisplay = document.querySelector('#timer'); // 新增
const restartBtn = document.querySelector('#restart-btn');
const gameMessage = document.querySelector('#game-message'); // 新增

// --- 游戏配置 ---
const allSymbols = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
    '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺'
];

// 为每个等级定义布局 [行, 列] 和时间限制 (秒)
const levels = {
    1: { layout: [3, 4], time: 60 },
    2: { layout: [4, 4], time: 80 },
    3: { layout: [4, 5], time: 100 },
    4: { layout: [5, 6], time: 150 },
    5: { layout: [6, 6], time: 180 }
};
const MAX_LEVEL = 5;

// --- 游戏状态变量 ---
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let currentLevel = 1;
let matchedPairs = 0;
let totalPairs = 0;
let timerInterval = null; // 用于存储计时器

// --- 事件监听 ---
restartBtn.addEventListener('click', () => {
    // 如果按钮是“下一关”，则增加等级
    if (restartBtn.textContent === 'next level') {
        currentLevel++;
    }
    // 如果是“再试一次”，则保持当前等级
    // 如果是“重新开始”，也保持当前等级
    startGame();
});

// --- 核心函数 ---

function startGame() {
    // 1. 初始化UI
    levelDisplay.textContent = currentLevel;
    restartBtn.textContent = 'restart';
    gameMessage.classList.add('hidden'); // 隐藏消息
    gameBoard.innerHTML = ''; // 清空棋盘

    // 2. 重置状态
    resetBoardState();

    // 3. 获取关卡配置
    const config = levels[currentLevel];
    const [rows, cols] = config.layout;
    totalPairs = (rows * cols) / 2;

    // 4. 准备卡片符号
    const symbolsForLevel = allSymbols.slice(0, totalPairs);
    let cardSymbols = [...symbolsForLevel, ...symbolsForLevel];
    shuffle(cardSymbols);

    // 5. 创建棋盘并启动计时器
    createBoard(rows, cols, cardSymbols);
    startTimer(config.time);
}

function createBoard(rows, cols, symbols) {
    const boardWidth = 420;
    const gap = 10;
    const cardSize = (boardWidth - (cols - 1) * gap) / cols;

    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${rows}, ${cardSize}px)`;
    gameBoard.style.width = `${boardWidth}px`;

    document.documentElement.style.setProperty('--card-size', `${cardSize}px`);
    document.documentElement.style.setProperty('--symbol-size', `${cardSize * 0.6}px`);

    symbols.forEach(symbol => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.symbol = symbol;
        card.innerHTML = `
            <div class="card-face card-back">?</div>
            <div class="card-face card-front">${symbol}</div>
        `;
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function flipCard() {
    if (lockBoard || this === firstCard || this.classList.contains('is-flipped')) {
        return;
    }
    this.classList.add('is-flipped');
    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
    } else {
        secondCard = this;
        checkForMatch();
    }
}

function checkForMatch() {
    const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;
    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    matchedPairs++;
    if (matchedPairs === totalPairs) {
        // --- 胜利逻辑 ---
        stopTimer();
        gameMessage.textContent = 'you win!';
        gameMessage.classList.remove('hidden');

        if (currentLevel < MAX_LEVEL) {
            restartBtn.textContent = 'next level';
        } else {
            restartBtn.textContent = 'you made it!';
            restartBtn.disabled = true;
        }
    }

    resetFlipState();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        if (firstCard) firstCard.classList.remove('is-flipped');
        if (secondCard) secondCard.classList.remove('is-flipped');
        resetFlipState();
    }, 1000);
}

function resetFlipState() {
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
}

function resetBoardState() {
    resetFlipState();
    matchedPairs = 0;
    totalPairs = 0;
    stopTimer();
}

// --- 计时器相关函数 ---

/**
 * 开始倒计时
 * @param {number} duration - 倒计时的总秒数
 */
function startTimer(duration) {
    let timeLeft = duration;

    // 更新一次初始显示
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;

    timerInterval = setInterval(() => {
        timeLeft--;
        const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const secs = String(timeLeft % 60).padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;

        if (timeLeft <= 0) {
            // --- 时间到，游戏失败 ---
            stopTimer();
            gameOver();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

/**
 * 游戏失败处理函数
 */
function gameOver() {
    lockBoard = true; // 锁定棋盘，禁止再点击
    gameMessage.textContent = 'time over!';
    gameMessage.classList.remove('hidden');
    restartBtn.textContent = 'try again';
}


// --- 游戏启动 ---
startGame();