const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('game-over');
const pauseScreen = document.getElementById('pause-screen');
const livesContainer = document.getElementById('lives-container');

// Configuration
const TILE_SIZE = 24;
const FPS = 60;
const PACMAN_SPEED = 3;
const GHOST_SPEED = 2.5;

let score = 0;
let highScore = localStorage.getItem('pacman-high-score') || 0;
let lives = 3;
let gameState = 'MENU'; // MENU, PLAYING, PAUSED, GAME_OVER

// Maze Layout (0: Ghost House, 1: Wall, 2: Pellet, 3: Power Pellet, 4: Empty)
// Horizontal wide layout
const ORIGINAL_MAZE = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 3, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 3, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 4, 1, 4, 1, 1, 1, 1, 1, 4, 1, 4, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1],
    [4, 4, 4, 4, 1, 2, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 2, 1, 4, 4, 4, 4, 4],
    [1, 1, 1, 1, 1, 2, 1, 4, 1, 1, 1, 0, 0, 0, 1, 1, 4, 1, 1, 0, 0, 0, 1, 1, 4, 1, 2, 1, 1, 1, 1, 1],
    [4, 4, 4, 4, 4, 2, 4, 4, 1, 4, 4, 0, 0, 0, 4, 4, 4, 4, 4, 0, 0, 0, 4, 1, 4, 4, 2, 4, 4, 4, 4, 4],
    [1, 1, 1, 1, 1, 2, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 4, 1, 2, 1, 1, 1, 1, 1],
    [4, 4, 4, 4, 1, 2, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 2, 1, 4, 4, 4, 4, 4],
    [1, 1, 1, 1, 1, 2, 1, 4, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 3, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 3, 1],
    [1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

let maze = [];
const MAP_WIDTH = ORIGINAL_MAZE[0].length * TILE_SIZE;
const MAP_HEIGHT = ORIGINAL_MAZE.length * TILE_SIZE;

canvas.width = MAP_WIDTH;
canvas.height = MAP_HEIGHT;

function updateLivesDisplay() {
    livesContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const life = document.createElement('div');
        life.className = 'life-icon';
        livesContainer.appendChild(life);
    }
}

class Pacman {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = 16 * TILE_SIZE + TILE_SIZE / 2;
        this.y = 15 * TILE_SIZE + TILE_SIZE / 2;
        this.dir = { x: 0, y: 0 };
        this.nextDir = { x: 0, y: 0 };
        this.radius = TILE_SIZE / 2.5;
        this.mouthOpen = 0;
        this.mouthSpeed = 0.15;
        this.rotation = 0;
    }
    update() {
        // Try next direction if available
        if (this.canMove(this.nextDir)) {
            this.dir = this.nextDir;
        }

        if (this.canMove(this.dir)) {
            this.x += this.dir.x * PACMAN_SPEED;
            this.y += this.dir.y * PACMAN_SPEED;

            // Mouth animation
            this.mouthOpen += this.mouthSpeed;
            if (this.mouthOpen > 0.25 || this.mouthOpen < 0) this.mouthSpeed *= -1;

            // Rotation based on direction
            if (this.dir.x === 1) this.rotation = 0;
            if (this.dir.x === -1) this.rotation = Math.PI;
            if (this.dir.y === 1) this.rotation = Math.PI / 2;
            if (this.dir.y === -1) this.rotation = -Math.PI / 2;
        }

        // Pellet collision
        const gridX = Math.floor(this.x / TILE_SIZE);
        const gridY = Math.floor(this.y / TILE_SIZE);
        if (maze[gridY][gridX] === 2) {
            maze[gridY][gridX] = 4;
            score += 10;
            updateScore();
        } else if (maze[gridY][gridX] === 3) {
            maze[gridY][gridX] = 4;
            score += 50;
            updateScore();
            ghosts.forEach(g => g.makeFrightened());
        }
    }
    canMove(dir) {
        if (dir.x === 0 && dir.y === 0) return true;
        const nextX = this.x + dir.x * (TILE_SIZE / 2 + 1);
        const nextY = this.y + dir.y * (TILE_SIZE / 2 + 1);
        const gx = Math.floor(nextX / TILE_SIZE);
        const gy = Math.floor(nextY / TILE_SIZE);
        return ORIGINAL_MAZE[gy][gx] !== 1 && ORIGINAL_MAZE[gy][gx] !== 0;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.fillStyle = '#FFFF00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFFF00';

        ctx.beginPath();
        const startAngle = this.mouthOpen * Math.PI;
        const endAngle = (2 - this.mouthOpen) * Math.PI;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.radius, startAngle, endAngle);
        ctx.fill();
        ctx.restore();
    }
}

