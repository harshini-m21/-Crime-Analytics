/* ── Sidebar Toggle ────────────────────────────────────────────── */
const sidebar      = document.getElementById('sidebar');
const mainWrapper  = document.getElementById('mainWrapper');
const mobileToggle = document.getElementById('mobileToggle');
const overlay      = document.getElementById('overlay');
const sidebarToggle= document.getElementById('sidebarToggle');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    });
}
if (overlay) {
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
}

/* ── Date in topbar ────────────────────────────────────────────── */
const dateEl = document.getElementById('topbarDate');
if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
}

/* ── Chart.js Defaults ──────────────────────────────────────────── */
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#1e2d45';
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
Chart.defaults.font.size = 12;

/* ── Colour Palettes ────────────────────────────────────────────── */
window.COLORS = {
    purple:   '#6366f1',
    blue:     '#3b82f6',
    teal:     '#14b8a6',
    green:    '#22c55e',
    orange:   '#f59e0b',
    red:      '#ef4444',
    pink:     '#ec4899',
    indigo:   '#4f46e5',
    cyan:     '#06b6d4',
    violet:   '#8b5cf6',
};

window.PALETTE = [
    '#6366f1','#14b8a6','#f59e0b','#22c55e','#3b82f6',
    '#ec4899','#ef4444','#8b5cf6','#06b6d4','#4f46e5',
    '#a3e635','#fb923c','#f472b6','#34d399','#60a5fa'
];

/* ── Utility: format numbers ────────────────────────────────────── */
window.fmtNum = n => Number(n).toLocaleString('en-IN');

/* ── Utility: make horizontal bar chart ────────────────────────── */
window.makeHBar = (id, labels, data, colors) => {
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors || PALETTE.slice(0, data.length),
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: {
                label: ctx => ' ' + fmtNum(ctx.raw)
            }}},
            scales: {
                x: { grid: { color: '#1e2d45' }, ticks: { color: '#94a3b8' } },
                y: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 11 } } }
            }
        }
    });
};

/* ── Utility: make vertical bar chart ──────────────────────────── */
window.makeVBar = (id, labels, data, color) => {
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: color || PALETTE,
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: {
                label: ctx => ' ' + fmtNum(ctx.raw)
            }}},
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 35, minRotation: 20 } },
                y: { grid: { color: '#1e2d45' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
};

/* ── Utility: make donut/pie chart ──────────────────────────────── */
window.makeDoughnut = (id, labels, data, colors) => {
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors || PALETTE.slice(0, data.length),
                borderWidth: 2,
                borderColor: '#0f172a',
                hoverBorderColor: '#1e293b',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', padding: 14, font: { size: 11 }, boxWidth: 12 }
                },
                tooltip: { callbacks: {
                    label: ctx => ' ' + ctx.label + ': ' + fmtNum(ctx.raw) +
                        ' (' + (ctx.raw / ctx.dataset.data.reduce((a,b)=>a+b,0) * 100).toFixed(1) + '%)'
                }}
            }
        }
    });
};

/* ── Utility: make line chart ───────────────────────────────────── */
window.makeLine = (id, labels, data, color) => {
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data,
                borderColor: color || COLORS.purple,
                backgroundColor: (color || COLORS.purple) + '22',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: color || COLORS.purple,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: {
                label: ctx => ' ' + fmtNum(ctx.raw)
            }}},
            scales: {
                x: { grid: { color: '#1e2d45' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: '#1e2d45' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
};

/* ── Table search helper ────────────────────────────────────────── */
window.initTableSearch = (inputId, tbodyId) => {
    const inp   = document.getElementById(inputId);
    const tbody = document.getElementById(tbodyId);
    if (!inp || !tbody) return;
    inp.addEventListener('input', () => {
        const q = inp.value.toLowerCase();
        Array.from(tbody.rows).forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });
};

/* ── Count-up animation ─────────────────────────────────────────── */
window.countUp = (el, target, duration, suffix) => {
    const start = performance.now();
    const isFloat = !Number.isInteger(target);
    function step(ts) {
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = ease * target;
        el.textContent = (isFloat ? current.toFixed(2) : Math.floor(current).toLocaleString('en-IN')) + (suffix || '');
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
};
