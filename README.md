# ECO-GUARD ESP32 — Online Dashboard

Dashboard monitoring lingkungan rumah real-time via **MQTT WebSocket**.  
Dapat diakses oleh siapa saja tanpa memerlukan PC perantara yang menyala.

## 🚀 Cara Deploy ke GitHub Pages (5 Menit)

### Langkah 1: Buat Repositori GitHub
1. Login ke [github.com](https://github.com)
2. Klik **New Repository**
3. Nama repo: `esp32-monitor` (atau sesuai keinginan)
4. Pilih **Public** ✅
5. Klik **Create repository**

### Langkah 2: Upload File
Upload **2 file** dari folder ini ke repositori:
- `index.html`
- `style.css`

Caranya: Di halaman repo → klik **Add file** → **Upload files** → drag kedua file → klik **Commit changes**

### Langkah 3: Aktifkan GitHub Pages
1. Masuk ke **Settings** tab repositori
2. Scroll ke bagian **Pages** (di sidebar kiri)
3. Pada "Source" pilih: **Deploy from a branch**
4. Branch: `main`, Folder: `/ (root)`
5. Klik **Save**

### Langkah 4: Akses Dashboard
Dalam 1-2 menit, dashboard Anda aktif di:
```
https://<username-github>.github.io/esp32-monitor/
```

✅ **URL ini permanen dan dapat dibagikan ke siapa saja!**

---

## 📡 Cara Kerja

```
ESP32 → WiFi → broker.emqx.io:1883 (MQTT)
                       ↓
            browser.emqx.io:8084 (WebSocket/WSS)
                       ↓
           GitHub Pages Dashboard (index.html)
```

Data mengalir **otomatis dari ESP32 → cloud MQTT → browser pengunjung** tanpa perantara apapun!

## ⚙️ Konfigurasi MQTT di Dashboard

| Parameter | Nilai |
|---|---|
| Broker | `broker.emqx.io` |
| Port WebSocket | `8084 (WSS)` |
| Topik Sensor | `home/sensor_data` |
| Topik Alert | `home/alert` |

---

## 🔧 Troubleshooting

**Dashboard tidak menerima data?**
- Cek apakah ESP32 aktif (cek Serial Monitor untuk pesan `[MQTT] ✓ Data sensor dipublikasikan ke cloud.`)
- Buka browser developer console (F12) untuk pesan error
- Coba buka [MQTTX Web](https://mqttx.app/web) dan subscribe ke `home/#` untuk verifikasi data ESP32

**MQTT tidak terhubung?**
- Pastikan halaman dibuka via HTTPS (GitHub Pages sudah HTTPS secara default)
- Broker `wss://broker.emqx.io:8084` memerlukan koneksi HTTPS — jangan buka via `http://`
