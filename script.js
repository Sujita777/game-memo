// ============================
// GAME SETTINGS
// ============================
const TILE = 40;
const ROWS = 12;
const COLS = 12;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

// ============================
// GAME STATE
// ============================
let player;
let enemies;
let bombs;
let explosions;
let map;

// ============================
// INITIALIZE GAME
// ============================
function initGame() {
    player = { x: 1, y: 1, alive: true };
    bombs = [];
    explosions = [];
    enemies = [];
    map = [];

    generateMap();
    statusText.textContent = "";
}

function generateMap() {
    for (let y = 0; y < ROWS; y++) {
        map[y] = [];
        for (let x = 0; x < COLS; x++) {
            if (y === 0 || y === ROWS-1 || x === 0 || x === COLS-1) map[y][x] = 1; // wall
            else if (Math.random() < 0.22) map[y][x] = 2; // crate
            else map[y][x] = 0;
        }
    }

    // Safe starting area
    map[1][1] = map[1][2] = map[2][1] = 0;

    spawnEnemies(4);
}

function spawnEnemies(count) {
    while(enemies.length < count) {
        let x = Math.floor(Math.random() * COLS);
        let y = Math.floor(Math.random() * ROWS);
        if (map[y][x] === 0 && !(x===1 && y===1)) enemies.push({ x, y, dir: null });
    }
}

// ============================
// DRAWING
// ============================
function drawTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
    ctx.strokeStyle = "#111";
    ctx.strokeRect(x*TILE, y*TILE, TILE, TILE);
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let y=0;y<ROWS;y++){
        for(let x=0;x<COLS;x++){
            if(map[y][x]===1) drawTile(x,y,"#666");
            else if(map[y][x]===2) drawTile(x,y,"#b9805d");
        }
    }

    bombs.forEach(b => drawTile(b.x,b.y,"#222"));
    explosions.forEach(e => drawTile(e.x,e.y,"orange"));
    enemies.forEach(en => drawTile(en.x,en.y,"red"));
    if(player.alive) drawTile(player.x,player.y,"cyan");
}

// ============================
// PLAYER CONTROL
// ============================
function canMove(x,y){ return map[y] && map[y][x]===0; }

document.addEventListener("keydown", e => {
    if(!player.alive) return;

    let nx = player.x;
    let ny = player.y;

    if(e.key==="ArrowUp") ny--;
    if(e.key==="ArrowDown") ny++;
    if(e.key==="ArrowLeft") nx--;
    if(e.key==="ArrowRight") nx++;

    if(canMove(nx,ny)) player.x = nx, player.y = ny;
    if(e.key===" ") placeBomb();
});

// ============================
// BOMB SYSTEM
// ============================
function placeBomb(){
    if(bombs.some(b=>b.x===player.x && b.y===player.y)) return;
    bombs.push({ x: player.x, y: player.y, timer:60 });
}

function explode(bomb){
    const dirs = [{x:0,y:0},{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    dirs.forEach(d=>{
        let x = bomb.x + d.x;
        let y = bomb.y + d.y;
        if(map[y] && map[y][x]===2) map[y][x]=0;
        explosions.push({x,y,timer:20});
    });
}

// ============================
// ENEMY AI
// ============================
function enemyAI(){
    enemies.forEach(en=>{
        if(Math.random()<0.03){
            let dirs=[{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
            en.dir = dirs[Math.floor(Math.random()*dirs.length)];
        }
        if(!en.dir) return;
        let nx = en.x + en.dir.x;
        let ny = en.y + en.dir.y;
        if(canMove(nx,ny)) en.x=nx, en.y=ny;
    });
}

// ============================
// COLLISIONS
// ============================
function checkCollisions(){
    explosions.forEach(e=>{
        if(e.x===player.x && e.y===player.y){
            player.alive=false;
            statusText.textContent="💥 You Died!";
        }
    });

    explosions.forEach(e=>{
        enemies = enemies.filter(en=>!(en.x===e.x && en.y===e.y));
    });

    if(player.alive && enemies.length===0) statusText.textContent="🎉 You Win!";
}

// ============================
// GAME LOOP
// ============================
function update(){
    bombs.forEach((b,i)=>{
        b.timer--;
        if(b.timer<=0){ explode(b); bombs.splice(i,1); }
    });

    explosions.forEach((e,i)=>{
        e.timer--;
        if(e.timer<=0) explosions.splice(i,1);
    });

    if(player.alive && enemies.length>0) enemyAI();
    checkCollisions();
}

function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================
// RESTART BUTTON
// ============================
restartBtn.addEventListener("click", () => { initGame(); });

// ============================
// START GAME
// ============================
initGame();
gameLoop();
