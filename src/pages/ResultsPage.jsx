import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';
import { runLocalEvaluation, runLocalMenulisCepatEvaluation } from '../utils/localEvaluationEngine';

const HighlightedText = ({ text, corrections }) => {
  if (!corrections || corrections.length === 0) {
    return <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const findMatchRanges = (fullText, wrongStr) => {
    // 1. Try exact match first
    let idx = fullText.indexOf(wrongStr);
    if (idx !== -1) return { start: idx, end: idx + wrongStr.length };

    // 2. Try case-insensitive match
    idx = fullText.toLowerCase().indexOf(wrongStr.toLowerCase());
    if (idx !== -1) return { start: idx, end: idx + wrongStr.length };

    // 3. Try flexible match ignoring punctuation and whitespace
    const map = [];
    let normalizedText = "";
    for (let i = 0; i < fullText.length; i++) {
      const char = fullText[i];
      if (/[a-zA-Z0-9]/.test(char)) {
        normalizedText += char.toLowerCase();
        map.push(i);
      }
    }

    let normalizedWrong = wrongStr.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedWrong.length === 0) return null;

    let normIdx = normalizedText.indexOf(normalizedWrong);
    if (normIdx !== -1) {
      const originalStart = map[normIdx];
      const originalEnd = map[normIdx + normalizedWrong.length - 1] + 1;
      return { start: originalStart, end: originalEnd };
    }

    return null;
  };

  let highlightRanges = [];
  corrections.forEach((corr, idx) => {
    const range = findMatchRanges(text, corr.wrong);
    if (range) {
      highlightRanges.push({ ...range, ...corr, corrIdx: idx });
    }
  });

  highlightRanges.sort((a, b) => a.start - b.start);

  const nonOverlapping = [];
  let lastEnd = 0;
  for (const r of highlightRanges) {
    if (r.start >= lastEnd) {
      nonOverlapping.push(r);
      lastEnd = r.end;
    }
  }

  const elements = [];
  let currentIndex = 0;

  nonOverlapping.forEach((range, idx) => {
    if (range.start > currentIndex) {
      elements.push(text.slice(currentIndex, range.start));
    }
    
    const originalTextFragment = text.slice(range.start, range.end);
    elements.push(
      <span key={`hl-${idx}`} className="relative group cursor-help bg-red-100 text-red-900 border-b-2 border-red-500 rounded px-0.5">
        {originalTextFragment}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-xs bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          Saran: {range.correct}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
        </span>
      </span>
    );
    
    currentIndex = range.end;
  });

  if (currentIndex < text.length) {
    elements.push(text.slice(currentIndex));
  }

  return (
    <div className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
      {elements.length > 0 ? elements.map((el, i) => (
        <React.Fragment key={i}>{el}</React.Fragment>
      )) : text}
    </div>
  );
};

