const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// sprites
const playerImg = new Image();
playerImg.src = "assets/img/isaac.png";

const enemyImg = new Image();
enemyImg.src = "assets/img/ennemi.png";

const projectileImg = new Image();
projectileImg.src = "assets/img/larme.png";

const bonusImg = new Image();
bonusImg.src = "assets/img/bonus.png";

// Variables globales
let player = {
    x: canvas.width / 2 - 20,
    y: canvas.height / 2 - 20,
    width: 100,
    height: 120,
    speed: 5,
    health: 100
};

let enemies = [
    { x: 100, y: 100, width: 90, height: 110, speed: 1.5, health: 20 },
    { x: 700, y: 100, width: 90, height: 110, speed: 1.5, health: 20 }
];

let projectiles = [];
let bonuses = [];
let keys = {};
let isGameOver = false;
let isPaused = false;
let animationFrameId;
let score = 0;

// controle
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;

    if (e.key === "z") shootProjectile(0, -10); // Haut
    if (e.key === "s") shootProjectile(0, 10);  // Bas
    if (e.key === "q") shootProjectile(-10, 0); // Gauche
    if (e.key === "d") shootProjectile(10, 0);  // Droite

    if (e.key === "p") togglePause(); // Pause
});

window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// Déplacer le joueur
function movePlayer() {
    if (keys["i"] && player.y > 0) player.y -= player.speed;
    if (keys["k"] && player.y + player.height < canvas.height) player.y += player.speed;
    if (keys["j"] && player.x > 0) player.x -= player.speed;
    if (keys["l"] && player.x + player.width < canvas.width) player.x += player.speed;
}

// mouvement des ennemis
function moveEnemies() {
    enemies.forEach((enemy) => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
    });
}

// Tirer un projectile
function shootProjectile(dx, dy) {
    projectiles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        width: 10,
        height: 10,
        dx: dx,
        dy: dy
    });
}

// mouvement des projectiles
function moveProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.dx;
        projectile.y += projectile.dy;
        if (projectile.x < 0 || projectile.x > canvas.width || projectile.y < 0 || projectile.y > canvas.height) {
            projectiles.splice(index, 1);
        }
    });
}

function drawSprite(img, obj) {
    ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
}

// Barre de santé
function drawHealthBar(obj, health, maxHealth) {
    ctx.fillStyle = "red";
    ctx.fillRect(obj.x, obj.y - 10, obj.width, 5);
    ctx.fillStyle = "green";
    ctx.fillRect(obj.x, obj.y - 10, (health / maxHealth) * obj.width, 5);
}

// Détecter collision
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Gérer les collisions
function handleCollisions() {
    projectiles.forEach((projectile, pIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (isColliding(projectile, enemy)) {
                enemy.health -= 10;
                projectiles.splice(pIndex, 1);

                if (enemy.health <= 0) {
                    enemies.splice(eIndex, 1);
                    score += 1;
                    spawnEnemy();
                    if (Math.random() < 0.3) spawnBonus(); // Chance de faire apparaître un bonus
                }
            }
        });
    });

    enemies.forEach((enemy) => {
        if (isColliding(player, enemy)) {
            player.health -= 1;
            if (player.health <= 0) gameOver();
        }
    });

    bonuses.forEach((bonus, bIndex) => {
        if (isColliding(player, bonus)) {
            bonuses.splice(bIndex, 1);
            activateBonus();
        }
    });
}

// Faire apparaître un ennemi
function spawnEnemy() {
    let enemy;
    do {
        enemy = {
            x: Math.random() * (canvas.width - 130),
            y: Math.random() * (canvas.height - 150),
            width: 90,
            height: 110,
            speed: 1.5 + score * 0.05,
            health: 20 + score * 2
        };
    } while (isColliding(enemy, player));
    enemies.push(enemy);
}

// Faire apparaître un bonus
function spawnBonus() {
    bonuses.push({
        x: Math.random() * (canvas.width - 30),
        y: Math.random() * (canvas.height - 30),
        width: 60,
        height: 60
    });
}

function activateBonus() {
    player.speed += 2;
    setTimeout(() => (player.speed -= 2), 5000); // Bonus temporaire
}

// mettre la pause
function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) gameLoop();
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    alert("Game Over! Score: " + score);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSprite(playerImg, player);
    drawHealthBar(player, player.health, 100);
    enemies.forEach((enemy) => {
        drawSprite(enemyImg, enemy);
        drawHealthBar(enemy, enemy.health, 20 + score * 2);
    });
    projectiles.forEach((projectile) => drawSprite(projectileImg, projectile));
    bonuses.forEach((bonus) => drawSprite(bonusImg, bonus));

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Health: " + player.health, 10, 50);
}

// Boucle principale
function gameLoop() {
    if (!isPaused && !isGameOver) {
        movePlayer();
        moveEnemies();
        moveProjectiles();
        handleCollisions();
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Démarrer le jeu
document.getElementById("start-game").addEventListener("click", () => {
    if (isGameOver) resetGame();
    else gameLoop();
});

// Réinitialiser le jeu
function resetGame() {
    player = { ...player, x: canvas.width / 2 - 20, y: canvas.height / 2 - 20, health: 100 };
    enemies = [
        { x: 100, y: 100, width: 90, height: 110, speed: 1.5, health: 20 },
        { x: 700, y: 100, width: 90, height: 110, speed: 1.5, health: 20 }
    ];
    projectiles = [];
    bonuses = [];
    score = 0;
    isGameOver = false;
    isPaused = false;
    gameLoop();
}