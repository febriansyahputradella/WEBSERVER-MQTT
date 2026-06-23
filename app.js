// =======================================================
// LOGGER & INITIALIZER DASHBOARD
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard IoT Terkoneksi. Menunggu data dari ESP32...");
  initChart();
  initSSE();
  initInteractions();
});

let historyChart;

// =======================================================
// INITIALIZATION GRAPH (CHART.JS)
// =======================================================
function initChart() {
  const ctx = document.getElementById('historyChart').getContext('2d');
  
  historyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], // Waktu data masuk (e.g. "14:23:45")
      datasets: [
        {
          label: 'Suhu (°C)',
          data: [],
          borderColor: '#ff7e5f',
          backgroundColor: 'rgba(255, 126, 95, 0.1)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Kelembaban (%)',
          data: [],
          borderColor: '#0072ff',
          backgroundColor: 'rgba(0, 114, 255, 0.1)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: true,
          yAxisID: 'y1'
        },
        {
          label: 'AQI Kualitas Udara',
          data: [],
          borderColor: '#38ef7d',
          backgroundColor: 'rgba(56, 239, 125, 0.1)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: true,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: {
              family: 'Plus Jakarta Sans',
              size: 11,
              weight: '600'
            },
            padding: 15
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleFont: { family: 'Outfit', size: 12, weight: '700' },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawTicks: false
          },
          ticks: {
            color: '#64748b',
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 15
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: 'rgba(255, 255, 255, 0.04)'
          },
          ticks: {
            color: '#ff7e5f',
            font: { size: 10 }
          },
          title: {
            display: true,
            text: 'Suhu (°C)',
            color: '#ff7e5f',
            font: { family: 'Outfit', size: 11, weight: '700' }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            color: '#0072ff',
            font: { size: 10 }
          },
          title: {
            display: true,
            text: 'Kelembaban (%)',
            color: '#0072ff',
            font: { family: 'Outfit', size: 11, weight: '700' }
          }
        },
        y2: {
          type: 'linear',
          display: false, // Disembunyikan gridnya agar rapi, namun data tetap disesuaikan dengan skala
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            color: '#38ef7d'
          }
        }
      }
    }
  });
}

// =======================================================
// GAUGE ROTATION MATH
// =======================================================
// Mengubah nilai stroke-dashoffset SVG secara dinamis
// Keliling lingkaran r=40 adalah 2 * PI * 40 ≈ 251.2
function updateGauge(id, value, min, max) {
  const bar = document.getElementById('gauge-' + id);
  const textVal = document.getElementById('val-' + id);
  
  if (!bar || !textVal) return;
  
  let numVal = parseFloat(value);
  if (isNaN(numVal)) return;
  
  // Batasi nilai agar tidak melampaui range gauge
  if (numVal < min) numVal = min;
  if (numVal > max) numVal = max;
  
  const percentage = ((numVal - min) / (max - min)) * 100;
  const offset = 251.2 - (percentage / 100) * 251.2;
  
  // Berikan efek transisi stroke dash
  bar.style.strokeDashoffset = offset;
  
  // Tampilkan angka dengan presisi yang sesuai
  if (id === 'press') {
    textVal.textContent = numVal.toFixed(1);
  } else if (id === 'aqi') {
    textVal.textContent = Math.round(numVal);
  } else {
    textVal.textContent = numVal.toFixed(1);
  }
}

// =======================================================
// COMFORT LEVEL BADGE CLASSIFICATION (HEAT INDEX)
// =======================================================
function updateComfortBadge(hiVal) {
  const badge = document.getElementById('badge-comfort');
  const textHI = document.getElementById('val-hi');
  
  if (!badge || !textHI) return;
  
  textHI.textContent = hiVal.toFixed(1);
  
  // Klasifikasi index kenyamanan berdasarkan standard Heat Index (°C):
  // < 27°C: Sangat Nyaman (Normal/Good)
  // 27°C - 32°C: Cukup Nyaman (Hati-hati)
  // 32°C - 41°C: Kurang Nyaman (Sangat Hati-hati)
  // >= 41°C: Bahaya / Sangat Panas
  if (hiVal < 27) {
    badge.textContent = "Sangat Nyaman";
    badge.className = "comfort-badge badge-good";
  } else if (hiVal < 32) {
    badge.textContent = "Cukup Nyaman";
    badge.className = "comfort-badge badge-moderate";
  } else if (hiVal < 41) {
    badge.textContent = "Kurang Nyaman";
    badge.className = "comfort-badge badge-warning";
  } else {
    badge.textContent = "Bahaya Panas";
    badge.className = "comfort-badge badge-danger";
  }
}

// =======================================================
// AIR QUALITY (AQI) TEXT & ALERT BANNER CLASSIFICATION
// =======================================================
function updateAQIStatus(aqiVal) {
  const lblStatus = document.getElementById('lbl-aqi-status');
  const banner = document.getElementById('alert-banner');
  const alertMsg = document.getElementById('alert-message');
  
  if (!lblStatus || !banner || !alertMsg) return;
  
  if (aqiVal <= 50) {
    lblStatus.textContent = "Baik (Good)";
    banner.classList.add('d-none');
  } else if (aqiVal <= 100) {
    lblStatus.textContent = "Sedang (Moderate)";
    banner.classList.add('d-none');
  } else if (aqiVal <= 150) {
    lblStatus.textContent = "Buruk (Unhealthy)";
    banner.classList.remove('d-none');
    banner.className = "alert-banner bg-warning-subtle text-warning border-warning mb-4 p-3 d-flex align-items-center justify-content-between rounded-3";
    alertMsg.textContent = "Kadar polutan sedang tinggi. Udara kurang sehat untuk pernapasan.";
  } else {
    lblStatus.textContent = "Bahaya (Hazardous)";
    banner.classList.remove('d-none');
    banner.className = "alert-banner bg-danger-subtle text-danger border-danger mb-4 p-3 d-flex align-items-center justify-content-between rounded-3";
    alertMsg.textContent = "Kualitas udara kritis! Hindari ventilasi luar ruangan dan gunakan masker.";
  }
}

