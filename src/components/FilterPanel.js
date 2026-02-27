/**
 * FilterPanel Component — cascading location filters + status checkboxes.
 */
import { fetchProvinces, fetchKabupaten, fetchKecamatan, fetchDesa } from '../services/api.js';
import { getState, updateState } from '../state/store.js';

let onFilterChange = null;

export function render() {
    return `
    <div class="glass-card filter-panel animate-fade-in-up delay-1" id="filter-panel">
      <div class="filter-panel__header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
        </svg>
        Filter Lokasi
      </div>

      <div class="filter-grid">
        <div class="filter-group">
          <label for="filter-provinsi">Provinsi</label>
          <select id="filter-provinsi" class="filter-select">
            <option value="">Semua Provinsi</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-kabupaten">Kabupaten/Kota</label>
          <select id="filter-kabupaten" class="filter-select" disabled>
            <option value="">Pilih Provinsi dulu</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-kecamatan">Kecamatan</label>
          <select id="filter-kecamatan" class="filter-select" disabled>
            <option value="">Pilih Kabupaten dulu</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="filter-desa">Desa/Kelurahan</label>
          <select id="filter-desa" class="filter-select" disabled>
            <option value="">Pilih Kecamatan dulu</option>
          </select>
        </div>
      </div>

      <div class="filter-status-section">
        <h3>Filter Status</h3>
        <div class="filter-checkboxes">
          <label class="filter-checkbox-label">
            <input type="checkbox" id="filter-progress-100" />
            <span class="filter-checkbox-dot filter-checkbox-dot--green"></span>
            Hanya Progress 100%
          </label>
          <label class="filter-checkbox-label">
            <input type="checkbox" id="filter-mulai-bangun" />
            <span class="filter-checkbox-dot filter-checkbox-dot--yellow"></span>
            Sudah Mulai Bangun
          </label>
        </div>
      </div>

      <div class="filter-actions">
        <button id="btn-reset-filter" class="btn-reset">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
          </svg>
          Reset Filter
        </button>
        <span id="filter-status" class="filter-status-text"></span>
      </div>
    </div>
  `;
}

function resetDropdown(select, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    select.disabled = true;
}

function getSelectedText(select) {
    return select.options[select.selectedIndex]?.text || '';
}

