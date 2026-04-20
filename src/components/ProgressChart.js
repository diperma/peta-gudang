/**
 * ProgressChart Component — shows distribution of % progress buckets.
 */
import { getState } from '../state/store.js';
import { formatNumber } from '../utils/helpers.js';

/**
 * Categorize progress into buckets matching the Python logic.
 */
function getCategory(progress) {
    const p = parseFloat(progress) || 0;
    if (p >= 100) return '100%';
    if (p > 90) return '>90%';
    if (p >= 80) return '80%-90%';
    if (p >= 70) return '70%-80%';
    if (p >= 60) return '60%-70%';
    if (p >= 50) return '50%-60%';
    if (p >= 40) return '40%-50%';
    if (p >= 30) return '30%-40%';
    if (p >= 20) return '20%-30%';
    if (p >= 10) return '10%-20%';
    if (p >= 1) return '1%-10%';
    return '0%-1%';
}

const CATEGORIES = [
    '100%', '>90%', '80%-90%', '70%-80%', '60%-70%', '50%-60%', 
    '40%-50%', '30%-40%', '20%-30%', '10%-20%', '1%-10%', '0%-1%'
];

export function render() {
    return `
    <div class="glass-card chart-section animate-fade-in-up delay-5" id="progress-chart-section">
      <div class="chart-section__header">
        <h2 class="chart-section__title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v11a1 1 0 100 2h14a1 1 0 100-2v-1a1 1 0 100-2V7a1 1 0 100-2V3a1 1 0 00-1-1H4a1 1 0 00-1 1zm4 4a1 1 0 011-1h2a1 1 0 011 1v7a1 1 0 11-2 0V8H8v6a1 1 0 11-2 0V7zm9-1a1 1 0 00-1 1v8a1 1 0 102 0V7a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          Sebaran % Progres Pembangunan
        </h2>
      </div>
      <div class="chart-section__subtitle" id="progress-chart-subtitle" style="padding: 0 var(--space-lg); font-size: 0.75rem; color: var(--text-muted); margin-top: -4px;">
        Mengevaluasi sebaran progres pembangunan gerai KDKMP
      </div>
      <div id="progress-chart-area" class="bar-chart-container">
        <div class="table-loading">
          <div class="spinner-sm"></div>
          <span>Menghitung sebaran progres...</span>
        </div>
      </div>
    </div>
  `;
}

export function update() {
    const area = document.getElementById('progress-chart-area');
    const subtitle = document.getElementById('progress-chart-subtitle');
    const markers = getState('markers') || [];
    
    if (!area) return;

    // Filter to only started developments (matching Python logic)
    const startedMarkers = markers.filter(m => m.isStartDevelopment);
    const totalCount = startedMarkers.length;

    if (totalCount === 0) {
        area.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Tidak ada data pembangunan untuk ditampilkan</div>`;
        subtitle.textContent = "Belum ada lokasi yang mulai dibangun";
        return;
    }

    subtitle.textContent = `Mengevaluasi sebaran pada ${formatNumber(totalCount)} lokasi yang sedang dibangun`;

    // Calculate distribution
    const counts = CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {});
    startedMarkers.forEach(m => {
        const cat = getCategory(m.percentage_development_progress);
        if (counts[cat] !== undefined) counts[cat]++;
    });

    const maxVal = Math.max(...Object.values(counts));
    
    // Use the Slate Blue color from Python script: #4e79a7
    const barColor = '#4e79a7';

    const bars = CATEGORIES.map(cat => {
        const count = counts[cat];
        const width = maxVal > 0 ? (count / maxVal) * 100 : 0;
        const showInside = width >= 15;

        return `
      <div class="bar-row" title="${cat}: ${formatNumber(count)} Lahan">
        <div class="bar-label bar-label--short">${cat}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${width}%; background: ${barColor};">
            ${showInside ? `<span class="bar-value">${formatNumber(count)}</span>` : ''}
          </div>
        </div>
        ${!showInside ? `<span class="bar-value-outside">${formatNumber(count)}</span>` : ''}
      </div>`;
    }).join('');

    const axis = `
    <div class="bar-axis bar-axis--short">
      <span>0</span><span>${formatNumber(Math.round(maxVal / 2))}</span><span>${formatNumber(maxVal)}</span>
    </div>`;

    area.innerHTML = bars + axis;

    // Animate bars
    requestAnimationFrame(() => {
        const fills = area.querySelectorAll('.bar-fill');
        fills.forEach(fill => {
            const target = fill.style.width;
            fill.style.width = '0%';
            requestAnimationFrame(() => { fill.style.width = target; });
        });
    });
}
