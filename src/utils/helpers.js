/**
 * Helpers — formatting & utility functions.
 */

/**
 * Format number with locale separators.
 */
export function formatNumber(n) {
    return (n || 0).toLocaleString('id-ID');
}

/**
 * Get CSS class for percentage badge.
 */
export function getPercentBadgeClass(pct) {
    if (pct >= 75) return 'pct-badge--high';
    if (pct >= 50) return 'pct-badge--mid';
    if (pct >= 25) return 'pct-badge--low';
    return 'pct-badge--zero';
}

/**
 * Get marker color based on progress.
 */
export function getMarkerColor(progress, isStarted) {
    if (progress >= 100) return '#10b981';
    if (isStarted) return '#f59e0b';
    return '#64748b';
}

/**
 * Get status text and color for popup.
 */
export function getStatusInfo(progress, isStarted) {
    if (progress >= 100) {
        return {
            text: 'SELESAI',
            bg: 'rgba(16,185,129,0.15)',
            color: '#34d399',
            barColor: '#10b981',
        };
    }
    if (isStarted) {
        return {
            text: 'DALAM PROSES',
            bg: 'rgba(245,158,11,0.15)',
            color: '#fbbf24',
            barColor: '#f59e0b',
        };
    }
    return {
        text: 'BELUM MULAI',
        bg: 'rgba(100,116,139,0.15)',
        color: '#94a3b8',
        barColor: '#64748b',
    };
}

/**
 * Get bar chart gradient color for a percentage.
 */
export function getBarGradient(pct) {
    if (pct >= 75) return 'linear-gradient(90deg, #059669, #10b981)'; /* Emerald/Deep Green */
    if (pct >= 50) return 'linear-gradient(90deg, #34d399, #10b981)'; /* Light Green -> Emerald */
    if (pct >= 25) return 'linear-gradient(90deg, #fbbf24, #f59e0b)'; /* Amber/Yellow -> Orange */
    return 'linear-gradient(90deg, #f97316, #ea580c)'; /* Orange */
}

/**
 * Parse a percentage value from mixed types.
 */
export function parsePercent(val) {
    if (typeof val === 'number') return val;
    return parseFloat(val) || 0;
}

/**
 * Get the name field from a level-data item.
 */
export function getItemName(item) {
    return item.provinsi || item.kabupaten || item.kecamatan || item.desa || '-';
}

/**
 * Animate a number counting up in an element.
 */
export function animateCounter(el, targetValue, duration = 800) {
    const start = performance.now();
    const startValue = 0;

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (targetValue - startValue) * eased);
        el.textContent = current.toLocaleString('id-ID');
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}