export async function init(filterChangeCallback) {
    onFilterChange = filterChangeCallback;

    const elProv = document.getElementById('filter-provinsi');
    const elKab = document.getElementById('filter-kabupaten');
    const elKec = document.getElementById('filter-kecamatan');
    const elDesa = document.getElementById('filter-desa');
    const elProg100 = document.getElementById('filter-progress-100');
    const elMulai = document.getElementById('filter-mulai-bangun');
    const elReset = document.getElementById('btn-reset-filter');

    // Load provinces
    try {
        const provinces = await fetchProvinces();
        provinces.forEach(p => {
            elProv.innerHTML += `<option value="${p.id}">${p.nama}</option>`;
        });
    } catch (e) {
        console.error('Error loading provinces:', e);
    }

    // --- Event Listeners ---
    elProv.addEventListener('change', async () => {
        const id = elProv.value;
        resetDropdown(elKab, 'Pilih Provinsi dulu');
        resetDropdown(elKec, 'Pilih Kabupaten dulu');
        resetDropdown(elDesa, 'Pilih Kecamatan dulu');

        if (id) {
            elKab.innerHTML = '<option value="">Memuat...</option>';
            const data = await fetchKabupaten(id);
            elKab.innerHTML = '<option value="">Semua Kabupaten/Kota</option>';
            data.forEach(k => { elKab.innerHTML += `<option value="${k.id}">${k.nama}</option>`; });
            elKab.disabled = false;
        }

        syncFilters();
        onFilterChange?.();
    });

    elKab.addEventListener('change', async () => {
        const id = elKab.value;
        resetDropdown(elKec, 'Pilih Kabupaten dulu');
        resetDropdown(elDesa, 'Pilih Kecamatan dulu');

        if (id) {
            elKec.innerHTML = '<option value="">Memuat...</option>';
            const data = await fetchKecamatan(id);
            elKec.innerHTML = '<option value="">Semua Kecamatan</option>';
            data.forEach(k => { elKec.innerHTML += `<option value="${k.id}">${k.nama}</option>`; });
            elKec.disabled = false;
        }

        syncFilters();
        onFilterChange?.();
    });

    elKec.addEventListener('change', async () => {
        const id = elKec.value;
        resetDropdown(elDesa, 'Pilih Kecamatan dulu');

        if (id) {
            elDesa.innerHTML = '<option value="">Memuat...</option>';
            const data = await fetchDesa(id);
            elDesa.innerHTML = '<option value="">Semua Desa/Kelurahan</option>';
            data.forEach(d => { elDesa.innerHTML += `<option value="${d.id}">${d.nama}</option>`; });
            elDesa.disabled = false;
        }

        syncFilters();
        onFilterChange?.();
    });

    elDesa.addEventListener('change', () => {
        syncFilters();
        onFilterChange?.();
    });

    elProg100.addEventListener('change', () => {
        syncFilters();
        onFilterChange?.();
    });

    elMulai.addEventListener('change', () => {
        syncFilters();
        onFilterChange?.();
    });

    elReset.addEventListener('click', () => {
        elProv.value = '';
        resetDropdown(elKab, 'Pilih Provinsi dulu');
        resetDropdown(elKec, 'Pilih Kabupaten dulu');
        resetDropdown(elDesa, 'Pilih Kecamatan dulu');
        elProg100.checked = false;
        elMulai.checked = false;

        updateState('filters', {
            provinsiId: '', provinsiName: '',
            kabupatenId: '', kabupatenName: '',
            kecamatanId: '', kecamatanName: '',
            desaId: '', desaName: '',
            progress100: false, isStartDevelopment: false,
        });
        updateState('navigationHistory', []);

        onFilterChange?.();
    });

    function syncFilters() {
        updateState('filters', {
            provinsiId: elProv.value,
            provinsiName: elProv.value ? getSelectedText(elProv) : '',
            kabupatenId: elKab.value,
            kabupatenName: elKab.value ? getSelectedText(elKab) : '',
            kecamatanId: elKec.value,
            kecamatanName: elKec.value ? getSelectedText(elKec) : '',
            desaId: elDesa.value,
            desaName: elDesa.value ? getSelectedText(elDesa) : '',
            progress100: elProg100.checked,
            isStartDevelopment: elMulai.checked,
        });
    }
}

/**
 * Update filter status text shown below filters.
 */
export function updateFilterStatus() {
    const f = getState('filters');
    const el = document.getElementById('filter-status');
    if (!el) return;

    const parts = [];
    if (f.provinsiName) parts.push(f.provinsiName);
    if (f.kabupatenName) parts.push(f.kabupatenName);
    if (f.kecamatanName) parts.push(f.kecamatanName);
    if (f.desaName) parts.push(f.desaName);

    const statusParts = [];
    if (f.progress100) statusParts.push('🟢 100%');
    if (f.isStartDevelopment) statusParts.push('🟡 Mulai Bangun');

    let result = parts.join(' › ');
    if (statusParts.length) {
        result += (result ? ' | ' : '') + statusParts.join(', ');
    }

    el.textContent = result ? `Filter: ${result}` : '';
}

/**
 * Programmatically set a filter value (for drill-down navigation).
 */
