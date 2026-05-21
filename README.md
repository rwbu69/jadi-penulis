# AKAL - Platform Latihan Menulis Akademik dan Kreatif

AKAL (Aksara | Karsa | Logika) adalah sebuah aplikasi web interaktif berbasis React, Vite, dan Tailwind CSS yang dirancang sebagai platform latihan menulis mandiri bagi pelajar Indonesia. Aplikasi ini mengintegrasikan kecerdasan buatan (LLM) untuk memberikan umpan balik, evaluasi tulisan, hingga analisis performa mengetik.

---

## Fitur Utama & Cara Kerja Aplikasi

Aplikasi ini dibagi menjadi beberapa fitur utama yang bekerja secara sinergis:

### 1. Jalur Pembelajaran & Umpan Balik AI
- **Menulis Akademis**: Melatih argumen dan struktur berpikir kritis (Logika) dengan skala penilaian 1-4.
- **Menulis Kreatif**: Melatih ekspresi, majas, dan imajinasi sastra (Karsa).
- **Koreksi Spesifik (Inline Feedback)**: Secara cerdas menyorot (highlight) ejaan yang salah di teks pengguna layaknya Grammarly, memberikan saran koreksi secara langsung pada kata tersebut menggunakan fungsi parser respons AI (Aksara).

**Cara Kerja AI (Prompt Engineering):**
Aplikasi mengirimkan permintaan ke API LLM dengan instruksi spesifik. 
- *Generator Topik* dipaksa untuk menghasilkan hanya instruksi/pertanyaan berbobot (menghindari hasil klise).
- *Evaluator* dilengkapi dengan **Few-Shot Examples** dan aturan pedoman baku (EYD V). Evaluator membedah tulisan per kriteria untuk menghasilkan XML/Plaintext yang terstruktur (`[Koreksi]: "salah" -> "benar"`).

### 2. Tes Menulis Cepat (Typing Test)
Fitur latihan untuk mengasah ketangkasan jari-jemari. Teks latihan di-generate secara dinamis menggunakan AI untuk mencegah pengguna menghafal teks.

**Sistem Perhitungan (Kalkulasi):**
Aplikasi menggunakan rumus baku untuk menghitung performa mengetik pengguna:
- **WPM (Words Per Minute)**: Dihitung dengan rumus `(Total Karakter / 5) / Waktu Berlalu (Menit)`. Mengapa dibagi 5? Karena rata-rata satu "kata" direpresentasikan oleh 5 karakter termasuk spasi.
- **CPM (Characters Per Minute)**: Dihitung dengan `Total Karakter / Waktu Berlalu (Menit)`.
- **Akurasi**: Persentase `(Karakter Benar / Total Karakter) * 100`. Setiap huruf, spasi, dan tanda baca dihitung.
- **Konsistensi (Deviasi)**: Dihitung menggunakan **Standar Deviasi**. Aplikasi mengambil sampel WPM Anda setiap 5 detik. Perbedaan varian antara sampel-sampel ini diukur untuk menentukan konsistensi. Semakin rendah angkanya, semakin konsisten kecepatan Anda.

### 3. Dasbor Kemajuan Latihan & Riwayat Nilai
- **Pencapaian (Achievements)**: Sistem memberikan lencana secara otomatis (contoh: *Langkah Pertama*, *Konsisten*, *Si Kilat*, *Penembak Jitu*, dan *Pujangga*) berdasarkan data rekam jejak yang dievaluasi di `localStorage`.
- **Grafik Perkembangan**: Hasil akhir dan umpan balik pengguna divisualisasikan dalam bentuk grafik garis (line chart) untuk menganalisis perkembangan kompetensi secara jangka panjang.

---

## Panduan Instalasi dan Setup Lokal

Untuk menjalankan aplikasi ini secara lokal menggunakan Bun, ikuti langkah-langkah di bawah ini.

### Prasyarat
- **Bun** runtime installed (rekomendasi) atau **Node.js** versi 18 atau yang lebih baru.
- Kunci API (API Key) dari Cerebras Cloud.

### Langkah-Langkah

1. **Clone Repository**
   ```bash
   git clone https://github.com/rwbu69/akal-aksara-karsa-logika.git
   cd akal-aksara-karsa-logika
   ```

2. **Instal Dependensi**
   Menggunakan Bun:
   ```bash
   bun install
   ```
   Atau menggunakan npm:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**
   Buat sebuah file baru bernama `.env` di *root directory* proyek, lalu masukkan kunci API Anda:
   ```env
   VITE_CEREBRAS_API_KEY=masukkan_kunci_api_cerebras_anda_di_sini
   ```

4. **Jalankan Development Server**
   Menggunakan Bun:
   ```bash
   bun run dev
   ```
   Atau menggunakan npm:
   ```bash
   npm run dev
   ```
   Aplikasi akan dapat diakses di browser melalui tautan http://localhost:5173.

---

## Cara Mendapatkan API Key & Referensi LLM Model

Aplikasi ini menggunakan model kecerdasan buatan dari ekosistem gpt-oss-120b. Anda harus mendaftar dan men-generate API key untuk menggunakannya.

1. Buka halaman pengembang untuk Cerebras AI atau API Provider Anda.
2. Buat akun (atau masuk jika sudah memiliki akun).
3. Arahkan ke dasbor "API Keys" pada pengaturan akun Anda.
4. Klik Create new secret key dan salin API Key yang diberikan. (Jangan pernah membagikan kunci rahasia ini ke publik!)
5. Tempel API key tersebut ke dalam file .env yang Anda buat pada tahap instalasi di atas, atau masukkan langsung lewat UI form di halaman Splash Page aplikasi.

**Referensi LLM Model yang Digunakan:**  
Seluruh ulasan kecerdasan buatan dalam aplikasi ini digerakkan oleh instruksi (prompting) pada model gpt-oss-120b. Untuk rujukan teknis spesifikasi model yang digunakan, silakan kunjungi dokumentasi resminya:
[OpenAI API Docs: gpt-oss-120b Model](https://developers.openai.com/api/docs/models/gpt-oss-120b)

---

## Konfigurasi Teknis (Proxy CORS)

Jika Anda melihat file vite.config.js, aplikasi ini telah dikonfigurasi untuk mem-bypass CORS (Cross-Origin Resource Sharing) yang biasa terjadi saat melakukan API Request dari browser lokal (client-side) ke penyedia API jarak jauh. Konfigurasi server.proxy diatur untuk meneruskan setiap request yang berawalan /cerebras menuju server API yang sebenarnya.
