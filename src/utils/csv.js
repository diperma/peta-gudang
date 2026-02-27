/**
 * CSV Export utility.
 */
import { getItemName, parsePercent } from './helpers.js';

/**
 * Download current table data as CSV file.
 */
export function downloadCSV(data, level) {
    if (!data || data.length === 0) {
        alert('Tidak ada data untuk diunduh');
        return;
    }

    const headers = ['No', level, 'Jumlah Desa', 'Lahan Terdaftar', '% Pemetaan', '% Pembangunan'];

    const rows = data.map((item, i) => {
        const name = getItemName(item);
        const pctPemetaan = parsePercent(item.persenPemetaan);
        const pctPembangunan = parsePercent(item.persenPembangunan);

        return [
            item.no || i + 1,
            `"${name.replace(/"/g, '""')}"`,
            item.jumlahDesa || 0,
            item.pemetaanMasuk || 0,
            pctPemetaan.toFixed(2),
            pctPembangunan.toFixed(2),
        ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `rekap_data_${level.toLowerCase().replace(/\//g, '_')}_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
