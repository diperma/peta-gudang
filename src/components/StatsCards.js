/**
 * StatsCards Component — animated summary cards.
 */
import { animateCounter } from '../utils/helpers.js';

export function render() {
    return `
    <div class="stats-grid">
      <div class="glass-card stat-card stat-card--blue animate-fade-in-up delay-2">
        <p class="stat-card__label">Total Lokasi</p>
        <p class="stat-card__value" id="stat-total">---</p>
      </div>
      <div class="glass-card stat-card stat-card--orange animate-fade-in-up delay-3">
        <p class="stat-card__label">Sudah Mulai Bangun</p>
        <p class="stat-card__value" id="stat-started">---</p>
      </div>
      <div class="glass-card stat-card stat-card--green animate-fade-in-up delay-4">
        <p class="stat-card__label">Selesai 100%</p>
        <p class="stat-card__value" id="stat-complete">---</p>
      </div>
    </div>
  `;
}

export function update(data) {
    const total = data.length;
    const started = data.filter(d => d.isStartDevelopment).length;
    const complete = data.filter(d => parseFloat(d.percentage_development_progress) >= 100).length;

    animateCounter(document.getElementById('stat-total'), total);
    animateCounter(document.getElementById('stat-started'), started);
    animateCounter(document.getElementById('stat-complete'), complete);
}