const ResultsPage = () => {
  const { evaluateWriting, evaluateMenulisCepat, saveToHistory } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const { mode, prompt, text, wpm, cpm, accuracy, consistency, mistypedChars } = location.state || {};
  const [evaluation, setEvaluation] = useState('');
  const [loading, setLoading] = useState(true);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Guard against React Strict Mode double-firing during dev
  const evaluationFetched = useRef(false);

  // Guard: if no prompt/text, redirect to /pilih
  useEffect(() => {
    if (!prompt || !text) {
      toast.error('Data tulisan tidak ditemukan, kembali ke halaman utama.');
      navigate('/pilih');
    }
  }, [prompt, text, navigate]);

  const fetchEvaluation = useCallback(async () => {
    setLoading(true);
    setRateLimitCountdown(0);
    setIsOfflineMode(false);
    try {
      let feedback;
      if (mode === 'menulisCepat') {
        feedback = await evaluateMenulisCepat(wpm, accuracy, consistency, mistypedChars);
      } else {
        feedback = await evaluateWriting(mode || 'akademis', prompt, text);
      }
      setEvaluation(feedback);
    } catch (err) {
      console.error('API Evaluation failed, switching to local evaluation engine:', err);
      setIsOfflineMode(true);
      toast.error('Gagal memuat evaluasi AI. Mengaktifkan sistem penilaian lokal.');
      
      let localFeedback;
      if (mode === 'menulisCepat') {
        localFeedback = runLocalMenulisCepatEvaluation(wpm, accuracy, consistency, mistypedChars);
      } else {
        localFeedback = runLocalEvaluation(mode || 'akademis', prompt, text);
      }
      setEvaluation(localFeedback);
    } finally {
      setLoading(false);
    }
  }, [mode, prompt, text, wpm, accuracy, consistency, mistypedChars, evaluateWriting, evaluateMenulisCepat]);

  useEffect(() => {
    if (!prompt || !text) return;
    if (evaluationFetched.current) return;
    evaluationFetched.current = true;
    fetchEvaluation();
  }, [prompt, text, fetchEvaluation]);

  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchEvaluation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCountdown, fetchEvaluation]);

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
    
    const earnedToasts = [];

    if (mode === 'menulisCepat') {
      const saved = localStorage.getItem('menulisCepat_history');
      const hist = saved ? JSON.parse(saved) : [];
      
      const savedOtherStr = localStorage.getItem('belajar_menulis_history') || localStorage.getItem('jadi_penulis_history');
      const histOther = savedOtherStr ? JSON.parse(savedOtherStr) : [];

      if (hist.length === 0 && histOther.length === 0) {
         earnedToasts.push("🌟 Pencapaian Terbuka: Langkah Pertama!");
      }
      
      const prevHasFast = hist.some(s => parseFloat(s.wpm) >= 80);
      if (!prevHasFast && parseFloat(wpm) >= 80) earnedToasts.push("⚡ Pencapaian Terbuka: Si Kilat!");
      
      const prevHasSniper = hist.some(s => parseFloat(s.accuracy) === 100);
      if (!prevHasSniper && parseFloat(accuracy) === 100) earnedToasts.push("🎯 Pencapaian Terbuka: Penembak Jitu!");

      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      hist.unshift({ date: dateStr, wpm: parseFloat(wpm), accuracy: parseFloat(accuracy) });
      localStorage.setItem('menulisCepat_history', JSON.stringify(hist));
      toast.success('Latihan Menulis Cepat Anda berhasil disimpan!');
    } else {
      const savedHistoryStr = localStorage.getItem('belajar_menulis_history') || localStorage.getItem('jadi_penulis_history');
      const hist = savedHistoryStr ? JSON.parse(savedHistoryStr) : [];
      
      const savedCepatStr = localStorage.getItem('menulisCepat_history');
      const histCepat = savedCepatStr ? JSON.parse(savedCepatStr) : [];

      if (hist.length === 0 && histCepat.length === 0) {
         earnedToasts.push("🌟 Pencapaian Terbuka: Langkah Pertama!");
      }
      
      if (hist.length === 2) { // will become 3
         earnedToasts.push("📈 Pencapaian Terbuka: Konsisten!");
      }
      
      const match = evaluation.match(/total skor:\s*\*?\[?(\d+)\]?\/20\*?/i);
      const score = match ? parseInt(match[1]) : 0;
      
      const prevPujangga = hist.some(s => {
         const m = (s.feedback || '').match(/total skor:\s*\*?\[?(\d+)\]?\/20\*?/i);
         return m && parseInt(m[1]) >= 18;
      });
      
      if (!prevPujangga && score >= 18) {
         earnedToasts.push("🏆 Pencapaian Terbuka: Pujangga!");
      }

      saveToHistory(mode || 'akademis', prompt, text, evaluation);
      toast.success('Latihan Anda berhasil disimpan!');
    }
    
    // Show achievement toasts
    earnedToasts.forEach((msg, idx) => {
       setTimeout(() => {
          toast(msg, {
            duration: 5000,
            style: { borderRadius: '10px', background: '#4F46E5', color: '#fff', fontWeight: 'bold', fontSize: '13px' }
          });
       }, (idx + 1) * 800);
    });
    
    navigate('/nilai');
  };

  const parseCorrections = (feedbackText) => {
    const corrections = [];
    if (!feedbackText) return corrections;
    const lines = feedbackText.split('\n');
    lines.forEach(line => {
      const match = line.match(/\[Koreksi\]:\s*"([^"]+)"\s*->\s*"([^"]+)"/i) || line.match(/\[Koreksi\]:\s*'([^']+)'\s*->\s*'([^']+)'/i);
      if (match) {
        corrections.push({ wrong: match[1], correct: match[2] });
      }
    });
    return corrections;
  };

  const corrections = parseCorrections(evaluation);

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
            Belajar Menulis
          </Link>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            mode === 'menulisCepat' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            mode === 'kreatif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            Mode: {mode === 'menulisCepat' ? 'Menulis Cepat' : mode === 'kreatif' ? 'Kreatif' : 'Akademis'}
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
        {rateLimitCountdown > 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-10 h-10 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="text-amber-800 font-semibold text-base">
              Rate limit tercapai. Mencoba ulang dalam {rateLimitCountdown} detik...
            </p>
            <p className="text-gray-500 text-xs max-w-md">
              Cerebras API membatasi frekuensi request. Sistem akan otomatis melakukan retry setelah countdown selesai.
            </p>
          </div>
        ) : loading ? (
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
            {/* Warning Banner */}
            {isOfflineMode && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-amber-800 animate-pulse">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-sm">Mode Evaluasi Lokal Aktif</h4>
                  <p className="text-xs leading-relaxed mt-0.5">
                    Koneksi ke AI (Cerebras) sedang bermasalah atau terkena pembatasan limit. Hasil ulasan dan penilaian di bawah ini dikerjakan secara instan oleh mesin pemeriksa tata bahasa lokal aplikasi.
                  </p>
                </div>
              </div>
            )}

            {/* Evaluation Metadata Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 md:p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Topik / Teks Target</h3>
                <p className="font-serif text-slate-800 text-sm md:text-base leading-relaxed">{prompt}</p>
              </div>
              
              {mode === 'menulisCepat' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-center">
                    <div className="text-xl font-bold text-amber-700">{wpm}</div>
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">WPM</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                    <div className="text-xl font-bold text-emerald-700">{accuracy}%</div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Akurasi</div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-center">
                    <div className="text-xl font-bold text-indigo-700">{consistency}</div>
                    <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Deviasi</div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-center">
                    <div className="text-xl font-bold text-slate-700">{cpm}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CPM</div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tulisan Anda</h3>
                <HighlightedText text={text} corrections={corrections} />
              </div>
            </div>

            {/* AI Feedback Display Card */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">
                {isOfflineMode
                  ? `Hasil Evaluasi Lokal (Mode ${mode === 'kreatif' ? 'Kreatif' : 'Akademis'})`
                  : `Hasil Evaluasi AI (Cerebras gpt-oss-120b — Mode ${mode === 'kreatif' ? 'Kreatif' : 'Akademis'})`
                }
              </h2>

              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3.5 leading-relaxed space-y-1.5">
                <p>
                  <strong>Catatan Penting:</strong> Hasil penilaian di bawah ini dihasilkan secara otomatis oleh {isOfflineMode ? 'Mesin Lokal' : 'AI'}. Penilaian ini bersifat subjektif dan tidak mungkin 100% benar. Gunakan kritik serta saran perbaikan ini sebagai pembanding/referensi belajar mandiri Anda.
                </p>
                {!isOfflineMode && (
                  <p>
                    <strong>Batas Konteks (Context Limit):</strong> Respons dan penilaian yang dikeluarkan oleh model AI mungkin terpotong di bagian akhir apabila melewati batas maksimal token (*context limit*) dari penyedia layanan API.
                  </p>
                )}
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
                onClick={() => navigate(mode === 'menulisCepat' ? '/menulis-cepat' : `/write?mode=${mode || 'akademis'}`)}
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
