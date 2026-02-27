/**
 * Store — Simple reactive state management (pub/sub).
 */

const state = {
    markers: [],
    tableData: [],
    tableLevel: 'Provinsi',
    navigationHistory: [],
    sortColumn: 'persenPemetaan',
    sortDirection: 'desc',
    filters: {
        provinsiId: '',
        provinsiName: '',
        kabupatenId: '',
        kabupatenName: '',
        kecamatanId: '',
        kecamatanName: '',
        desaId: '',
        desaName: '',
        progress100: false,
        isStartDevelopment: false,
    },
    stats: {
        total: 0,
        started: 0,
        complete: 0,
    },
};

const listeners = {};

/**
 * Get current state value.
 */
export function getState(key) {
    return state[key];
}

/**
 * Set state and notify subscribers.
 */
export function setState(key, value) {
    state[key] = value;
    (listeners[key] || []).forEach(fn => fn(value));
}

/**
 * Subscribe to state changes.
 */
export function subscribe(key, callback) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);
    return () => {
        listeners[key] = listeners[key].filter(fn => fn !== callback);
    };
}

/**
 * Update a nested state (e.g. filters).
 */
export function updateState(key, partial) {
    const current = state[key];
    if (typeof current === 'object' && !Array.isArray(current)) {
        setState(key, { ...current, ...partial });
    } else {
        setState(key, partial);
    }
}

/**
 * Build API filter params from current filter state.
 */
export function getApiFilters() {
    const f = state.filters;
    return {
        provinsi: f.provinsiName || '',
        kabupaten: f.kabupatenName || '',
        kecamatan: f.kecamatanName || '',
        desa: f.desaName || '',
        progress100: f.progress100,
        isStartDevelopment: f.isStartDevelopment,
    };
}

/**
 * Push navigation state for table drill-down.
 */
export function pushNavigation(entry) {
    state.navigationHistory.push(entry);
    setState('navigationHistory', [...state.navigationHistory]);
}

/**
 * Pop last navigation entry.
 */
export function popNavigation() {
    const entry = state.navigationHistory.pop();
    setState('navigationHistory', [...state.navigationHistory]);
    return entry;
}
