// --- एलिमेंट्स को चुनना ---
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameArea = document.getElementById('game-area');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const pauseScreen = document.getElementById('pause-screen');
const timerBarContainer = document.getElementById('timer-bar-container');
const timerBar = document.getElementById('timer-bar');

// --- ऑडियो ---
const backgroundMusic = document.getElementById('background-music');
const explosionSound = document.getElementById('explosion-sound');
const shieldSound = document.getElementById('shield-sound');
const slowmoSound = document.getElementById('slowmo-sound');

// --- गेम की सेटिंग्स ---
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let playerSpeed = 20;
let baseMeteorSpeed = 2;
let gameIntervals = []; // सारे इंटरवल को एक जगह रखना ताकि पॉज़ कर सकें
let isGameOver = false;
let isPaused = false;

// --- पावर-अप स्टेट्स ---
let isShieldActive = false;
let isSlowMoActive = false;

// --- हाई-स्कोर दिखाना ---
document.getElementById('start-high-score').innerText = highScore;
document.getElementById('end-high-score').innerText = highScore;

// --- गेम शुरू करना ---
startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameArea.classList.remove('hidden');
    backgroundMusic.volume = 0.3;
    backgroundMusic.play();
    startGameLoop();
});

// --- कंट्रोल ---
let playerLeft = 170;
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    // पॉज़/अनपॉज़
    if (e.key.toLowerCase() === 'p') {
        togglePause();
    }
    if (isPaused) return;

    if (e.key === 'ArrowLeft' && playerLeft > 0) playerLeft -= playerSpeed;
    if (e.key === 'ArrowRight' && playerLeft < 340) playerLeft += playerSpeed;
    player.style.left = playerLeft + 'px';
});

// --- पॉज़ फंक्शन ---
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        backgroundMusic.pause();
        pauseScreen.classList.remove('hidden');
    } else {
        backgroundMusic.play();
        pauseScreen.classList.add('hidden');
    }
}

// --- एलिमेंट बनाने वाले फंक्शन ---
function createElement(className, width) {
    const element = document.createElement('div');
    element.classList.add(className);
    element.style.left = Math.random() * (400 - width) + 'px';
    element.style.top = '-60px';
    gameContainer.appendChild(element);
    return element;
}

// --- एलिमेंट को मूव करना ---
function moveElement(element, type, speed) {
    let elementTop = -60;
    let elementLeft = parseFloat(element.style.left);
    
    const interval = setInterval(() => {
        if (isPaused || isGameOver) return;

        // ट्रैकिंग मिसाइल का खास लॉजिक
        if (type === 'tracker') {
            const playerCenter = playerLeft + 30;
            const elementCenter = elementLeft + 12.5;
            if (playerCenter > elementCenter) elementLeft += 0.5;
            if (playerCenter < elementCenter) elementLeft -= 0.5;
            element.style.left = elementLeft + 'px';
        }
        
        elementTop += speed * (isSlowMoActive ? 0.4 : 1); // स्लो-मोशन का असर
        element.style.top = elementTop + 'px';

        if (elementTop > 600) {
            element.remove();
            if (type === 'meteor' || type === 'tracker') updateScore();
        } else {
            checkCollision(element, type);
        }
    }, 20);
    gameIntervals.push(interval);
}

// --- टक्कर की जाँच ---
function checkCollision(element, type) {
    if (!element.parentElement) return; // अगर एलिमेंट हट चुका है तो कुछ न करें
    const playerRect = player.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    if (
        playerRect.left < elementRect.right && playerRect.right > elementRect.left &&
        playerRect.top < elementRect.bottom && playerRect.bottom > elementRect.top
    ) {
        element.remove();
        handleCollision(type);
    }
}

// --- टक्कर होने पर क्या हो ---
function handleCollision(type) {
    if (type === 'meteor' || type === 'tracker') {
        if (isShieldActive) {
            isShieldActive = false;
            player.classList.remove('shield-active');
            hideTimerBar();
        } else {
            endGame();
        }
    } else if (type === 'shield-powerup') {
        activatePowerUp('shield', 5000);
    } else if (type === 'slowmo-powerup') {
        activatePowerUp('slowmo', 7000);
    }
}

// --- पावर-अप एक्टिवेट करना ---
function activatePowerUp(type, duration) {
    if (type === 'shield') {
        shieldSound.play();
        isShieldActive = true;
        player.classList.add('shield-active');
    } else if (type === 'slowmo') {
        slowmoSound.play();
        isSlowMoActive = true;
    }

    startTimerBar(duration);
    
    setTimeout(() => {
        if (type === 'shield') {
            isShieldActive = false;
            player.classList.remove('shield-active');
        } else if (type === 'slowmo') {
            isSlowMoActive = false;
        }
        hideTimerBar();
    }, duration);
}

// --- टाइमर बार ---
function startTimerBar(duration) {
    timerBarContainer.style.display = 'block';
    timerBar.style.transition = `width ${duration}ms linear`;
    timerBar.style.width = '100%';
    setTimeout(() => { timerBar.style.width = '0%'; }, 50);
}
function hideTimerBar() {
    if (!isShieldActive && !isSlowMoActive) {
        timerBarContainer.style.display = 'none';
        timerBar.style.transition = 'none';
    }
}

// --- स्कोर अपडेट ---
function updateScore() {
    score++;
    scoreDisplay.innerText = score;
    // हर 7 स्कोर पर रफ़्तार बढ़ाएँ
    if (score % 7 === 0) baseMeteorSpeed += 0.2;
}

// --- गेम खत्म ---
function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    gameContainer.classList.add('shake');
    explosionSound.play();
    backgroundMusic.pause();
    
    gameIntervals.forEach(clearInterval); // सारे इंटरवल रोकें

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('end-high-score').innerText = highScore;
    }
    
    finalScoreDisplay.innerText = score;
    setTimeout(() => gameOverScreen.classList.remove('hidden'), 500);
}

// --- गेम का मुख्य लूप ---
function startGameLoop() {
    const mainInterval = setInterval(() => {
        if (isPaused || isGameOver) return;

        // दुश्मन बनाना
        const rand = Math.random();
        if (rand < 0.8) { // 80% संभावना उल्कापिंड की
            moveElement(createElement('meteor', 45), 'meteor', baseMeteorSpeed);
        } else { // 20% संभावना ट्रैकर की
            moveElement(createElement('tracker', 25), 'tracker', baseMeteorSpeed * 0.8);
        }
        
        // पावर-अप बनाना
        if (Math.random() < 0.05) { // 5% संभावना पावर-अप की
            const powerUpType = Math.random() < 0.5 ? 'shield-powerup' : 'slowmo-powerup';
            const powerUpWidth = 40;
            moveElement(createElement(powerUpType, powerUpWidth), powerUpType, 3);
        }
    }, 1000); // हर सेकंड दुश्मन आएँगे
    gameIntervals.push(mainInterval);
}

