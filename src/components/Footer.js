/**
 * Footer Component
 */

export function render() {
    return `
    <footer class="app-footer animate-fade-in-up delay-5">
      <div class="footer-left">
        <p>* Klik pada lingkaran angka untuk memperbesar area (Zoom-in).</p>
        <p>* Klik pada marker individu untuk melihat detail lokasi.</p>
        <div class="footer-legend">
          <span class="legend-item"><span class="legend-dot legend-dot--green"></span> 100% Selesai</span>
          <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span> Dalam Proses</span>
          <span class="legend-item"><span class="legend-dot legend-dot--gray"></span> Belum Mulai</span>
        </div>
      </div>
      <div class="footer-right">
        <p>Sumber: <a href="https://pemetaan-lahan.portalkdkmp.id" target="_blank">pemetaan-lahan.portalkdkmp.id</a></p>
        <p class="footer-timestamp" id="data-timestamp"></p>
      </div>
    </footer>
  `;
}

export function updateTimestamp() {
    const el = document.getElementById('data-timestamp');
    if (el) {
        el.textContent = `Data diambil: ${new Date().toLocaleString('id-ID')}`;
    }
}