// =======================================================
// VIRTUAL LED RGB GLOW COLOR MATCHING
// =======================================================
function updateVirtualLED(aqiVal) {
  const led = document.getElementById('led-indicator');
  if (!led) return;
  
  if (aqiVal <= 50) {
    // Hijau (Good)
    led.style.backgroundColor = '#10b981';
    led.style.boxShadow = '0 0 16px 2px #10b981, inset 0 0 4px rgba(255,255,255,0.6)';
  } else if (aqiVal <= 100) {
    // Biru (Moderate)
    led.style.backgroundColor = '#0ea5e9';
    led.style.boxShadow = '0 0 16px 2px #0ea5e9, inset 0 0 4px rgba(255,255,255,0.6)';
  } else if (aqiVal <= 150) {
    // Kuning/Oranye (Unhealthy)
    led.style.backgroundColor = '#f59e0b';
    led.style.boxShadow = '0 0 16px 2px #f59e0b, inset 0 0 4px rgba(255,255,255,0.6)';
  } else {
    // Merah (Danger)
    led.style.backgroundColor = '#ef4444';
    led.style.boxShadow = '0 0 16px 2px #ef4444, inset 0 0 4px rgba(255,255,255,0.6)';
  }
}

// =======================================================
// SERVER-SENT EVENTS (SSE) CONNECTION
// =======================================================
function initSSE() {
  if (!!window.EventSource) {
    const source = new EventSource('/events');
    
    source.addEventListener('open', function(e) {
      console.log("[SSE] Koneksi dengan ESP32 berhasil dibangun.");
    }, false);
    
    source.addEventListener('error', function(e) {
      if (e.target.readyState == EventSource.CLOSED) {
        console.warn("[SSE] Koneksi ditutup oleh server. Mencoba menghubungkan kembali...");
      } else if (e.target.readyState == EventSource.CONNECTING) {
        console.log("[SSE] Menghubungkan ulang...");
      }
    }, false);
    
    // Mendengarkan event 'sensor_data' yang dikirim ESP32
    source.addEventListener('sensor_data', function(e) {
      try {
        const data = JSON.parse(e.data);
        console.log("[SSE] Data baru diterima:", data);
        
        // 1. Update data numerik & gauge lingkaran
        updateGauge('temp', data.temperature, 15, 45);   // Range: 15°C - 45°C
        updateGauge('hum', data.humidity, 20, 100);      // Range: 20% - 100%
        updateGauge('press', data.pressure, 950, 1050);  // Range: 950 hPa - 1050 hPa
        updateGauge('aqi', data.aqi, 0, 200);            // Range: 0 - 200 AQI
        
        // 2. Update widget teks sekunder
        document.getElementById('val-ppm').textContent = data.ppm.toFixed(1) + ' ppm';
        document.getElementById('val-time').textContent = data.time;
        
        // 3. Klasifikasi & UI visual update
        updateComfortBadge(data.heatIndex);
        updateAQIStatus(data.aqi);
        updateVirtualLED(data.aqi);
        
        // 4. Update data grafik Chart.js
        if (historyChart) {
          historyChart.data.labels.push(data.time);
          historyChart.data.datasets[0].data.push(data.temperature);
          historyChart.data.datasets[1].data.push(data.humidity);
          historyChart.data.datasets[2].data.push(data.aqi);
          
          // Batasi grafik hanya menampilkan 180 titik (~30 menit dengan interval 10 detik)
          // Data terlama akan digeser (shift) keluar grafik secara otomatis
          if (historyChart.data.labels.length > 180) {
            historyChart.data.labels.shift();
            historyChart.data.datasets.forEach((dataset) => {
              dataset.data.shift();
            });
          }
          historyChart.update('none'); // Update tanpa animasi penuh agar tidak patah-patah
        }
        
      } catch (err) {
        console.error("[ERROR] Gagal memparsing data JSON SSE:", err);
      }
    }, false);
    
  } else {
    console.error("[ERROR] Browser tidak mendukung Server-Sent Events (SSE).");
    alert("Browser Anda tidak mendukung Server-Sent Events (SSE). Silakan gunakan Chrome, Edge, atau Firefox versi modern.");
  }
}

// =======================================================
// INTERACTION CONTROLS
// =======================================================
function initInteractions() {
  const btnDemo = document.getElementById('btn-demo');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      alert(
        "💡 INFORMASI SKEMA NOTIFIKASI & INDIKATOR KONTROL:\n\n" +
        "Sistem ini menggunakan status LED RGB untuk memberi peringatan visual:\n" +
        "🟢 AQI <= 50   : Kondisi BAIK (LED Hijau)\n" +
        "🔵 AQI 51-100  : Kondisi SEDANG (LED Biru)\n" +
        "🟡 AQI 101-150 : Kondisi BURUK (LED Oranye)\n" +
        "🔴 AQI > 150   : Kondisi BAHAYA (LED Merah) & Kirim Alert ke MQTT\n\n" +
        "Kirim MQTT Alert:\n" +
        "Ketika AQI melewati 100, ESP32 mempublikasikan alert bahaya secara asinkron ke broker MQTT publik pada topic: 'home/alert'"
      );
    });
  }
}
