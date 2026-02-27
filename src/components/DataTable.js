/**
 * DataTable Component — sortable statistics table with drill-down navigation.
 */
import { getState, setState, pushNavigation, popNavigation } from '../state/store.js';
import { formatNumber, getPercentBadgeClass, parsePercent, getItemName } from '../utils/helpers.js';
import { downloadCSV } from '../utils/csv.js';
import { fetchDashboardData, fetchProvinceStatsFallback } from '../services/api.js';
import * as FilterPanel from './FilterPanel.js';

let onRefresh = null;

export function render() {
    return `
    <div class="glass-card data-section animate-fade-in-up delay-3" id="data-section">
      <div class="data-section__header">
        <h2 class="data-section__title" id="table-title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
          </svg>
          Rekap Data Per Provinsi
        </h2>
        <button class="btn-download" id="btn-download-csv">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
          Unduh CSV
        </button>
      </div>

      <div class="table-back-container" id="table-back-container">
        <button class="btn-back" id="btn-table-back">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
          </svg>
          <span id="btn-back-text">Kembali</span>
        </button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-sort="no"><span>No <span class="sort-indicator"></span></span></th>
              <th data-sort="name" id="col-name"><span>Provinsi <span class="sort-indicator"></span></span></th>
              <th data-sort="jumlahDesa"><span>Jumlah Desa <span class="sort-indicator"></span></span></th>
              <th data-sort="pemetaanMasuk"><span>Lahan Terdaftar <span class="sort-indicator"></span></span></th>
              <th data-sort="persenPemetaan"><span>% Pemetaan <span class="sort-indicator"></span></span></th>
              <th data-sort="persenPembangunan"><span>% Pembangunan <span class="sort-indicator"></span></span></th>
            </tr>
          </thead>
          <tbody id="table-body">
            <tr class="empty-row">
              <td colspan="6">
                <div class="table-loading">
                  <div class="spinner-sm"></div>
                  <span>Memuat data statistik...</span>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot id="table-footer"></tfoot>
        </table>
      </div>
    </div>
  `;
}

export function init(refreshCallback) {
    onRefresh = refreshCallback;

    // CSV download
    document.getElementById('btn-download-csv').addEventListener('click', () => {
        const tableData = getState('tableData');
        const level = getState('tableLevel');
        downloadCSV(tableData, level);
    });

    // Back button
    document.getElementById('btn-table-back').addEventListener('click', async () => {
        await navigateBack();
    });

    // Sortable headers
    document.querySelectorAll('.data-table thead th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-sort');
            const currentCol = getState('sortColumn');
            const currentDir = getState('sortDirection');

            if (currentCol === col) {
                setState('sortDirection', currentDir === 'desc' ? 'asc' : 'desc');
            } else {
                setState('sortColumn', col);
                setState('sortDirection', 'desc');
            }

            renderBody();
            updateSortIndicators();
        });
    });

    updateSortIndicators();
}

/* =====================
   Table Body Rendering
   ===================== */

