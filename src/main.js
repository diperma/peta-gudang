/**
 * Main Application Entry Point
 * Peta Sebaran Pembangunan Gerai KDKMP v2.0
 */

// --- Styles ---
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './styles/index.css';
import './styles/components.css';
import './styles/map.css';

// --- Fix Leaflet default icon paths for Vite ---
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// --- Modules ---
import { fetchMarkers } from './services/api.js';
import { getApiFilters, setState } from './state/store.js';
import * as Header from './components/Header.js';
import * as FilterPanel from './components/FilterPanel.js';
import * as StatsCards from './components/StatsCards.js';
import * as DataTable from './components/DataTable.js';
import * as BarChart from './components/BarChart.js';
import * as MapView from './components/MapView.js';
import * as ProgressChart from './components/ProgressChart.js';
import * as Footer from './components/Footer.js';

/**
 * Build the app layout.
 */
function buildLayout() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="app-container">
      ${Header.render()}
      ${FilterPanel.render()}
      ${StatsCards.render()}
      ${DataTable.render()}
      ${BarChart.render()}
      ${ProgressChart.render()}
      ${MapView.render()}
      ${Footer.render()}
    </div>
  `;
}

/**
 * Load all data (markers + stats table).
 */
async function loadAllData() {
    const apiFilters = getApiFilters();

    MapView.showLoading('Memuat data marker...');

    try {
        const data = await fetchMarkers(apiFilters);
        setState('markers', data);

        MapView.displayMarkers(data);
        StatsCards.update(data);
        FilterPanel.updateFilterStatus();
        Footer.updateTimestamp();
    } catch (error) {
        console.error('Error loading markers:', error);
    }

    MapView.hideLoading();

    // Update stats table (independent)
    await DataTable.updateTable(apiFilters);
    BarChart.update();
    ProgressChart.update();
}

/**
 * Initialize the application.
 */
async function initApp() {
    buildLayout();

    // Init components
    MapView.init();
    await FilterPanel.init(loadAllData);
    DataTable.init(loadAllData);

    // Hide initial loader
    const loader = document.getElementById('initial-loader');
    if (loader) loader.classList.add('hidden');

    // Load initial data
    await loadAllData();
}

// --- Boot ---
document.addEventListener('DOMContentLoaded', initApp);
