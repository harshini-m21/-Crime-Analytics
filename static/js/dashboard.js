/* Dashboard page JavaScript */

let charts = {};

async function loadDashboard() {
    // Load all data in parallel
    const [stats, topCrimes, topCities, yearTrend, caseStatus, domains, weapons, gender] = await Promise.all([
        fetch('/api/dashboard_stats').then(r => r.json()),
        fetch('/api/top_crime_types').then(r => r.json()),
        fetch('/api/top_cities').then(r => r.json()),
        fetch('/api/year_trend').then(r => r.json()),
        fetch('/api/case_status').then(r => r.json()),
        fetch('/api/crime_domains').then(r => r.json()),
        fetch('/api/weapon_dist').then(r => r.json()),
        fetch('/api/gender_dist').then(r => r.json()),
    ]);

    // ── Stat cards ─────────────────────────────────────────────────
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('loading'));

    const totalCrimesEl = document.getElementById('totalCrimes');
    const totalCitiesEl = document.getElementById('totalCities');
    const crimeTypesEl  = document.getElementById('crimeTypes');
    const crimeDomainsEl= document.getElementById('crimeDomains');
    const closedCasesEl = document.getElementById('closedCases');
    const closureRateEl = document.getElementById('closureRate');
    const modelAccEl    = document.getElementById('modelAcc');

    countUp(totalCrimesEl, stats.total_crimes,  1200);
    countUp(totalCitiesEl, stats.total_cities,  800);
    countUp(crimeTypesEl,  stats.crime_types,   600);
    countUp(crimeDomainsEl,stats.crime_domains,  600);
    countUp(closedCasesEl, stats.closed_cases,  1000);
    countUp(modelAccEl,    stats.model_accuracy, 1200, '%');

    if (closureRateEl) closureRateEl.textContent = stats.closure_rate + '% Rate';

    // ── Year trend ─────────────────────────────────────────────────
    charts.yearTrend = makeLine(
        'yearTrendChart',
        yearTrend.years.map(String),
        yearTrend.counts,
        COLORS.purple
    );

    // ── Case status ────────────────────────────────────────────────
    charts.caseStatus = makeDoughnut(
        'caseStatusChart',
        caseStatus.labels,
        caseStatus.values,
        [COLORS.green, COLORS.red]
    );

    // ── Top crime types ────────────────────────────────────────────
    charts.topCrime = makeHBar(
        'topCrimeChart',
        topCrimes.labels,
        topCrimes.values,
        PALETTE.slice(0, topCrimes.labels.length)
    );

    // ── Top cities ─────────────────────────────────────────────────
    charts.topCities = makeHBar(
        'topCitiesChart',
        topCities.labels,
        topCities.values,
        PALETTE.slice(0, topCities.labels.length).map((_, i) => PALETTE[(i + 5) % PALETTE.length])
    );

    // ── Domain distribution ────────────────────────────────────────
    charts.domain = makeDoughnut(
        'domainChart',
        domains.labels,
        domains.values,
        [COLORS.purple, COLORS.orange, COLORS.teal, COLORS.pink]
    );

    // ── Weapon distribution ────────────────────────────────────────
    charts.weapon = makeDoughnut(
        'weaponChart',
        weapons.labels,
        weapons.values
    );

    // ── Gender distribution ────────────────────────────────────────
    charts.gender = makeDoughnut(
        'genderChart',
        gender.labels,
        gender.values,
        [COLORS.blue, COLORS.pink, COLORS.teal]
    );
}

document.addEventListener('DOMContentLoaded', loadDashboard);
