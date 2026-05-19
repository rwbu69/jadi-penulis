import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const OptionPage = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Left Column - Penjelasan Prompt Engineering */}
      <div 
        className={`w-full md:w-1/2 px-6 py-12 md:px-16 md:py-20 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200 transition-all duration-700 ease-out transform ${
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        }`}
      >
        <div className="max-w-xl space-y-8">
          <div>
            <h1 className="text-4xl font-bold font-serif text-slate-800 tracking-tight">
              Pilih Fokus Latihan Anda
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Pahami perbedaan pendekatan arahan kecerdasan buatan (Prompt Engineering) untuk membantu Anda berlatih menulis secara efektif.
            </p>
          </div>

          <div className="space-y-6">
            {/* Akademis Section */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                Mode Penulisan Akademis
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dioptimalkan untuk mengevaluasi tulisan ilmiah, eksposisi, dan argumentasi. AI diinstruksikan untuk menganalisis kepaduan kalimat utama/penjelas, kesesuaian dengan standar ejaan formal (EYD Edisi V), kekuatan logika ide, dan penggunaan kosakata baku secara ketat.
              </p>
            </div>

            {/* Kreatif Section */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Mode Penulisan Kreatif
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dioptimalkan untuk melatih imajinasi, penulisan naratif, dan deskripsi suasana. AI akan memandu Anda menulis paragraf menggunakan panca indra (penglihatan, pendengaran, rasa), alur cerita yang mengalir, keunikan konsep ide, serta penggunaan majas/figur bahasa yang ekspresif dengan toleransi estetika sastra.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Mode Action Buttons */}
      <div 
        className={`w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-16 md:px-16 space-y-6 transition-all duration-700 ease-out transform delay-300 ${
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        }`}
      >
        <div className="w-full max-w-sm flex flex-col gap-4">
          <button
            onClick={() => navigate('/write?mode=akademis')}
            className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl text-lg font-semibold shadow-sm hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out text-center"
          >
            Penulisan Akademis
          </button>
          
          <button
            onClick={() => navigate('/write?mode=kreatif')}
            className="w-full bg-emerald-600 text-white py-4 px-6 rounded-xl text-lg font-semibold shadow-sm hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out text-center"
          >
            Penulisan Kreatif
          </button>

          <Link
            to="/nilai"
            className="text-center text-sm font-semibold text-gray-500 hover:text-indigo-600 mt-2 transition-all duration-200"
          >
            Lihat Riwayat Nilai Saya
          </Link>

          <div className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3 mt-4 leading-relaxed">
            *Pengingat: Penilaian dari AI (gpt-oss-120b) tidak mungkin 100% benar dan bersifat subjektif sebagai bahan belajar mandiri.
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionPage;
