/* Prediction page JavaScript */

const form        = document.getElementById('predictionForm');
const predictBtn  = document.getElementById('predictBtn');
const btnText     = predictBtn.querySelector('.btn-text');
const btnLoading  = predictBtn.querySelector('.btn-loading');
const formError   = document.getElementById('formErrorMsg');
const formErrTxt  = document.getElementById('formErrorText');
const predEmpty   = document.getElementById('predEmpty');
const predResult  = document.getElementById('predResult');
const resetBtn    = document.getElementById('resetPredBtn');

// ── Validate form ────────────────────────────────────────────────
function validateForm() {
    let valid = true;
    const age = document.getElementById('victimAge');
    const ageVal = parseInt(age.value);

    // Reset errors
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
    formError.classList.add('hidden');

    if (!age.value || isNaN(ageVal) || ageVal < 0 || ageVal > 120) {
        age.classList.add('error');
        valid = false;
    }
    ['city','victimGender','weaponUsed','crimeDomain'].forEach(id => {
        const el = document.getElementById(id);
        if (!el.value) { el.classList.add('error'); valid = false; }
    });

    if (!valid) {
        formErrTxt.textContent = 'Please fill in all fields correctly. Age must be 0–120.';
        formError.classList.remove('hidden');
    }
    return valid;
}

// ── Submit prediction ────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Loading state
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    predictBtn.disabled = true;

    const payload = {
        victim_age:   parseInt(document.getElementById('victimAge').value),
        city:         document.getElementById('city').value,
        victim_gender:document.getElementById('victimGender').value,
        weapon_used:  document.getElementById('weaponUsed').value,
        crime_domain: document.getElementById('crimeDomain').value,
    };

    try {
        const resp = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await resp.json();

        if (!resp.ok || data.error) {
            formErrTxt.textContent = data.error || 'Prediction failed.';
            formError.classList.remove('hidden');
        } else {
            showResult(data);
        }
    } catch (err) {
        formErrTxt.textContent = 'Network error. Is the server running?';
        formError.classList.remove('hidden');
    } finally {
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        predictBtn.disabled = false;
    }
});

// ── Display result ───────────────────────────────────────────────
function showResult(data) {
    predEmpty.classList.add('hidden');
    predResult.classList.remove('hidden');

    // Main prediction
    document.getElementById('predictedCrime').textContent = data.predicted_crime;

    // Confidence ring
    const conf = data.confidence;
    document.getElementById('confPct').textContent = conf.toFixed(1) + '%';
    const circle = document.getElementById('confCircle');
    const circumference = 213.6;
    const offset = circumference - (conf / 100) * circumference;
    // Animate
    circle.style.transition = 'none';
    circle.style.strokeDashoffset = circumference;
    setTimeout(() => {
        circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)';
        circle.style.strokeDashoffset = offset;
    }, 50);

    // Input recap
    const inputs = data.inputs;
    const genderMap = { M: 'Male', F: 'Female', X: 'Other (X)' };
    const recapGrid = document.getElementById('recapGrid');
    recapGrid.innerHTML = `
        <div class="recap-item"><div class="recap-key">Victim Age</div><div class="recap-val">${inputs.victim_age}</div></div>
        <div class="recap-item"><div class="recap-key">City</div><div class="recap-val">${inputs.city}</div></div>
        <div class="recap-item"><div class="recap-key">Gender</div><div class="recap-val">${genderMap[inputs.victim_gender] || inputs.victim_gender}</div></div>
        <div class="recap-item"><div class="recap-key">Weapon</div><div class="recap-val">${inputs.weapon_used}</div></div>
        <div class="recap-item" style="grid-column:span 2"><div class="recap-key">Crime Domain</div><div class="recap-val">${inputs.crime_domain}</div></div>
    `;

    // Top 3
    const rankClasses = ['gold', 'silver', 'bronze'];
    const top3List = document.getElementById('top3List');
    top3List.innerHTML = '';
    data.top3.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'top3-item';
        div.innerHTML = `
            <div class="top3-rank ${rankClasses[i]}">${i + 1}</div>
            <div class="top3-crime">${item.crime}</div>
            <div class="top3-bar"><div class="top3-bar-fill" style="width:${item.probability}%"></div></div>
            <div class="top3-prob">${item.probability.toFixed(1)}%</div>
        `;
        top3List.appendChild(div);
    });
}

// ── Reset button ─────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
    predResult.classList.add('hidden');
    predEmpty.classList.remove('hidden');
    form.reset();
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
    formError.classList.add('hidden');
});
