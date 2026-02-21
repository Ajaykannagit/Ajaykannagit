const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('game-over');
const pauseScreen = document.getElementById('pause-screen');

// Game constants
const GRID_SIZE = 20;
let width, height, rows, cols;
let snake = [];
let food = null;
let direction = 'right';
let nextDirection = 'right';
let gameLoop = null;
let score = 0;
let highScore = localStorage.getItem('snake-high-score') || 0;
let speed = 150;
let isPaused = false;
let isAI = false;
let particles = [];
let activePowerUp = null;
let powerUpTimer = 0;

highScoreElement.textContent = String(highScore).padStart(4, '0');

function resize() {
    const parent = canvas.parentElement;
    width = canvas.width = parent.clientWidth;
    height = canvas.height = parent.clientHeight;
    cols = Math.floor(width / GRID_SIZE);
    rows = Math.floor(height / GRID_SIZE);
}

window.addEventListener('resize', resize);
resize();

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.alpha = 1;
        this.color = color;
        this.decay = Math.random() * 0.05 + 0.02;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function initGame() {
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    speed = 150;
    updateScore();
    spawnFood();
    overlay.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    menu.classList.add('hidden');
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, speed);
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
        type: Math.random() > 0.9 ? 'special' : 'normal'
    };
    // Ensure food doesn't spawn on snake
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        spawnFood();
    }
}

function updateScore() {
    scoreElement.textContent = String(score).padStart(4, '0');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake-high-score', highScore);
        highScoreElement.textContent = String(highScore).padStart(4, '0');
    }
}

function update() {
    if (isPaused) return;

    if (isAI) runAI();

    direction = nextDirection;
    const head = { ...snake[0] };

    if (direction === 'right') head.x++;
    if (direction === 'left') head.x--;
    if (direction === 'up') head.y--;
    if (direction === 'down') head.y++;

    // Ghost through walls or die? Cyberpunk edition: Loop through
    if (head.x < 0) head.x = cols - 1;
    if (head.x >= cols) head.x = 0;
    if (head.y < 0) head.y = rows - 1;
    if (head.y >= rows) head.y = 0;

    // Check collision with self
    if (snake.some((segment, index) => index !== 0 && segment.x === head.x && segment.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    // Check collision with food
    if (head.x === food.x && head.y === food.y) {
        score += food.type === 'special' ? 50 : 10;
        updateScore();
        createExplosion(head.x * GRID_SIZE + GRID_SIZE/2, head.y * GRID_SIZE + GRID_SIZE/2, '#00F0FF');
        spawnFood();
        
        // Increase speed
        if (speed > 50) {
            speed -= 2;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, speed);
        }
    } else {
        snake.pop();
    }

    draw();
}

function runAI() {
    const head = snake[0];
    if (head.x < food.x && direction !== 'left') nextDirection = 'right';
    else if (head.x > food.x && direction !== 'right') nextDirection = 'left';
    else if (head.y < food.y && direction !== 'up') nextDirection = 'down';
    else if (head.y > food.y && direction !== 'down') nextDirection = 'up';
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, height);
        ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(width, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw Food
    const foodX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const foodY = food.y * GRID_SIZE + GRID_SIZE / 2;
    ctx.fillStyle = food.type === 'special' ? '#7F00FF' : '#00F0FF';
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(foodX, foodY, GRID_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake
    snake.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;
        const alpha = 1 - (index / snake.length) * 0.6;
        
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        if (index === 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00F0FF';
        }
        
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Particles
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
}

function gameOver() {
    clearInterval(gameLoop);
    gameLoop = null;
    overlay.classList.remove('hidden');
    gameOverScreen.classList.remove('hidden');
}

// Input Handling
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (direction !== 'down') nextDirection = 'up';
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (direction !== 'up') nextDirection = 'down';
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (direction !== 'right') nextDirection = 'left';
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (direction !== 'left') nextDirection = 'right';
    } else if (e.key === 'Escape') {
        togglePause();
    }
});

function togglePause() {
    if (!gameLoop && !gameOverScreen.classList.contains('hidden')) return;
    isPaused = !isPaused;
    if (isPaused) {
        overlay.classList.remove('hidden');
        pauseScreen.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
        pauseScreen.classList.add('hidden');
    }
}

document.getElementById('start-btn').addEventListener('click', () => {
    isAI = false;
    initGame();
});

document.getElementById('ai-btn').addEventListener('click', () => {
    isAI = true;
    initGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    initGame();
});

document.getElementById('resume-btn').addEventListener('click', () => {
    togglePause();
});

// Touch support for mobile
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, false);

canvas.addEventListener('touchmove', e => {
    if (!touchStartX || !touchStartY) return;
    let dx = touchStartX - e.touches[0].clientX;
    let dy = touchStartY - e.touches[0].clientY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction !== 'right') nextDirection = 'left';
        else if (dx < 0 && direction !== 'left') nextDirection = 'right';
    } else {
        if (dy > 0 && direction !== 'down') nextDirection = 'up';
        else if (dy < 0 && direction !== 'up') nextDirection = 'down';
    }
    touchStartX = 0;
    touchStartY = 0;
}, false);
