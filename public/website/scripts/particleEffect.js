// ── HERO CANVAS — particle + node network animation
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];
const stars = []; // Moved to top for consistency

// COLOR THEMES: Swap these out as you like!
const CYAN = 'rgba(0, 245, 255,'; // Electric Cyan
const MAGE = 'rgba(255, 0, 110,';  // Vivid Magenta

function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    initParticles();
}
window.addEventListener('resize', resize);

function initParticles() {
    particles = [];
    const count = Math.floor((W * H) / 9000);
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 1.8 + 0.4,
            type: Math.random() < 0.15 ? 'node' : 'dot',
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.02,
            color: Math.random() < 0.6 ? 'cyan' : 'magenta'
        });
    }
}

function spawnStar() {
    // Shooting stars move mostly downwards and to the side
    const angle = Math.PI * 0.25 + (Math.random() * Math.PI * 0.5);
    const speed = 5 + Math.random() * 5;
    stars.push({
        x: Math.random() * W,
        y: Math.random() * (H * 0.4), // Spawn in top 40% of screen
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 40,
        maxLife: 80,
        width: 1 + Math.random() * 1.5,
        length: 15 + Math.random() * 20
    });
}

function draw() {
    ctx.clearRect(0, 0, W, H);

    // 1. Draw Connections (Lines)
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
                const alpha = (1 - dist / 110) * 0.25;
                const col = a.color === 'cyan' ? CYAN : MAGE;
                ctx.beginPath();
                ctx.strokeStyle = col + alpha + ')';
                ctx.lineWidth = 0.6;
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }
    }

    // 2. Draw Particles
    particles.forEach(p => {
        p.pulse += p.pulseSpeed;
        const pulseFactor = 0.7 + Math.sin(p.pulse) * 0.3;
        const col = p.color === 'cyan' ? CYAN : MAGE;

        if (p.type === 'node') {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5 * pulseFactor);
            grad.addColorStop(0, col + '0.6)');
            grad.addColorStop(1, col + '0)');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 5 * pulseFactor, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * pulseFactor, 0, Math.PI * 2);
            ctx.fillStyle = col + '0.9)';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = col + (0.4 * pulseFactor) + ')';
            ctx.fill();
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    });

    // 3. SHOOTING STARS EFFECT
    if (Math.random() < 0.02) { // Higher frequency (2% per frame)
        spawnStar();
    }

    stars.forEach((s, i) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life--;

        const alpha = (s.life / s.maxLife);
        // Uses a mix of your theme colors
        const starCol = Math.random() > 0.5 ? CYAN : MAGE;

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineWidth = s.width;
        ctx.strokeStyle = starCol + alpha * 0.8 + ')';
        ctx.moveTo(s.x, s.y);
        // Trail length is controlled by s.length
        ctx.lineTo(s.x - (s.vx * s.length * 0.1), s.y - (s.vy * s.length * 0.1));
        ctx.stroke();

        if (s.life <= 0) stars.splice(i, 1);
    });

    requestAnimationFrame(draw);
}

resize();
draw();





function startCountdown() {
    const targetDate = new Date("june 14, 2026 10:30:00").getTime();

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        // Time calculations
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        // Output results
        document.getElementById("days").innerText = d.toString().padStart(2, '0');
        document.getElementById("hours").innerText = h.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = m.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = s.toString().padStart(2, '0');

        // If countdown ends
        if (distance < 0) {
            clearInterval(timer);
            document.querySelector(".countdown-container").innerHTML = "EVENT STARTED";
        }
    }, 1000);
}

startCountdown();