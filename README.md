# Jadi Penulis - Platform Latihan Menulis Akademik dan Kreatif

Jadi Penulis adalah sebuah aplikasi web berbasis React, Vite, dan Tailwind CSS yang dirancang sebagai platform latihan menulis mandiri bagi pelajar Indonesia. Aplikasi ini memanfaatkan integrasi kecerdasan buatan (LLM) gpt-oss-120b melalui API Cerebras AI untuk memberikan umpan balik dan evaluasi instan terhadap kualitas tulisan pengguna.

## Fitur Utama

1. Jalur Pembelajaran Ganda
   - Penulisan Akademis: Fokus pada tulisan argumentatif, ilmiah, dan formal dengan kriteria penilaian terstandar.
   - Penulisan Kreatif: Fokus pada tulisan deskriptif, naratif, dan sastra menggunakan kiasan atau majas.

2. Batasan Minimum Tulisan
   - Mewajibkan penginputan paragraf dengan panjang lebih dari 100 kata (minimal 101 kata) untuk memaksa pengguna menyusun argumen atau deskripsi secara mendalam.

3. Sistem Penilaian Terperinci
   - Memberikan umpan balik instan berupa skor 1 sampai 4 pada setiap kriteria serta kalkulasi total skor maksimal 20. Umpan balik dipisahkan secara terstruktur ke dalam aspek Kekuatan Utama dan Area Perbaikan berdasarkan pedoman Ejaan Bahasa Indonesia yang Disempurnakan (EYD) Edisi V.

4. Grafik Perkembangan Kompetensi
   - Menyajikan dashboard analisis statistik yang secara otomatis menghitung rata-rata skor per kriteria dari seluruh riwayat latihan pengguna dan menentukan kekuatan utama serta aspek yang memerlukan perhatian lebih.

5. Penyimpanan Lokal dan Fleksibilitas API Key
   - Riwayat latihan disimpan secara lokal di dalam browser (Local Storage) untuk menjaga privasi data.
   - Pengguna dapat memilih untuk menggunakan kunci API default dari sistem atau menggunakan kunci API kustom milik pribadi yang disimpan aman secara lokal.

## Cara Kerja Aplikasi

1. Pemilihan Jalur (Track Selection)
   - Pengguna memilih antara jalur Akademis atau Kreatif di halaman pilihan. Sistem menetapkan context parameter dan instruksi sistem yang sesuai.

2. Pengambilan Topik (Prompt Generation)
   - Sistem mengirimkan permintaan ke endpoint /v1/chat/completions Cerebras AI dengan instruksi sistem generator topik. Model mengembalikan topik bertipe perintah (imperatif) atau pertanyaan (interogatif).

3. Penulisan dan Validasi Word Count
   - Pengguna menulis tanggapan mereka terhadap topik di area teks. Validasi dilakukan di sisi klien untuk memastikan panjang tulisan telah melebihi 100 kata sebelum memperbolehkan pengiriman data ke server.

4. Evaluasi AI (Evaluation & Assessment)
   - Esai dikirimkan ke endpoint evaluasi dengan menyertakan rubrik penilaian yang ketat. Respons yang diterima kemudian di-parse di sisi klien untuk mengonversi tag ulasan dan skor numerik menjadi visualisasi antarmuka (badge pill dan kartu penilaian).

5. Penyimpanan Riwayat & Visualisasi Data
   - Hasil akhir disimpan ke dalam riwayat lokal. Halaman Nilai Saya mengolah riwayat ini untuk menghitung rata-rata nilai kriteria, menampilkan grafik batang kompetensi, serta memetakan kelemahan berdasarkan analisis kata kunci.

## Metode Prompt Engineering

Aplikasi ini menggunakan teknik System Prompting terstruktur dan Few-Shot Prompting untuk memandu model gpt-oss-120b menghasilkan respons yang konsisten, berformat baku, dan akurat.

