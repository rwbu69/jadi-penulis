import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';
import { FALLBACK_PROMPTS } from '../config/fallbackData';

const WritingPage = () => {
  const { generateWritingPrompt, customApiKey } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'kreatif' ? 'kreatif' : 'akademis';

  const [prompt, setPrompt] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [promptVisible, setPromptVisible] = useState(false);
  const [userText, setUserText] = useState('');
  const [visible, setVisible] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [isOfflinePrompt, setIsOfflinePrompt] = useState(false);
  const navigate = useNavigate();

  // Guard against React Strict Mode double-firing during dev
  const promptFetched = useRef(null);

  // Mount animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const fetchPrompt = async () => {
    setLoadingPrompt(true);
    setPromptVisible(false);
    setRateLimitCountdown(0);
    setIsOfflinePrompt(false);
    try {
      const generated = await generateWritingPrompt(mode);
      setPrompt(generated);
    } catch (err) {
      console.error(err);
      if (err.status === 429) {
        setRateLimitCountdown(60);
        return;
      }
      toast.error('Gagal memuat topik dari AI. Menggunakan topik cadangan.');
      setIsOfflinePrompt(true);
      const fallbacks = FALLBACK_PROMPTS[mode] || FALLBACK_PROMPTS.akademis;
      const randomPrompt = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setPrompt(randomPrompt);
    } finally {
      setLoadingPrompt(false);
    }
  };

  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchPrompt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  useEffect(() => {
    // Only fetch if mode changed and it hasn't been fetched yet
    if (promptFetched.current === mode) return;
    promptFetched.current = mode;
    fetchPrompt();
  }, [mode]);

  // Prompt card visibility fade transition trigger
  useEffect(() => {
    if (!loadingPrompt && rateLimitCountdown === 0) {
      const timer = setTimeout(() => {
        setPromptVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loadingPrompt, rateLimitCountdown]);

  // Helper to calculate exact word count
  const getWordCount = (val) => {
    return val.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = getWordCount(userText);

  const handlePaste = (e) => {
    if (mode === 'kreatif') {
      e.preventDefault();
      toast.error('Untuk menghasilkan tulisan yang organik dan melatih daya pikir, lebih baik Anda mengetik tulisan secara langsung tanpa menyalin dari sumber lain.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userText.trim()) {
      toast.error('Tulisan Anda tidak boleh kosong!');
      return;
    }

    const words = getWordCount(userText);
    if (words <= 100) {
      toast.error(`Tulisan Anda harus lebih dari 100 kata untuk disubmit! (Saat ini: ${words} kata)`);
      return;
    }
    
    // Navigate and pass mode, prompt, and user text via route state
    navigate('/results', {
      state: {
        mode: mode,
        prompt: prompt,
        text: userText.trim(),
      },
    });
  };

  return (
    <div 
      className={`min-h-screen bg-white flex flex-col transition-all duration-500 ease-out transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Navigation Header */}
      <header className="border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-serif text-2xl text-slate-800 tracking-tight hover:text-indigo-600 transition-all duration-200">
            Belajar Menulis
          </Link>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            mode === 'kreatif' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            Mode: {mode === 'kreatif' ? 'Kreatif' : 'Akademis'}
          </span>
          {customApiKey && (
            <span className="text-[10px] px-2 py-1 rounded-full font-semibold border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5">
              <svg className="w-3 h-3 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m-2-2a2 2 0 11-2-2m2 2l-3 3m0 0l-3-3m3 3v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h8" />
              </svg>
              <span>Key Kustom Aktif</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/pilih"
            className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-all duration-200"
          >
            Ubah Mode
          </Link>
          <Link
            to="/nilai"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-all duration-200"
          >
            Nilai Saya
          </Link>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Column */}
        <div className="w-full md:w-1/2 p-6 md:p-12 border-b md:border-b-0 md:border-r border-gray-200 space-y-8">
          {/* Cara Menggunakan */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Cara Menggunakan</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm leading-relaxed">
              <li>Baca topik penulisan yang diberikan dengan saksama.</li>
              <li>Tulis satu paragraf {mode === 'kreatif' ? 'deskripsi atau narasi cerita' : 'akademis atau argumentatif'} untuk menjawab topik tersebut dengan <strong>minimal 101 kata</strong>.</li>
              <li>Klik tombol "Submit Tulisan" setelah selesai menulis.</li>
              <li>Tinjau umpan balik akademis yang diberikan oleh AI di halaman berikutnya.</li>
            </ol>
          </div>

          {/* Standar Penilaian */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Standar Penilaian ({mode === 'kreatif' ? 'Kreatif' : 'Akademis'})</h2>
            <p className="text-gray-600 text-sm">
              AI akan mengevaluasi tulisan Anda berdasarkan 5 kriteria berikut:
            </p>
            
            {mode === 'kreatif' ? (
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Kedalaman Deskripsi & Indra:</strong> Penggunaan panca indra untuk menggambarkan suasana, tokoh, atau latar secara hidup.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Kepatuhan Dasar EYD Edisi V:</strong> Kesesuaian ejaan kata baku, huruf kapital, tanda baca dengan toleransi artistik sastra.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Alur & Koherensi Naratif:</strong> Kelancaran penceritaan dan kepaduan rangkaian cerita antar kalimat.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Diksi & Majas:</strong> Pemilihan kata puitis, kaya kosakata, dan penggunaan gaya bahasa (majas) yang sesuai.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Orisinalitas Ide & Ekspresi:</strong> Keunikan gagasan, konsep cerita, atau sudut pandang penulisan.
                  </div>
                </li>
              </ul>
            ) : (
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Struktur Paragraf:</strong> Kelengkapan kalimat utama, kalimat penjelas, dan kalimat penutup.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Penggunaan EYD Edisi V:</strong> Ketepatan ejaan, penggunaan huruf kapital, dan tanda baca.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Kohesi dan Koherensi:</strong> Kepaduan hubungan antar kalimat sehingga paragraf mudah dipahami.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Diksi dan Kosakata:</strong> Pemilihan kata yang tepat, baku, dan bervariasi sesuai konteks akademis.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <div>
                    <strong className="text-slate-800">Kejelasan Ide:</strong> Kelogisan dan kejelasan gagasan yang disampaikan.
                  </div>
                </li>
              </ul>
            )}
          </div>

          {/* Warning Note */}
          <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs leading-relaxed space-y-1.5">
            <p><strong>Pemberitahuan Sistem:</strong> Aplikasi ini menggunakan Cerebras AI (gpt-oss-120b) dengan free tier 5 request per menit. Hindari melakukan submit terlalu cepat secara berturut-turut.</p>
            <p className="border-t border-amber-200 pt-1.5 text-[10px] italic">
              *Penting: Hasil evaluasi yang diberikan oleh AI bersifat membantu pembelajaran mandiri dan tidak mungkin 100% benar atau akurat secara mutlak.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full md:w-1/2 flex flex-col">
          {/* Top Section: Prompt Display */}
          <div className="p-6 md:p-12 border-b border-gray-200 flex-1 flex flex-col justify-center">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  Topik Penulisan Anda
                  {isOfflinePrompt && (
                    <span className="text-[10px] lowercase first-letter:uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-normal">
                      Topik Cadangan (Offline)
                    </span>
                  )}
                </h3>
                {!loadingPrompt && (
                  <button 
                    onClick={() => {
                      promptFetched.current = null; // force reload
                      fetchPrompt();
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-all duration-200"
                  >
                    <span>Ganti Topik</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
                    </svg>
                  </button>
                )}
              </div>

              {rateLimitCountdown > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-3 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
                  <span className="text-xs text-amber-700 font-semibold">
                    Rate limit tercapai. Mencoba ulang dalam {rateLimitCountdown} detik...
                  </span>
                </div>
              ) : loadingPrompt ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-500 animate-pulse">Membuat topik menulis baru...</span>
                </div>
              ) : (
                <div 
                  className={`bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm transition-opacity duration-300 ease-in ${
                    promptVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <p className="font-serif text-slate-800 text-base md:text-lg leading-relaxed">
                    {prompt}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Writing Form */}
          <div className="p-6 md:p-12 flex-1 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-1 justify-between">
              <div className="flex-1 flex flex-col">
                <label 
                  htmlFor="student-writing" 
                  className="block text-sm font-semibold text-slate-800 mb-2"
                >
                  Mulai menulis di bawah ini (minimal 101 kata):
                </label>
                <textarea
                  id="student-writing"
                  rows={8}
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={mode === 'kreatif' ? 'Tulis paragraf naratif atau deskriptif Anda di sini (harus lebih dari 100 kata)...' : 'Tulis paragraf tanggapan akademis Anda di sini (harus lebih dari 100 kata)...'}
                  className="w-full flex-1 p-4 border border-gray-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 resize-none transition-all duration-200"
                />
                <div className="text-right mt-2 flex justify-between items-center w-full">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${wordCount > 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {wordCount > 100 ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Lebih dari 100 kata</span>
                      </>
                    ) : `Kekurangan ${101 - wordCount} kata lagi`}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    Jumlah Kata: {wordCount} (Minimal 101 kata)
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loadingPrompt}
                  className={`w-full text-white font-semibold py-3 px-4 rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out flex items-center justify-center gap-2 ${
                    mode === 'kreatif' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <span>Submit Tulisan</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingPage;