function renderBody() {
    const body = document.getElementById('table-body');
    const tableData = getState('tableData');
    const level = getState('tableLevel');

    if (!tableData || tableData.length === 0) {
        body.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Tidak ada data untuk ditampilkan</td>
      </tr>`;
        return;
    }

    const sorted = sortData(tableData);
    const isClickable = level !== 'Desa';

    body.innerHTML = sorted.map((item, i) => {
        const name = getItemName(item);
        const pctPemetaan = parsePercent(item.persenPemetaan);
        const pctPembangunan = parsePercent(item.persenPembangunan);

        return `
      <tr class="${isClickable ? 'clickable' : ''}"
          ${isClickable ? `data-name="${name}" data-level="${level}" title="Klik untuk melihat detail ${name}"` : ''}>
        <td class="center">${i + 1}</td>
        <td class="bold">${isClickable ? `<span class="drill-link">${name}</span>` : name}</td>
        <td class="center">${formatNumber(item.jumlahDesa)}</td>
        <td class="center bold">${formatNumber(item.pemetaanMasuk)}</td>
        <td class="center"><span class="pct-badge ${getPercentBadgeClass(pctPemetaan)}">${pctPemetaan.toFixed(1)}%</span></td>
        <td class="center"><span class="pct-badge ${getPercentBadgeClass(pctPembangunan)}">${pctPembangunan.toFixed(1)}%</span></td>
      </tr>`;
    }).join('');

    // Attach drill-down listeners
    if (isClickable) {
        body.querySelectorAll('tr[data-name]').forEach(row => {
            row.addEventListener('click', async () => {
                const name = row.getAttribute('data-name');
                const fromLevel = row.getAttribute('data-level');
                await drillDown(name, fromLevel);
            });
        });
    }
}

/* =====================
   Sorting
   ===================== */

function sortData(data) {
    const col = getState('sortColumn');
    const dir = getState('sortDirection');
    if (!col || data.length === 0) return data;

    return [...data].sort((a, b) => {
        let va, vb;

        if (col === 'no') {
            va = a.no || 0; vb = b.no || 0;
        } else if (col === 'name') {
            va = getItemName(a).toLowerCase();
            vb = getItemName(b).toLowerCase();
            return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        } else if (col === 'jumlahDesa') {
            va = a.jumlahDesa || 0; vb = b.jumlahDesa || 0;
        } else if (col === 'pemetaanMasuk') {
            va = a.pemetaanMasuk || 0; vb = b.pemetaanMasuk || 0;
        } else if (col === 'persenPemetaan') {
            va = parsePercent(a.persenPemetaan); vb = parsePercent(b.persenPemetaan);
        } else if (col === 'persenPembangunan') {
            va = parsePercent(a.persenPembangunan); vb = parsePercent(b.persenPembangunan);
        } else {
            return 0;
        }

        return dir === 'asc' ? va - vb : vb - va;
    });
}

function updateSortIndicators() {
    const col = getState('sortColumn');
    const dir = getState('sortDirection');

    document.querySelectorAll('.data-table thead th[data-sort]').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        const sortCol = th.getAttribute('data-sort');
        indicator.textContent = sortCol === col ? (dir === 'desc' ? '▼' : '▲') : '';
    });
}

/* =====================
   Drill-down / Navigation
   ===================== */

async function drillDown(name, fromLevel) {
    const f = getState('filters');
    pushNavigation({
        level: fromLevel,
        provinsi: f.provinsiId,
        kabupaten: f.kabupatenId,
        kecamatan: f.kecamatanId,
        desa: f.desaId,
    });
    updateBackButton();
    showLoading(`Memuat data ${name}...`);

    if (fromLevel === 'Provinsi') {
        await FilterPanel.setFilterProgrammatically('provinsi', name);
    } else if (fromLevel === 'Kabupaten/Kota') {
        await FilterPanel.setFilterProgrammatically('kabupaten', name);
    } else if (fromLevel === 'Kecamatan') {
        await FilterPanel.setFilterProgrammatically('kecamatan', name);
    }

    onRefresh?.();
}

async function navigateBack() {
    const prev = popNavigation();
    if (!prev) return;

    showLoading('Memuat data...');
    updateBackButton();
    await FilterPanel.restoreFilters(prev);
    onRefresh?.();
}

function updateBackButton() {
    const container = document.getElementById('table-back-container');
    const text = document.getElementById('btn-back-text');
    const history = getState('navigationHistory');

    if (history.length > 0) {
        container.classList.add('visible');
        const last = history[history.length - 1];
        if (last.level === 'Kabupaten/Kota') {
            const provEl = document.getElementById('filter-provinsi');
            text.textContent = `Kembali ke ${provEl.options[provEl.selectedIndex]?.text || 'Provinsi'}`;
        } else if (last.level === 'Kecamatan') {
            const kabEl = document.getElementById('filter-kabupaten');
            text.textContent = `Kembali ke ${kabEl.options[kabEl.selectedIndex]?.text || 'Kabupaten'}`;
        } else {
            text.textContent = 'Kembali ke Semua Provinsi';
        }
    } else {
        container.classList.remove('visible');
    }
}

function showLoading(msg = 'Memuat data...') {
    document.getElementById('table-body').innerHTML = `
    <tr class="empty-row">
      <td colspan="6">
        <div class="table-loading">
          <div class="spinner-sm"></div>
          <span>${msg}</span>
        </div>
      </td>
    </tr>`;
}

/* =====================
   Public Update Method
   ===================== */

export async function updateTable(apiFilters) {
    const tableTitle = document.getElementById('table-title');
    const colName = document.getElementById('col-name');
    const footer = document.getElementById('table-footer');

    showLoading('Memuat data statistik...');

    try {
        // Try Inertia first
        let inertiaData = null;
        try { inertiaData = await fetchDashboardData(apiFilters); } catch { /* silent */ }

        let levelData = [];
        let currentLevel = 'provinsi';
        let titleText = 'Rekap Data Per Provinsi';
        let colText = 'Provinsi';

        if (inertiaData) {
            currentLevel = inertiaData.currentLevel || 'provinsi';
            levelData = inertiaData.levelData?.length ? inertiaData.levelData : (inertiaData.provinsiData || []);

            if (currentLevel === 'desa') { titleText = 'Rekap Data Per Desa'; colText = 'Desa'; }
            else if (currentLevel === 'kecamatan') { titleText = 'Rekap Data Per Kecamatan'; colText = 'Kecamatan'; }
            else if (currentLevel === 'kabupaten') { titleText = 'Rekap Data Per Kabupaten/Kota'; colText = 'Kabupaten/Kota'; }
        } else {
            const fallback = await fetchProvinceStatsFallback(apiFilters);
            if (fallback) levelData = fallback.levelData;
        }

        // Update store
        setState('tableData', levelData);
        setState('tableLevel', colText);

        // Calculate totals
        let totalDesa = 0, totalPemetaan = 0;
        levelData.forEach(item => {
            totalDesa += parseInt(String(item.jumlahDesa || 0).replace(/\D/g, '')) || 0;
            totalPemetaan += parseInt(String(item.pemetaanMasuk || 0).replace(/\D/g, '')) || 0;
        });

        const pctTotal = totalDesa > 0 ? ((totalPemetaan / totalDesa) * 100).toFixed(2) + '%' : '0%';

        // Update header
        tableTitle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
      </svg>
      ${titleText}`;

        // Update column name
        const colSpan = colName.querySelector('span');
        if (colSpan) {
            const indicator = colName.querySelector('.sort-indicator');
            colSpan.innerHTML = `${colText} <span class="sort-indicator">${indicator?.textContent || ''}</span>`;
        }

        // Render body & indicators
        renderBody();
        updateSortIndicators();

        // Footer
        footer.innerHTML = `
      <tr>
        <td colspan="2" class="bold">Total Keseluruhan</td>
        <td class="center bold">${formatNumber(totalDesa)}</td>
        <td class="center bold">${formatNumber(totalPemetaan)}</td>
        <td class="center bold">${pctTotal}</td>
        <td class="center bold">-</td>
      </tr>`;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        document.getElementById('table-body').innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Gagal memuat data statistik</td>
      </tr>`;
        footer.innerHTML = '';
    }
}
