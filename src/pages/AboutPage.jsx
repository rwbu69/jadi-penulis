import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const IframeEmbed = ({ src, title }) => {
  // Try to clean up youtube links for proper embedding
  let embedUrl = src;
  if (src.includes('youtu.be')) {
    const id = src.split('youtu.be/')[1].split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${id}`;
  } else if (src.includes('reddit.com') && src.includes('/comments/')) {
    // Attempt reddit embed URL format
    const urlParts = src.split('?')[0];
    embedUrl = `https://www.redditmedia.com${urlParts.replace('https://www.reddit.com', '')}?ref_source=embed&ref=share&embed=true`;
  }

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 truncate pr-4">{title}</span>
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-indigo-600 hover:text-indigo-800 flex-shrink-0 flex items-center gap-1 font-bold bg-indigo-50 px-2 py-1 rounded"
        >
          Buka Link 
        </a>
      </div>
      <div className="w-full h-64 bg-slate-100 relative">
        <iframe 
          src={embedUrl}
          title={title}
          className="w-full h-full border-none absolute inset-0"
          sandbox="allow-scripts allow-same-origin allow-popups"
          loading="lazy"
        />
        {/* Helper text behind the iframe in case it's blocked by X-Frame-Options */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center -z-10 text-gray-400">
          <span className="text-xs font-medium">Beberapa situs memblokir akses iframe (X-Frame-Options).<br/>Silakan klik "Buka Link" di atas jika konten tidak muncul.</span>
        </div>
      </div>
    </div>
  );
};

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:opacity-90 transition-all duration-200">
            <Logo size="sm" />
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-slate-100 text-slate-600 border-slate-200">
            Tentang Kami & Referensi
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-all duration-200 ease-in-out"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 space-y-12">
        
        {/* Tentang Kami Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 animate-fade-in-up">
          <h1 className="text-3xl font-bold font-serif text-slate-800 mb-8 flex items-center gap-3">
            Tentang Kami
          </h1>
          
          <div className="prose prose-indigo max-w-none text-gray-600 text-base md:text-lg leading-relaxed space-y-6">
            <p>
              <strong className="text-slate-800">AKAL (Aksara | Karsa | Logika)</strong> lahir dari satu keprihatinan yang sederhana: terlalu banyak siswa Indonesia yang sebenarnya punya ide, tapi tidak tahu bagaimana menuangkannya ke dalam tulisan yang baik — dan tidak pernah mendapat umpan balik yang cukup untuk bertumbuh.
            </p>
            <p>
              Nama <strong className="text-indigo-600">AKAL</strong> merepresentasikan tiga pilar utama kemampuan berpikir dan berbahasa yang kami kembangkan:
            </p>
            
            {/* Tiga Pilar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col items-start">
                <div className="text-indigo-600 mb-3 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100/50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">Aksara</h4>
                <p className="text-sm text-gray-600">
                  Penguasaan media tulisan, tata bahasa, dan ejaan yang presisi sesuai standar EYD Edisi V untuk melahirkan komunikasi yang tertib dan santun.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col items-start">
                <div className="text-indigo-600 mb-3 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100/50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">Karsa</h4>
                <p className="text-sm text-gray-600">
                  Daya cipta, imajinasi, kehendak bebas, dan keberanian berekspresi secara orisinal melalui genre-genre kreatif dan eksplorasi tulisan tanpa ragu.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col items-start">
                <div className="text-indigo-600 mb-3 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100/50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a3 3 0 000-5.44M6.5 18.72a3 3 0 010-5.44M12 9.6a3 3 0 100-6 3 3 0 000 6zM12 9.6l3.5 6.3M12 9.6l-3.5 6.3" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">Logika</h4>
                <p className="text-sm text-gray-600">
                  Ketajaman penalaran, koherensi antar-argumen, serta penataan struktur berpikir objektif dan analitis dalam menguraikan suatu masalah.
                </p>
              </div>
            </div>

            <p>
              Kami adalah platform latihan menulis berbasis AI yang dirancang khusus untuk pelajar SMP dan SMA Indonesia. Di sini, kamu bisa berlatih melalui tiga jalur: <strong>Menulis Akademis</strong> untuk mengasah argumen dan struktur berpikir kritis (Logika), <strong>Menulis Kreatif</strong> untuk mengembangkan ekspresi dan imajinasi (Karsa), serta <strong>Menulis Cepat</strong> untuk melatih keberanian menulis secara spontan dan tangkas. Setiap tulisan yang kamu kirimkan akan langsung dievaluasi secara otomatis — bukan sekadar dicek ejaannya (Aksara), tapi dinilai secara menyeluruh oleh kecerdasan buatan terstandar.
            </p>

            <h3 className="text-xl font-bold text-slate-800 mt-10 mb-4">Mengapa Aplikasi Ini Diperlukan</h3>
            <p>
              Data berbicara keras. Berdasarkan Rapor Pendidikan 2023, hanya 49,26% siswa SMA yang memiliki kompetensi literasi di atas standar minimum — dan angka ini justru turun 4,59% dibandingkan tahun sebelumnya. Artinya, lebih dari separuh siswa SMA Indonesia belum mencapai kemampuan dasar yang diharapkan — dan tren-nya bergerak ke arah yang salah.
            </p>
            <p>
              Di panggung internasional, gambarannya tidak jauh berbeda. Skor literasi membaca Indonesia pada PISA 2022 mencatatkan nilai terendahnya sejak tahun 2000, yaitu 359 poin, masih jauh di bawah rata-rata internasional. Dalam PISA 2022, Indonesia menempati posisi ke-69 dari 80 negara yang berpartisipasi.
            </p>
            <p>
              Masalahnya bukan hanya soal membaca. Kemampuan menulis adalah keterampilan yang bahkan lebih jarang dilatih dan lebih jarang mendapat umpan balik langsung. Di dalam kelas, seorang guru dengan puluhan siswa tidak punya waktu untuk mengoreksi setiap tulisan secara mendalam dan konsisten. Akibatnya, banyak siswa menulis, mengumpulkan, dan tidak pernah tahu letak sesungguhnya kesalahan mereka — apalagi bagaimana cara memperbaikinya.
            </p>
            <p>
              Di sinilah teknologi bisa menjadi jembatan. Penelitian menunjukkan bahwa AI writing tools mampu memberikan umpan balik otomatis, memperbaiki kesalahan tata bahasa, serta memberikan saran perbaikan gaya penulisan secara instan, sehingga siswa dapat belajar menulis dengan lebih interaktif dan mandiri. Lebih jauh lagi, penggunaan AI sebagai alat bantu menulis terbukti dapat meningkatkan produktivitas, kualitas ide, dan struktur cerita yang dihasilkan oleh siswa SMA.
            </p>
            <p className="font-medium text-indigo-900 bg-indigo-50 p-6 rounded-xl border border-indigo-100 italic">
              <strong>AKAL</strong> bukan alat yang menulis untuk kamu. Kami adalah teman latihan yang hadir setiap saat — memberi penilaian yang jujur, konstruktif, dan spesifik, agar setiap sesi menulis menjadi satu langkah nyata menuju pemikiran dan tulisan yang lebih ber-AKAL.
            </p>
          </div>
        </section>

        {/* Referensi Section */}
        <section className="space-y-8 animate-fade-in-up-delay-1">
          <h2 className="text-2xl font-bold font-serif text-slate-800 flex items-center gap-3">
            Daftar Referensi & Embed Link
          </h2>

          <div className="space-y-10">
            {/* Category: LLM Model */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b border-gray-200 pb-2">LLM Model yang Digunakan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <IframeEmbed title="OpenAI gpt-oss-120b" src="https://developers.openai.com/api/docs/models/gpt-oss-120b" />
              </div>
            </div>

            {/* Category: Prompt Engineering */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b border-gray-200 pb-2">Prompt Engineering</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <IframeEmbed title="Prompt Engineering 101 (Reddit)" src="https://www.reddit.com/r/PromptEngineering/comments/1byj8pd/prompt_engineering_101/" />
                <IframeEmbed title="Prompt Engineering Best Practices (DigitalOcean)" src="https://www.digitalocean.com/resources/articles/prompt-engineering-best-practices" />
                <IframeEmbed title="What is Prompt Engineering (Google Cloud)" src="https://cloud.google.com/discover/what-is-prompt-engineering" />
              </div>
            </div>

            {/* Category: Typing Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b border-gray-200 pb-2">Typing Test & Cara Mengetik Cepat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <IframeEmbed title="TypingSpeedTest-JS (GitHub)" src="https://github.com/GaganpreetKaurKalsi/TypingSpeedTest-JS" />
                <IframeEmbed title="Tutorial Mengetik Cepat (YouTube)" src="https://youtu.be/hhIQStOZgJA?si=XxqEqHT4LRXQz5OG" />
              </div>
            </div>

            {/* Category: Standar Penulisan */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b border-gray-200 pb-2">Standar Penilaian Penulisan Akademis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <IframeEmbed title="Ejaan Bahasa Indonesia (Kemdikbud)" src="https://ejaan.kemendikdasmen.go.id/" />
                <IframeEmbed title="Materi Penulisan Akademis (PDF)" src="https://mkwk.unindra.ac.id/materi/media/p4.pdf" />
              </div>
            </div>

            {/* Category: Referensi Lain */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b border-gray-200 pb-2">Referensi Lain (Berita & Jurnal)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <IframeEmbed title="Rapor Pendidikan Indonesia 2023 (Pikiran Rakyat)" src="https://www.pikiran-rakyat.com/pendidikan/pr-017168357/rapor-pendidikan-indonesia-2023-kemampuan-literasi-siswa-di-kategori-sedang-sma-sederajat-alami-penurunan?page=all" />
                <IframeEmbed title="Hasil PISA: Minimnya Kemampuan Literasi (Kompasiana)" src="https://www.kompasiana.com/faiszatunnisak/67467f44ed64153d745c9af2/hasil-pisa-minimnya-kemampuan-literasi-siswa-indonesia" />
                <IframeEmbed title="Jurnal Kemampuan Literasi (Unimal)" src="https://ojs.unimal.ac.id/jmm/article/view/25194" />
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default AboutPage;