export async function setFilterProgrammatically(level, value) {
    const elProv = document.getElementById('filter-provinsi');
    const elKab = document.getElementById('filter-kabupaten');
    const elKec = document.getElementById('filter-kecamatan');
    const elDesa = document.getElementById('filter-desa');

    if (level === 'provinsi') {
        const opt = Array.from(elProv.options).find(o => o.text === value);
        if (opt) {
            elProv.value = opt.value;
            // Load kabupaten
            elKab.innerHTML = '<option value="">Memuat...</option>';
            const data = await fetchKabupaten(opt.value);
            elKab.innerHTML = '<option value="">Semua Kabupaten/Kota</option>';
            data.forEach(k => { elKab.innerHTML += `<option value="${k.id}">${k.nama}</option>`; });
            elKab.disabled = false;
            resetDropdown(elKec, 'Pilih Kabupaten dulu');
            resetDropdown(elDesa, 'Pilih Kecamatan dulu');
        }
    } else if (level === 'kabupaten') {
        const opt = Array.from(elKab.options).find(o => o.text === value);
        if (opt) {
            elKab.value = opt.value;
            elKec.innerHTML = '<option value="">Memuat...</option>';
            const data = await fetchKecamatan(opt.value);
            elKec.innerHTML = '<option value="">Semua Kecamatan</option>';
            data.forEach(k => { elKec.innerHTML += `<option value="${k.id}">${k.nama}</option>`; });
            elKec.disabled = false;
            resetDropdown(elDesa, 'Pilih Kecamatan dulu');
        }
    } else if (level === 'kecamatan') {
        const opt = Array.from(elKec.options).find(o => o.text === value);
        if (opt) {
            elKec.value = opt.value;
            elDesa.innerHTML = '<option value="">Memuat...</option>';
            const data = await fetchDesa(opt.value);
            elDesa.innerHTML = '<option value="">Semua Desa/Kelurahan</option>';
            data.forEach(d => { elDesa.innerHTML += `<option value="${d.id}">${d.nama}</option>`; });
            elDesa.disabled = false;
        }
    }

    // Sync state
    updateState('filters', {
        provinsiId: elProv.value,
        provinsiName: elProv.value ? elProv.options[elProv.selectedIndex]?.text : '',
        kabupatenId: elKab.value,
        kabupatenName: elKab.value ? elKab.options[elKab.selectedIndex]?.text : '',
        kecamatanId: elKec.value,
        kecamatanName: elKec.value ? elKec.options[elKec.selectedIndex]?.text : '',
        desaId: elDesa.value,
        desaName: elDesa.value ? elDesa.options[elDesa.selectedIndex]?.text : '',
    });
}

/**
 * Restore filter dropdowns to a specific state (for back navigation).
 */
export async function restoreFilters(state) {
    const elProv = document.getElementById('filter-provinsi');
    const elKab = document.getElementById('filter-kabupaten');
    const elKec = document.getElementById('filter-kecamatan');
    const elDesa = document.getElementById('filter-desa');

    if (state.level === 'Provinsi') {
        elProv.value = '';
        resetDropdown(elKab, 'Pilih Provinsi dulu');
        resetDropdown(elKec, 'Pilih Kabupaten dulu');
        resetDropdown(elDesa, 'Pilih Kecamatan dulu');
    } else if (state.level === 'Kabupaten/Kota') {
        elProv.value = state.provinsi;
        elKab.value = '';
        resetDropdown(elKec, 'Pilih Kabupaten dulu');
        resetDropdown(elDesa, 'Pilih Kecamatan dulu');
        if (state.provinsi) {
            const data = await fetchKabupaten(state.provinsi);
            elKab.innerHTML = '<option value="">Semua Kabupaten/Kota</option>';
            data.forEach(k => { elKab.innerHTML += `<option value="${k.id}">${k.nama}</option>`; });
            elKab.disabled = false;
        }
    } else if (state.level === 'Kecamatan') {
        elProv.value = state.provinsi;
        elKab.value = state.kabupaten;
        elKec.value = '';
        resetDropdown(elDesa, 'Pilih Kecamatan dulu');
        if (state.provinsi) {
            const kabData = await fetchKabupaten(state.provinsi);
            elKab.innerHTML = '<option value="">Semua Kabupaten/Kota</option>';
            kabData.forEach(k => { elKab.innerHTML += `<option value="${k.id}">${k.nama}</option>`; });
            elKab.disabled = false;
            elKab.value = state.kabupaten;
        }
        if (state.kabupaten) {
            const kecData = await fetchKecamatan(state.kabupaten);
            elKec.innerHTML = '<option value="">Semua Kecamatan</option>';
            kecData.forEach(k => { elKec.innerHTML += `<option value="${k.id}">${k.nama}</option>`; });
            elKec.disabled = false;
        }
    }

    // Sync state
    updateState('filters', {
        provinsiId: elProv.value,
        provinsiName: elProv.value ? elProv.options[elProv.selectedIndex]?.text : '',
        kabupatenId: elKab.value,
        kabupatenName: elKab.value ? elKab.options[elKab.selectedIndex]?.text : '',
        kecamatanId: elKec.value,
        kecamatanName: elKec.value ? elKec.options[elKec.selectedIndex]?.text : '',
        desaId: elDesa.value,
        desaName: elDesa.value ? elDesa.options[elDesa.selectedIndex]?.text : '',
    });
}