class Ghost {
    constructor(x, y, color, type) {
        this.startX = x * TILE_SIZE + TILE_SIZE / 2;
        this.startY = y * TILE_SIZE + TILE_SIZE / 2;
        this.color = color;
        this.type = type; // blinky, pinky, inky, clyde
        this.reset();
    }
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.dir = { x: 0, y: -1 };
        this.frightened = false;
        this.frightenedTimer = 0;
        this.speed = GHOST_SPEED;
    }
    makeFrightened() {
        this.frightened = true;
        this.frightenedTimer = 300;
        this.speed = GHOST_SPEED * 0.6;
    }
    update() {
        if (this.frightened) {
            this.frightenedTimer--;
            if (this.frightenedTimer <= 0) {
                this.frightened = false;
                this.speed = GHOST_SPEED;
            }
        }

        // AI Pathfinding Logic (BFS simplified)
        if (Math.abs(this.x % TILE_SIZE - TILE_SIZE / 2) < 2 && Math.abs(this.y % TILE_SIZE - TILE_SIZE / 2) < 2) {
            const gx = Math.floor(this.x / TILE_SIZE);
            const gy = Math.floor(this.y / TILE_SIZE);
            this.dir = this.getBestDir(gx, gy);
        }

        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;

        // Collision with Pacman
        const dist = Math.hypot(this.x - pacman.x, this.y - pacman.y);
        if (dist < TILE_SIZE / 1.5) {
            if (this.frightened) {
                score += 200;
                updateScore();
                this.reset();
            } else {
                handlePacmanDeath();
            }
        }
    }
    getBestDir(gx, gy) {
        const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        const validDirs = dirs.filter(d => {
            if (d.x === -this.dir.x && d.y === -this.dir.y) return false;
            const val = ORIGINAL_MAZE[gy + d.y][gx + d.x];
            return val !== 1;
        });

        if (validDirs.length === 0) return { x: -this.dir.x, y: -this.dir.y };

        let targetX = pacman.x / TILE_SIZE;
        let targetY = pacman.y / TILE_SIZE;

        if (this.frightened) {
            // Run to corners
            targetX = 0; targetY = 0;
        } else if (this.type === 'pinky') {
            targetX += pacman.dir.x * 4;
            targetY += pacman.dir.y * 4;
        }

        return validDirs.reduce((best, curr) => {
            const d1 = Math.hypot(gx + best.x - targetX, gy + best.y - targetY);
            const d2 = Math.hypot(gx + curr.x - targetX, gy + curr.y - targetY);
            return d1 < d2 ? best : curr;
        });
    }
    draw() {
        ctx.save();
        const bodyColor = this.frightened ? '#0000FF' : this.color;
        ctx.fillStyle = bodyColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = bodyColor;

        ctx.beginPath();
        const r = TILE_SIZE / 2.5;
        // Head
        ctx.arc(this.x, this.y - 2, r, Math.PI, 0);
        // Body
        ctx.lineTo(this.x + r, this.y + r);
        // Wavy bottom
        for (let i = 0; i < 3; i++) {
            ctx.quadraticCurveTo(this.x + r - (i * 2 + 1) * r / 3, this.y + r + 4, this.x + r - (i + 1) * 2 * r / 3, this.y + r);
        }
        ctx.lineTo(this.x - r, this.y - 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const pacman = new Pacman();
const ghosts = [
    new Ghost(11, 8, '#FF0000', 'blinky'),
    new Ghost(12, 8, '#FFB8FF', 'pinky'),
    new Ghost(13, 8, '#00FFFF', 'inky'),
    new Ghost(14, 8, '#FFB852', 'clyde')
];

function updateScore() {
    scoreElement.textContent = String(score).padStart(5, '0');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pacman-high-score', highScore);
        highScoreElement.textContent = String(highScore).padStart(5, '0');
    }
}

function handlePacmanDeath() {
    lives--;
    updateLivesDisplay();
    if (lives <= 0) {
        gameState = 'GAME_OVER';
        gameOverScreen.classList.remove('hidden');
        overlay.classList.remove('hidden');
    } else {
        pacman.reset();
        ghosts.forEach(g => g.reset());
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Maze Walls
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00F0FF';

    for (let r = 0; r < maze.length; r++) {
        for (let c = 0; c < maze[r].length; c++) {
            if (maze[r][c] === 1) {
                ctx.strokeRect(c * TILE_SIZE + 4, r * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if (maze[r][c] === 2) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (maze[r][c] === 3) {
                ctx.fillStyle = '#39FF14';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#39FF14';
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
    ctx.shadowBlur = 0;

    pacman.draw();
    ghosts.forEach(g => g.draw());
}

function loop() {
    if (gameState === 'PLAYING') {
        pacman.update();
        ghosts.forEach(g => g.update());
        draw();
    }
    requestAnimationFrame(loop);
}

// Input
window.addEventListener('keydown', e => {
    const keys = {
        'ArrowUp': { x: 0, y: -1 }, 'w': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 }, 's': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 }, 'a': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 }, 'd': { x: 1, y: 0 }
    };
    if (keys[e.key]) {
        pacman.nextDir = keys[e.key];
        if (gameState === 'MENU') startGame();
    }
    if (e.key === 'Escape') togglePause();
});

function startGame() {
    maze = ORIGINAL_MAZE.map(row => [...row]);
    score = 0;
    lives = 3;
    updateScore();
    updateLivesDisplay();
    pacman.reset();
    ghosts.forEach(g => g.reset());
    gameState = 'PLAYING';
    overlay.classList.add('hidden');
    menu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        overlay.classList.remove('hidden');
        pauseScreen.classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        overlay.classList.add('hidden');
        pauseScreen.classList.add('hidden');
    }
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('resume-btn').addEventListener('click', togglePause);

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
        if (dx > 0) pacman.nextDir = { x: -1, y: 0 };
        else pacman.nextDir = { x: 1, y: 0 };
    } else {
        if (dy > 0) pacman.nextDir = { x: 0, y: -1 };
        else pacman.nextDir = { x: 0, y: 1 };
    }
    if (gameState === 'MENU') startGame();
    touchStartX = 0;
    touchStartY = 0;
    e.preventDefault();
}, false);

updateLivesDisplay();
draw();
loop();