### 1. Generator Topik (Topic Generator Prompt)
Prompt sistem dirancang khusus untuk membatasi model agar tidak memberikan penjelasan tambahan selain teks topik, serta dilengkapi instruksi penjelajahan topik agar tidak monoton.
- Akademis: Memerintahkan model untuk merumuskan topik akademis/ilmiah populer yang memicu pemikiran kritis. Format harus berupa satu kalimat pertanyaan (interogatif) atau perintah (imperatif) dengan panjang 2-3 kalimat. Model diperintahkan mengeksplorasi domain bahasan yang luas (seperti teknologi masa depan, kecerdasan buatan, kesehatan mental, etika sains, literasi digital, ekonomi, budaya lokal, dll.) dan dilarang menggunakan topik-topik klise yang berulang.
- Kreatif: Memerintahkan model untuk merumuskan topik deskriptif atau skenario awal narasi yang memicu daya imajinasi sastra. Format harus berupa satu kalimat arahan bersastra dengan panjang 2-3 kalimat. Model diperintahkan mengeksplorasi ragam genre dan latar suasana (seperti realisme magis, solarpunk/distopia, latar pedesaan/perkotaan khas Indonesia, emosi abstrak, fantasi kosmik, dll.) untuk menghadirkan stimulasi imajinasi yang unik.

### 2. Evaluator Esai (Essay Evaluator Prompt)
Prompt sistem mencakup rubrik penilaian terstandar berskala 1-4 untuk masing-masing kriteria.
- Kriteria Akademis: Struktur Paragraf, Penggunaan EYD Edisi V, Kohesi & Koherensi, Diksi & Kosakata, serta Kejelasan Ide.
- Kriteria Kreatif: Kedalaman Deskripsi & Indra, Dasar EYD Sastra, Alur & Koherensi Naratif, Diksi & Majas, serta Orisinalitas Ide.
- Few-Shot Examples: Menyertakan contoh format output XML/Plaintext baku dalam instruksi sistem untuk menjamin format keluaran selalu mengandung tag penanda:
  - Skor kriteria: "Skor: [nilai]/4"
  - Kekuatan utama: "**Kekuatan**"
  - Area kelemahan: "**Area Perbaikan**"
  - Skor total: "Total Skor: [nilai]/20"
- Pedoman EYD V: Menginstruksikan model untuk merujuk pada pedoman resmi tata bahasa Indonesia (seperti penulisan huruf kapital, kata depan di/ke, dan tanda baca).

## Panduan Instalasi dan Setup

### Prasyarat
- Node.js versi 18 atau yang lebih baru.
- Kunci API dari Cerebras Cloud (opsional, jika tidak ingin memakai default).

### Langkah-Langkah Setup

1. Clone Repository
   ```bash
   git clone https://github.com/rwbu69/jadi-penulis.git
   cd jadi-penulis
   ```

2. Instal Dependensi
   Jalankan perintah berikut untuk mengunduh dan menginstal pustaka-pustaka yang diperlukan:
   ```bash
   npm install
   ```

3. Konfigurasi Environment
   Buat file bernama `.env` di direktori root proyek dan masukkan kunci API Cerebras Anda:
   ```env
   VITE_CEREBRAS_API_KEY=masukkan_kunci_api_cerebras_anda_di_sini
   ```

4. Jalankan Development Server
   Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di alamat http://localhost:5173.

5. Kompilasi Produksi
   Untuk membuat bundel produksi yang optimal:
   ```bash
   npm run build
   ```
   Hasil build akan disimpan di dalam direktori `dist`.

## Konfigurasi Teknis Proxy

Untuk menghindari kendala CORS (Cross-Origin Resource Sharing) selama pengembangan di lingkungan lokal, konfigurasi server pengembangan di dalam `vite.config.js` diatur untuk meneruskan permintaan dari endpoint `/cerebras` ke API resmi Cerebras:

```javascript
server: {
  proxy: {
    '/cerebras': {
      target: 'https://api.cerebras.ai',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/cerebras/, ''),
    },
  },
}
```
Setiap panggilan API di dalam kode aplikasi cukup diarahkan ke `/cerebras/v1/chat/completions` dengan melampirkan header otorisasi yang sesuai.
