/**
 * game.js
 * "Mind Guard" — Interactive Canvas Game
 * Challenge Feature: Embedded Widget (interactive game)
 *
 * How to play:
 *   Move the brain character left and right using the arrow keys
 *   or A / D keys (keyboard), or tap/click the on-screen buttons.
 *   Catch the GOOD items (green, positive habits) to gain points.
 *   Avoid the BAD items (red, harmful digital habits) — each hit
 *   reduces your mental health bar. The game ends when it reaches 0.
 *
 * Items:
 *   Good  (+10 pts each): 📚 Reading, 🏃 Exercise, 😴 Sleep, 🤝 Friends, 🎨 Creativity
 *   Bad   (-1 health):    📱 Doomscrolling, 💬 Cyberbullying, 🎮 Gaming excess, 😰 FOMO, 🌙 Late night screen
 */

(function () {
    'use strict';

    /* ----------------------------------------------------------
       Canvas & Context Setup
       ---------------------------------------------------------- */
    const canvas  = document.getElementById('game-canvas');
    if (!canvas) return; // Safety check — only run on game.html

    const ctx     = canvas.getContext('2d');
    const W       = canvas.width  = 640;
    const H       = canvas.height = 420;

    /* ----------------------------------------------------------
       Game State
       ---------------------------------------------------------- */
    let score      = 0;
    let health     = 5;
    let level      = 1;
    let gameOver   = false;
    let started    = false;
    let frameCount = 0;
    let animId     = null;

    /* Player object */
    const player = {
        x: W / 2 - 28,
        y: H - 90,
        w: 56,
        h: 56,
        speed: 6,
        emoji: '🧠',
        movingLeft: false,
        movingRight: false
    };

    /* Falling items pool */
    let items = [];

    /* Item definitions */
    const GOOD_ITEMS = [
        { emoji: '📚', label: 'Reading',      points: 10 },
        { emoji: '🏃', label: 'Exercise',     points: 10 },
        { emoji: '😴', label: 'Good Sleep',   points: 10 },
        { emoji: '🤝', label: 'Friends',      points: 10 },
        { emoji: '🎨', label: 'Creativity',   points: 10 }
    ];

    const BAD_ITEMS = [
        { emoji: '📵', label: 'Doomscrolling',      damage: 1 },
        { emoji: '😤', label: 'Cyberbullying',       damage: 1 },
        { emoji: '🎮', label: 'Excessive Gaming',    damage: 1 },
        { emoji: '😰', label: 'FOMO',                damage: 1 },
        { emoji: '🌙', label: 'Late-night Screen',   damage: 1 }
    ];

    /* HUD element references */
    const scoreEl  = document.getElementById('hud-score');
    const healthEl = document.getElementById('hud-health');
    const levelEl  = document.getElementById('hud-level');

    /* Message overlay */
    const msgOverlay   = document.getElementById('game-message');
    const msgTitle     = document.getElementById('msg-title');
    const msgBody      = document.getElementById('msg-body');
    const msgBtn       = document.getElementById('msg-btn');

    /* ----------------------------------------------------------
       Input Handling (Keyboard)
       ---------------------------------------------------------- */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') player.movingLeft  = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.movingRight = true;
        if ((e.key === ' ' || e.key === 'Enter') && !started) startGame();
    });

    document.addEventListener('keyup', function (e) {
        if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') player.movingLeft  = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') player.movingRight = false;
    });

    /* On-screen touch / click buttons */
    const btnLeft  = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    if (btnLeft && btnRight) {
        btnLeft.addEventListener('mousedown',  function () { player.movingLeft  = true; });
        btnLeft.addEventListener('mouseup',    function () { player.movingLeft  = false; });
        btnLeft.addEventListener('touchstart', function (e) { e.preventDefault(); player.movingLeft  = true; });
        btnLeft.addEventListener('touchend',   function ()  { player.movingLeft  = false; });

        btnRight.addEventListener('mousedown',  function () { player.movingRight = true; });
        btnRight.addEventListener('mouseup',    function () { player.movingRight = false; });
        btnRight.addEventListener('touchstart', function (e) { e.preventDefault(); player.movingRight = true; });
        btnRight.addEventListener('touchend',   function ()  { player.movingRight = false; });
    }

    /* ----------------------------------------------------------
       Helper: Spawn a Falling Item
       ---------------------------------------------------------- */
    function spawnItem() {
        const isGood  = Math.random() > 0.45; // 55% chance of bad item (more challenge)
        const pool    = isGood ? GOOD_ITEMS : BAD_ITEMS;
        const def     = pool[Math.floor(Math.random() * pool.length)];
        const baseSpd = 2.5 + (level - 1) * 0.6;

        items.push({
            x:      Math.random() * (W - 44) + 4,
            y:      -48,
            w:      40,
            h:      40,
            speed:  baseSpd + Math.random() * 1.2,
            isGood: isGood,
            emoji:  def.emoji,
            label:  def.label,
            points: def.points  || 0,
            damage: def.damage  || 0,
            hit:    false,       // flicker on catch
            alpha:  1
        });
    }

    /* ----------------------------------------------------------
       Helper: Update HUD
       ---------------------------------------------------------- */
    function updateHUD() {
        if (scoreEl)  scoreEl.textContent  = score;
        if (healthEl) healthEl.textContent = '❤️'.repeat(Math.max(health, 0));
        if (levelEl)  levelEl.textContent  = level;
    }

    /* ----------------------------------------------------------
       Helper: Show Overlay Message
       ---------------------------------------------------------- */
    function showMessage(title, body, btnText) {
        if (!msgOverlay) return;
        msgTitle.textContent = title;
        msgBody.textContent  = body;
        msgBtn.textContent   = btnText;
        msgOverlay.style.display = 'flex';
    }

    function hideMessage() {
        if (msgOverlay) msgOverlay.style.display = 'none';
    }

    /* ----------------------------------------------------------
       Game Start / Restart
       ---------------------------------------------------------- */
    function startGame() {
        score      = 0;
        health     = 5;
        level      = 1;
        gameOver   = false;
        started    = true;
        frameCount = 0;
        items      = [];
        player.x   = W / 2 - 28;
        player.movingLeft  = false;
        player.movingRight = false;

        hideMessage();
        updateHUD();

        if (animId) cancelAnimationFrame(animId);
        loop();
    }

    if (msgBtn) {
        msgBtn.addEventListener('click', startGame);
    }

    /* ----------------------------------------------------------
       Collision Detection (AABB)
       ---------------------------------------------------------- */
    function collides(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    }

    /* ----------------------------------------------------------
       Draw Gradient Background
       ---------------------------------------------------------- */
    function drawBackground() {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1B2A4A');
        grad.addColorStop(1, '#253A63');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        /* Subtle star-like dots */
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let i = 0; i < 40; i++) {
            const sx = (Math.sin(i * 137.5 + frameCount * 0.003) * 0.5 + 0.5) * W;
            const sy = (Math.cos(i * 97.3 + frameCount * 0.002) * 0.5 + 0.5) * H;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /* ----------------------------------------------------------
       Draw Player
       ---------------------------------------------------------- */
    function drawPlayer() {
        ctx.font = '44px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.emoji, player.x + player.w / 2, player.y + player.h / 2);

        /* Glow effect under player */
        ctx.save();
        ctx.globalAlpha = 0.18;
        const glow = ctx.createRadialGradient(
            player.x + player.w / 2, player.y + player.h,
            0,
            player.x + player.w / 2, player.y + player.h,
            40
        );
        glow.addColorStop(0, '#38B2AC');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(player.x - 20, player.y + player.h - 8, player.w + 40, 24);
        ctx.restore();
    }

    /* ----------------------------------------------------------
       Draw Items
       ---------------------------------------------------------- */
    function drawItems() {
        items.forEach(function (item) {
            ctx.save();
            ctx.globalAlpha = item.alpha;

            /* Background circle */
            ctx.beginPath();
            ctx.arc(item.x + item.w / 2, item.y + item.h / 2, item.w / 2 + 4, 0, Math.PI * 2);
            ctx.fillStyle = item.isGood ? 'rgba(56,161,105,0.25)' : 'rgba(229,62,62,0.25)';
            ctx.fill();

            /* Emoji */
            ctx.font = '28px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.emoji, item.x + item.w / 2, item.y + item.h / 2);

            ctx.restore();
        });
    }

    /* ----------------------------------------------------------
       Draw Score Popup (brief label flash on catch)
       ---------------------------------------------------------- */
    let popups = [];

    function addPopup(x, y, text, color) {
        popups.push({ x: x, y: y, text: text, color: color, life: 55 });
    }

    function drawPopups() {
        popups.forEach(function (p) {
            ctx.save();
            ctx.globalAlpha = p.life / 55;
            ctx.fillStyle = p.color;
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y - (55 - p.life) * 0.6);
            ctx.restore();
            p.life--;
        });
        popups = popups.filter(function (p) { return p.life > 0; });
    }

    /* ----------------------------------------------------------
       Draw Divider Line
       ---------------------------------------------------------- */
    function drawGround() {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, player.y + player.h + 12);
        ctx.lineTo(W, player.y + player.h + 12);
        ctx.stroke();
    }

    /* ----------------------------------------------------------
       Draw Health Bar at Bottom
       ---------------------------------------------------------- */
    function drawHealthBar() {
        const barW = 180;
        const barH = 10;
        const barX = W / 2 - barW / 2;
        const barY = H - 22;
        const fill = (health / 5) * barW;

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        roundRect(ctx, barX, barY, barW, barH, 5);
        ctx.fill();

        ctx.fillStyle = health >= 3 ? '#38A169' : health === 2 ? '#D69E2E' : '#E53E3E';
        roundRect(ctx, barX, barY, Math.max(fill, 0), barH, 5);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Mental Health', W / 2, barY - 4);
    }

    /* Utility: rounded rect path */
    function roundRect(context, x, y, w, h, r) {
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + w - r, y);
        context.quadraticCurveTo(x + w, y, x + w, y + r);
        context.lineTo(x + w, y + h - r);
        context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        context.lineTo(x + r, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
    }

    /* ----------------------------------------------------------
       Main Game Loop
       ---------------------------------------------------------- */
    function loop() {
        frameCount++;

        /* Spawn items — frequency increases with level */
        const spawnRate = Math.max(55 - level * 6, 22);
        if (frameCount % spawnRate === 0) spawnItem();

        /* Level up every 100 points */
        const newLevel = Math.floor(score / 100) + 1;
        if (newLevel > level) {
            level = newLevel;
            updateHUD();
        }

        /* --- Update Player Position --- */
        if (player.movingLeft)  player.x -= player.speed;
        if (player.movingRight) player.x += player.speed;
        player.x = Math.max(0, Math.min(W - player.w, player.x));

        /* --- Update Items --- */
        items.forEach(function (item) {
            item.y += item.speed;
        });

        /* --- Collision Detection --- */
        items.forEach(function (item) {
            if (!item.hit && collides(player, item)) {
                item.hit = true;
                if (item.isGood) {
                    score += item.points;
                    addPopup(item.x + 20, item.y, '+' + item.points, '#38B2AC');
                } else {
                    health = Math.max(0, health - item.damage);
                    addPopup(item.x + 20, item.y, item.label + '!', '#E53E3E');
                }
                updateHUD();
            }
        });

        /* Remove off-screen or caught items */
        items = items.filter(function (item) {
            return item.y < H + 50 && !item.hit;
        });

        /* --- Check Game Over --- */
        if (health <= 0 && !gameOver) {
            gameOver = true;
            showMessage(
                '🧠 Mind Overloaded!',
                'Your mental health reached zero. Digital habits have a real impact! Final score: ' + score + '. Press "Play Again" to try once more.',
                'Play Again'
            );
        }

        /* --- Draw Everything --- */
        drawBackground();
        drawGround();
        drawItems();
        drawPlayer();
        drawPopups();
        drawHealthBar();

        if (!gameOver) {
            animId = requestAnimationFrame(loop);
        }
    }

    /* ----------------------------------------------------------
       Show initial "press start" screen
       ---------------------------------------------------------- */
    showMessage(
        '🧠 Mind Guard',
        'Catch the good habits (📚 🏃 😴 🤝 🎨) and avoid the harmful digital habits (📵 😤 🎮 😰 🌙). Use ← → arrow keys or the on-screen buttons.',
        'Start Game'
    );

    /* Draw static background while on start screen */
    drawBackground();

    /* Expose startGame so external button can call it */
    window.mindGuardStart = startGame;

})();
