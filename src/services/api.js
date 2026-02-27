/**
 * API Service — centralized fetch wrapper for KDKMP portal.
 */

const API_BASE = 'https://pemetaan-lahan.portalkdkmp.id/api';
const DASHBOARD_BASE = 'https://pemetaan-lahan.portalkdkmp.id';

let cachedInertiaVersion = null;

/**
 * Generic fetch with error handling.
 */
async function request(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/* =====================
   Filter Endpoints
   ===================== */

export async function fetchProvinces() {
    const data = await request(`${API_BASE}/filters/provinsi`);
    return data.filter(p => p.id !== 0);
}

export async function fetchKabupaten(provinsiId) {
    return request(`${API_BASE}/filters/kabupaten-kota?provinsi_ids[]=${provinsiId}`);
}

export async function fetchKecamatan(kabupatenId) {
    return request(`${API_BASE}/filters/kecamatan?kabupaten_ids[]=${kabupatenId}`);
}

export async function fetchDesa(kecamatanId) {
    return request(`${API_BASE}/filters/desa?kecamatan_ids[]=${kecamatanId}`);
}

/* =====================
   Map Markers
   ===================== */

export async function fetchMarkers(filters = {}) {
    const params = new URLSearchParams({
        per_page: 1000,
        page: 1,
        include_rejected: 0,
        luas_dibawah_600: 0,
        is_start_development: filters.isStartDevelopment ? 1 : 0,
        progress_100_percent: filters.progress100 ? 1 : 0,
        sort_column: 'id',
        sort_direction: 'desc',
    });

    if (filters.provinsi) params.append('provinsi[0]', filters.provinsi);
    if (filters.kabupaten) params.append('kabupaten_kota[0]', filters.kabupaten);
    if (filters.kecamatan) params.append('kecamatan[0]', filters.kecamatan);
    if (filters.desa) params.append('desa_kelurahan[0]', filters.desa);

    const result = await request(`${API_BASE}/map/markers?${params}`);
    if (result.success && result.data) return result.data;
    throw new Error('Invalid response format');
}

export async function fetchMarkerDetail(id) {
    const result = await request(`${API_BASE}/map/marker/${id}`);
    if (result.success && result.data) return result.data;
    throw new Error('Invalid marker detail response');
}

/* =====================
   Dashboard / Inertia
   ===================== */

async function getInertiaVersion() {
    if (cachedInertiaVersion) return cachedInertiaVersion;

    try {
        const resp = await fetch(`${DASHBOARD_BASE}/dashboard-lahan`, {
            method: 'GET',
            headers: { Accept: 'text/html' },
        });
        const html = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const appDiv = doc.getElementById('app');

        if (appDiv?.hasAttribute('data-page')) {
            const pageData = JSON.parse(appDiv.getAttribute('data-page'));
            if (pageData?.version) {
                cachedInertiaVersion = pageData.version;
                return pageData.version;
            }
        }
    } catch {
        // Silently fail — will use fallback
    }
    return null;
}

export async function fetchDashboardData(filters = {}) {
    const version = await getInertiaVersion();
    if (!version) return null;

    const params = new URLSearchParams({
        per_page: 25,
        page: 1,
        include_rejected: 0,
        luas_dibawah_600: 0,
        is_start_development: filters.isStartDevelopment ? 1 : 0,
        progress_100_percent: filters.progress100 ? 1 : 0,
        sort_column: 'id',
        sort_direction: 'desc',
    });

    if (filters.provinsi) params.append('provinsi[]', filters.provinsi);
    if (filters.kabupaten) params.append('kabupaten_kota[]', filters.kabupaten);
    if (filters.kecamatan) params.append('kecamatan[]', filters.kecamatan);
    if (filters.desa) params.append('desa_kelurahan[]', filters.desa);

    try {
        const resp = await fetch(`${DASHBOARD_BASE}/dashboard-lahan?${params}`, {
            headers: {
                'X-Inertia': 'true',
                'X-Inertia-Version': version,
                Accept: 'application/json',
            },
        });

        if (resp.status === 409) {
            cachedInertiaVersion = null;
            return null;
        }
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();
        return data.props || null;
    } catch {
        return null;
    }
}

export async function fetchProvinceStatsFallback(filters = {}) {
    const params = new URLSearchParams({
        per_page: 100,
        page: 1,
        include_rejected: 0,
        luas_dibawah_600: 0,
        is_start_development: filters.isStartDevelopment ? 1 : 0,
        progress_100_percent: filters.progress100 ? 1 : 0,
        sort_column: 'id',
        sort_direction: 'desc',
    });

    if (filters.provinsi) params.append('provinsi[]', filters.provinsi);
    if (filters.kabupaten) params.append('kabupaten_kota[]', filters.kabupaten);
    if (filters.kecamatan) params.append('kecamatan[]', filters.kecamatan);

    const result = await request(`${API_BASE}/dashboard/province-statistics?${params}`);
    if (result.stats?.provinsiData) {
        return {
            levelData: result.stats.provinsiData,
            totals: result.stats.totals || {},
        };
    }
    return null;
}
