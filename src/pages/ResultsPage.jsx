import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';

const ResultsPage = () => {
  const { evaluateWriting, saveToHistory } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const { mode, prompt, text } = location.state || {};
  const [evaluation, setEvaluation] = useState('');
  const [loading, setLoading] = useState(true);
  const [resultsVisible, setResultsVisible] = useState(false);

  // Guard against React Strict Mode double-firing during dev
  const evaluationFetched = useRef(false);

  // Guard: if no prompt/text, redirect to /pilih
  useEffect(() => {
    if (!prompt || !text) {
      toast.error('Data tulisan tidak ditemukan, kembali ke halaman utama.');
      navigate('/pilih');
    }
  }, [prompt, text, navigate]);

  useEffect(() => {
    if (!prompt || !text) return;
    if (evaluationFetched.current) return;
    evaluationFetched.current = true;

    const fetchEvaluation = async () => {
      setLoading(true);
      try {
        const feedback = await evaluateWriting(mode || 'akademis', prompt, text);
        setEvaluation(feedback);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Gagal memuat evaluasi AI. Silakan coba kirim ulang.');
        // Reset fetch guard on failure so they can try again if they navigate back
        evaluationFetched.current = false;
        navigate(`/write?mode=${mode || 'akademis'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [prompt, text, mode]);

  // Results visible transition trigger
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setResultsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setResultsVisible(false);
    }
  }, [loading]);

  const handleSave = () => {
    if (!prompt || !text || !evaluation) return;
    saveToHistory(mode || 'akademis', prompt, text, evaluation);
    toast.success('Latihan Anda berhasil disimpan!');
    navigate('/nilai');
  };

  // Helper to parse double asterisks and hash headers into beautiful React elements
  const renderFeedbackText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    let currentList = [];
    const elements = [];

    const flushList = (keyIndex) => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${keyIndex}`} className="list-disc list-inside space-y-1.5 my-3 pl-4 text-gray-600 text-sm md:text-base">
            {currentList.map((item, idx) => (
              <li key={`li-${idx}`}>{item}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList(index);
        return;
      }

      // Render individual criteria scores as highlight pills
      if (trimmed.toLowerCase().startsWith('skor:')) {
        flushList(index);
        const scoreMatch = trimmed.match(/skor:\s*\*?\[?(\d+)\]?\/\[?(\d+)\]?\*?/i);
        if (scoreMatch) {
          const scoreVal = scoreMatch[1];
          const maxVal = scoreMatch[2];
          const colorClass = mode === 'kreatif'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : 'bg-indigo-50 border-indigo-100 text-indigo-700';
          const pillColor = mode === 'kreatif'
            ? 'bg-emerald-600'
            : 'bg-indigo-600';
          
          elements.push(
            <div key={`score-${index}`} className={`flex items-center gap-2 mt-2 mb-4 border rounded-lg px-3 py-1.5 w-fit ${colorClass}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Skor Kriteria:</span>
              <span className={`text-white text-xs font-bold px-2.5 py-0.5 rounded-full ${pillColor}`}>
                {scoreVal} / {maxVal}
              </span>
            </div>
          );
          return;
        }
      }

      // Render Total Skor as a grand total card
      if (trimmed.toLowerCase().includes('total skor:')) {
        flushList(index);
        const totalMatch = trimmed.match(/total skor:\s*\*?\[?(\d+)\]?\/20\*?\s*(?:—|-)?\s*\*?\[?(.*?)\]?\*?$/i);
        if (totalMatch) {
          const totalVal = totalMatch[1];
          const predikat = totalMatch[2] ? totalMatch[2].replace(/[\*\[\]]/g, '').trim() : '';
          const bgGrad = mode === 'kreatif'
            ? 'from-emerald-50 to-emerald-100/50 border-emerald-200'
            : 'from-indigo-50 to-indigo-100/50 border-indigo-200';
          const badgeBg = mode === 'kreatif'
            ? 'bg-emerald-600 text-white'
            : 'bg-indigo-600 text-white';
          const textColor = mode === 'kreatif'
            ? 'text-emerald-800'
            : 'text-indigo-850';
          
          elements.push(
            <div key={`total-score-${index}`} className={`my-6 p-4 bg-gradient-to-r border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${bgGrad}`}>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>Skor Akhir Evaluasi</div>
                <div className="text-sm text-slate-800 font-semibold mt-0.5">Predikat: {predikat}</div>
              </div>
              <div className={`font-extrabold text-2xl px-5 py-2 rounded-xl shadow-sm text-center ${badgeBg}`}>
                {totalVal} <span className="text-sm font-normal opacity-85">/ 20</span>
              </div>
            </div>
          );
          return;
        }
      }

      if (trimmed.startsWith('#')) {
        flushList(index);
        const level = (trimmed.match(/^#+/) || ['#'])[0].length;
        const content = trimmed.replace(/^#+\s+/, '');
        const headingClass = level === 1 
          ? "text-2xl font-bold text-slate-800 mt-6 mb-3 border-b border-gray-100 pb-2"
          : level === 2 
            ? "text-xl font-bold text-slate-800 mt-5 mb-2"
            : "text-lg font-semibold text-slate-800 mt-4 mb-2";

        elements.push(
          <div key={`h-${index}`} className={headingClass}>
            {parseInlineMarkup(content)}
          </div>
        );
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.replace(/^[-*]\s+/, '');
        currentList.push(parseInlineMarkup(content));
        return;
      }

      flushList(index);
      elements.push(
        <p key={`p-${index}`} className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
          {parseInlineMarkup(trimmed)}
        </p>
      );
    });

    flushList(lines.length);
    return elements;
  };

  const parseInlineMarkup = (inputText) => {
    const parts = inputText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const val = part.slice(2, -2);
        
        let customColor = "text-slate-800 font-bold";
        if (val.toLowerCase().includes('area perbaikan')) {
          customColor = "text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold inline-block my-1 text-xs md:text-sm";
        } else if (val.toLowerCase().includes('kekuatan')) {
          customColor = "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold inline-block my-1 text-xs md:text-sm";
        }

        return (
          <strong key={index} className={customColor}>
            {val}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col fade-in">
      {/* Navigation Header */}
      <header className="border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-serif text-2xl text-slate-800 tracking-tight hover:text-indigo-600 transition-all duration-200">
            Jadi Penulis
          </Link>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            mode === 'kreatif' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            Mode: {mode === 'kreatif' ? 'Kreatif' : 'Akademis'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/nilai"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-all duration-200"
          >
            Nilai Saya
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-800 font-medium text-base">
              Menganalisis tulisan Anda menggunakan standar EYD...
            </p>
            <p className="text-gray-500 text-xs max-w-md text-center">
              Proses ini membutuhkan waktu beberapa detik karena AI sedang mengevaluasi berdasarkan 5 kriteria utama bahasa Indonesia.
            </p>
          </div>
        ) : (
          <div 
            className={`space-y-8 transition-all duration-500 ease-out transform ${
              resultsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Evaluation Metadata Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 md:p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Topik</h3>
                <p className="font-serif text-slate-800 text-sm md:text-base leading-relaxed">{prompt}</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tulisan Anda</h3>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{text}</p>
              </div>
            </div>

            {/* AI Feedback Display Card */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">
                Hasil Evaluasi AI (Cerebras gpt-oss-120b — Mode {mode === 'kreatif' ? 'Kreatif' : 'Akademis'})
              </h2>

              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3.5 leading-relaxed">
                <strong>Catatan Penting:</strong> Hasil penilaian di bawah ini dihasilkan secara otomatis oleh AI. Penilaian ini bersifat subjektif dan tidak mungkin 100% benar. Gunakan kritik serta saran perbaikan ini sebagai pembanding/referensi belajar mandiri Anda.
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
                <div className="prose max-w-none">
                  {renderFeedbackText(evaluation)}
                </div>
              </div>
            </div>

            {/* Bottom Actions - delayed fade-in */}
            <div 
              className={`flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100 transition-opacity duration-300 ease-in delay-200 ${
                resultsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                onClick={() => navigate(`/write?mode=${mode || 'akademis'}`)}
                className="flex-1 py-3 px-4 border border-indigo-600 text-indigo-600 bg-white font-semibold rounded-lg hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out text-center text-sm"
              >
                Latihan Lagi
              </button>
              
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out text-center text-sm"
              >
                Simpan & Lihat Nilai Saya
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResultsPage;
