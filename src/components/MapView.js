/**
 * MapView Component — Leaflet map with markers, clustering, and GPS.
 */
import L from 'leaflet';
import 'leaflet.markercluster';
import { fetchMarkerDetail } from '../services/api.js';
import { getMarkerColor, getStatusInfo } from '../utils/helpers.js';

let map = null;
let clusterGroup = null;
let gpsMarker = null;
let gpsCircle = null;
let gpsActive = false;

export function render() {
  return `
    <div class="glass-card map-section animate-fade-in-up delay-5" id="map-section" style="position:relative;">
      <div id="map"></div>
      <div class="map-loading-overlay" id="map-loading">
        <div class="map-loading-content">
          <div class="spinner"></div>
          <p id="map-loading-text">Memuat data dari API...</p>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  map = L.map('map').setView([-2.5489, 118.0149], 5);

  // Satellite tiles
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  }).addTo(map);

  // Labels overlay
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
    pane: 'overlayPane',
  }).addTo(map);

  clusterGroup = L.markerClusterGroup();
  map.addLayer(clusterGroup);

  initGpsControl();
}

export function showLoading(text) {
  const el = document.getElementById('map-loading');
  const textEl = document.getElementById('map-loading-text');
  if (el) el.classList.remove('hidden');
  if (textEl) textEl.textContent = text || 'Memuat data marker...';
}

export function hideLoading() {
  const el = document.getElementById('map-loading');
  if (el) el.classList.add('hidden');
}

export function displayMarkers(data) {
  clusterGroup.clearLayers();

  data.forEach(point => {
    const lat = parseFloat(point.lat);
    const lng = parseFloat(point.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const progress = parseFloat(point.percentage_development_progress) || 0;
    const isStarted = point.isStartDevelopment;
    const color = getMarkerColor(progress, isStarted);

    const icon = L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" class="marker-icon" viewBox="0 0 20 20" fill="${color}"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>`,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = L.marker([lat, lng], { icon });

    // Loading popup
    marker.bindPopup(`
      <div class="popup-loading">
        <div class="spinner-sm"></div>
        <p>Memuat data...</p>
      </div>
    `);

    // Fetch detail on popup open
    marker.on('popupopen', async () => {
      try {
        const detail = await fetchMarkerDetail(point.id);
        const dp = parseFloat(detail.percentage_development_progress) || 0;
        const ds = detail.isStartDevelopment;
        const status = getStatusInfo(dp, ds);

        marker.setPopupContent(`
          <div class="popup-content">
            <h3>${detail.nama || 'ID: ' + detail.id}</h3>
            <table class="popup-table">
              <tr><td class="popup-label">Lokasi</td><td class="popup-value">: ${detail.lokasi || '-'}</td></tr>
              <tr><td class="popup-label">Potensi</td><td class="popup-value">: ${detail.potensi || '-'}</td></tr>
              <tr><td class="popup-label">Luas Lahan</td><td class="popup-value">: ${detail.luasLahan ? detail.luasLahan + ' m²' : '-'}</td></tr>
              <tr><td class="popup-label">Status</td><td class="popup-value">: ${detail.statusPersetujuan || '-'}</td></tr>
              <tr><td class="popup-label">Progress</td><td class="popup-value">: ${dp.toFixed(2)}%</td></tr>
              <tr><td class="popup-label">Koordinat</td><td class="popup-value">: ${parseFloat(detail.latitude).toFixed(4)}, ${parseFloat(detail.longitude).toFixed(4)}</td></tr>
              ${detail.nama_kodim ? `<tr><td class="popup-label">Kodim</td><td class="popup-value">: ${detail.nama_kodim}</td></tr>` : ''}
            </table>
            <div class="popup-progress-bar">
              <div class="popup-progress-fill" style="width: ${Math.min(dp, 100)}%; background: ${status.barColor};"></div>
            </div>
            <div class="popup-footer">
              <span class="popup-status-badge" style="background: ${status.bg}; color: ${status.color};">${status.text}</span>
              <span class="popup-id">ID: ${detail.id}</span>
            </div>
            ${detail.catatan ? `<div class="popup-note"><strong>Catatan:</strong> ${detail.catatan}</div>` : ''}
            <div style="margin-top: 12px; border-top: 1px solid var(--border-glass); padding-top: 12px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${parseFloat(detail.latitude)},${parseFloat(detail.longitude)}"
                 target="_blank" class="popup-directions-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                Dapatkan Arah
              </a>
            </div>
          </div>
        `);
      } catch {
        marker.setPopupContent(`<div class="popup-error">Gagal memuat data</div>`);
      }
    });

    clusterGroup.addLayer(marker);
  });

  // Fit bounds
  if (data.length > 0) {
    const validPoints = data
      .map(d => [parseFloat(d.lat), parseFloat(d.lng)])
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));

    if (validPoints.length > 0) {
      const group = L.featureGroup(validPoints.map(p => L.marker(p)));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  setTimeout(() => map.invalidateSize(), 100);
}

/* =====================
   GPS Control
   ===================== */

function initGpsControl() {
  const GpsControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd() {
      const container = L.DomUtil.create('div', 'gps-control');
      container.id = 'gps-btn';
      container.title = 'Temukan lokasi saya';
      container.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
        </svg>`;
      L.DomEvent.disableClickPropagation(container);
      container.addEventListener('click', handleGpsClick);
      return container;
    },
  });

  map.addControl(new GpsControl());
  map.on('locationfound', onLocationFound);
  map.on('locationerror', onLocationError);
}

function handleGpsClick() {
  const btn = document.getElementById('gps-btn');

  if (gpsActive) {
    if (gpsMarker) { map.removeLayer(gpsMarker); gpsMarker = null; }
    if (gpsCircle) { map.removeLayer(gpsCircle); gpsCircle = null; }
    gpsActive = false;
    btn.classList.remove('active', 'locating');
    return;
  }

  btn.classList.add('locating');
  map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
}

function onLocationFound(e) {
  const btn = document.getElementById('gps-btn');
  btn.classList.remove('locating');
  btn.classList.add('active');
  gpsActive = true;

  const radius = e.accuracy / 2;

  if (gpsMarker) map.removeLayer(gpsMarker);
  if (gpsCircle) map.removeLayer(gpsCircle);

  const gpsIcon = L.divIcon({
    html: `<div class="gps-marker"><div class="gps-marker-pulse"></div><div class="gps-marker-dot"></div></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  gpsMarker = L.marker(e.latlng, { icon: gpsIcon, zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup(`<div style="text-align:center;padding:4px;color:var(--text-primary);"><strong>Lokasi Anda</strong><br><span style="font-size:11px;color:var(--text-muted);">Akurasi: ±${Math.round(radius)} m</span></div>`);

  gpsCircle = L.circle(e.latlng, {
    radius,
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
    weight: 1,
  }).addTo(map);
}

function onLocationError(e) {
  const btn = document.getElementById('gps-btn');
  btn.classList.remove('locating');
  alert('Gagal mendapatkan lokasi: ' + e.message);
}
