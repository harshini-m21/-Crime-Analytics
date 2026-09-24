/* Analysis page JavaScript */

let charts = {};
let cityData = [];
let crimeTypeData = [];

// ── Load filter options ──────────────────────────────────────────
async function loadFilterOptions() {
    const opts = await fetch('/api/filter_options').then(r => r.json());
    const citySelect   = document.getElementById('filterCity');
    const yearSelect   = document.getElementById('filterYear');
    const domainSelect = document.getElementById('filterDomain');

    opts.cities.forEach(c  => citySelect.add(new Option(c, c)));
    opts.years.forEach(y   => yearSelect.add(new Option(y, y)));
    opts.domains.forEach(d => domainSelect.add(new Option(d, d)));
}

// ── Load & render analysis data ──────────────────────────────────
async function loadAnalysis() {
    const city   = document.getElementById('filterCity').value;
    const year   = document.getElementById('filterYear').value;
    const domain = document.getElementById('filterDomain').value;

    const params = new URLSearchParams({ city, year, domain });
    const data   = await fetch('/api/filter_analysis?' + params).then(r => r.json());

    // Update total badge
    document.getElementById('filteredTotal').textContent = Number(data.total).toLocaleString('en-IN');

    // ── Destroy and recreate charts ──────────────────────────────
    Object.values(charts).forEach(c => c && c.destroy());
    charts = {};

    charts.crimeType = makeHBar(
        'analysisCrimeChart',
        data.crime_types.labels,
        data.crime_types.values
    );

    charts.year = makeLine(
        'analysisYearChart',
        data.year_trend.years.map(String),
        data.year_trend.counts,
        COLORS.teal
    );

    charts.city = makeHBar(
        'analysisCityChart',
        data.city_counts.labels,
        data.city_counts.values,
        PALETTE.slice(0, data.city_counts.labels.length).map((_, i) => PALETTE[(i + 3) % PALETTE.length])
    );

    charts.status = makeDoughnut(
        'analysisStatusChart',
        data.case_status.labels,
        data.case_status.values,
        [COLORS.green, COLORS.red]
    );
}

// ── City stats table ────────────────────────────────────────────
async function loadCityTable() {
    cityData = await fetch('/api/city_stats').then(r => r.json());
    renderCityTable(cityData);
    initTableSearch('cityTableSearch', 'cityTableBody');
}

function renderCityTable(data) {
    const tbody = document.getElementById('cityTableBody');
    tbody.innerHTML = '';
    data.forEach(row => {
        const pct = row.closure_rate;
        const tr  = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${row.City}</strong></td>
            <td>${fmtNum(row.total)}</td>
            <td>${fmtNum(row.closed)}</td>
            <td>${fmtNum(row.open)}</td>
            <td>
                <div class="closure-bar">
                    <div class="closure-track"><div class="closure-fill" style="width:${pct}%"></div></div>
                    <span class="closure-pct">${pct}%</span>
                </div>
            </td>
            <td><span style="color:#94a3b8">${row.top_crime}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Crime type stats table ──────────────────────────────────────
async function loadCrimeTypeTable() {
    crimeTypeData = await fetch('/api/crime_type_stats').then(r => r.json());
    renderCrimeTypeTable(crimeTypeData);
    initTableSearch('crimeTypeSearch', 'crimeTypeTableBody');
}

function renderCrimeTypeTable(data) {
    const tbody = document.getElementById('crimeTypeTableBody');
    tbody.innerHTML = '';
    data.forEach(row => {
        const pct = row.closure_rate;
        const tr  = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${row['Crime Description']}</strong></td>
            <td>${fmtNum(row.total)}</td>
            <td>${row.top_city}</td>
            <td>${row.avg_age}</td>
            <td>${fmtNum(row.closed)}</td>
            <td>
                <div class="closure-bar">
                    <div class="closure-track"><div class="closure-fill" style="width:${pct}%"></div></div>
                    <span class="closure-pct">${pct}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Filter buttons ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadFilterOptions();
    await loadAnalysis();
    await loadCityTable();
    await loadCrimeTypeTable();

    document.getElementById('applyFilters').addEventListener('click', loadAnalysis);
    document.getElementById('resetFilters').addEventListener('click', () => {
        document.getElementById('filterCity').value   = 'All';
        document.getElementById('filterYear').value   = 'All';
        document.getElementById('filterDomain').value = 'All';
        loadAnalysis();
    });
});
