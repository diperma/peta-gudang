/**
 * BarChart Component — horizontal bar chart sorted by % pemetaan.
 */
import { getState } from '../state/store.js';
import { parsePercent, getItemName, getBarGradient } from '../utils/helpers.js';

export function render() {
    return `
    <div class="glass-card chart-section animate-fade-in-up delay-4" id="chart-section">
      <div class="chart-section__header">
        <h2 class="chart-section__title" id="chart-title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
          Persentase Pemetaan Lahan per Provinsi (Urutan Tertinggi)
        </h2>
      </div>
      <div id="chart-area" class="bar-chart-container">
        <div class="table-loading">
          <div class="spinner-sm"></div>
          <span>Menunggu data...</span>
        </div>
      </div>
    </div>
  `;
}

export function update() {
    const area = document.getElementById('chart-area');
    const title = document.getElementById('chart-title');
    const data = getState('tableData');
    const level = getState('tableLevel') || 'Provinsi';

    if (!area) return;

    // Update title
    title.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>
    Persentase Pemetaan Lahan per ${level} (Urutan Tertinggi)`;

    if (!data || data.length === 0) {
        area.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Tidak ada data untuk ditampilkan</div>`;
        return;
    }

    const sorted = [...data].sort((a, b) => parsePercent(b.persenPemetaan) - parsePercent(a.persenPemetaan));

    const bars = sorted.map(item => {
        const name = getItemName(item);
        const pct = parsePercent(item.persenPemetaan);
        const width = Math.min(pct, 100);
        const gradient = getBarGradient(pct);
        const showInside = width >= 12;

        return `
      <div class="bar-row" title="${name}: ${pct.toFixed(1)}%">
        <div class="bar-label">${name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${width}%; background: ${gradient};">
            ${showInside ? `<span class="bar-value">${pct.toFixed(1)}%</span>` : ''}
          </div>
        </div>
        ${!showInside ? `<span class="bar-value-outside">${pct.toFixed(1)}%</span>` : ''}
      </div>`;
    }).join('');

    const axis = `
    <div class="bar-axis">
      <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
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
