import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';

const NilaiSayaPage = () => {
  const { history, clearHistory } = useContext(AppContext);
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState({});
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('akademis');

  // Mount animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to extract texts inside "Area Perbaikan" sections
  const extractAreaPerbaikanTexts = (feedbackText) => {
    if (!feedbackText) return [];
    const texts = [];
    const parts = feedbackText.split(/(?:\*\*Area Perbaikan\*\*|Area Perbaikan)/i);
    
    for (let i = 1; i < parts.length; i++) {
      const textAfterLabel = parts[i];
      const endOfSectionIndex = textAfterLabel.search(/(?:###|\*\*Kekuatan\*\*|\*\*Ringkasan|\*\*Kalimat Penutup)/i);
      const sectionText = endOfSectionIndex !== -1 
        ? textAfterLabel.slice(0, endOfSectionIndex) 
        : textAfterLabel;
      texts.push(sectionText.toLowerCase());
    }
    return texts;
  };

  // Derive writing weakness statistics
  const getWeaknessStats = () => {
    const counts = {
      'EYD (Ejaan/Tanda Baca)': 0,
      'Kohesi & Koherensi': 0,
      'Diksi & Kosakata': 0,
      'Struktur Paragraf': 0,
      'Kejelasan Ide': 0,
    };

    const keyMapping = {
      'eyd': 'EYD (Ejaan/Tanda Baca)',
      'kohesi': 'Kohesi & Koherensi',
      'diksi': 'Diksi & Kosakata',
      'struktur': 'Struktur Paragraf',
      'ide': 'Kejelasan Ide',
    };

    history.forEach(session => {
      const feedback = session.feedback || '';
      const areaTexts = extractAreaPerbaikanTexts(feedback);
      
      areaTexts.forEach(text => {
        Object.keys(keyMapping).forEach(keyword => {
          const regex = new RegExp(keyword, 'g');
          const matches = text.match(regex);
          if (matches) {
            counts[keyMapping[keyword]] += matches.length;
          }
        });
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  };

  const weaknessStats = getWeaknessStats();

  // Graph and Skill Analysis Parsing
  const akademisCriteria = [
    "Struktur Paragraf",
    "Penggunaan EYD Edisi V",
    "Kohesi dan Koherensi",
    "Diksi dan Kosakata",
    "Kejelasan Ide & Argumentasi"
  ];
  const kreatifCriteria = [
    "Kedalaman Deskripsi & Indra",
    "Dasar EYD Edisi V (Sastra)",
    "Alur & Koherensi Naratif",
    "Diksi dan Majas",
    "Orisinalitas Ide & Ekspresi"
  ];

  const getAverageCriteriaScores = (sessions) => {
    const sum = [0, 0, 0, 0, 0];
    const count = [0, 0, 0, 0, 0];
    
    sessions.forEach(session => {
      const lines = (session.feedback || '').split('\n');
      let criteriaIdx = 0;
      lines.forEach(line => {
        const match = line.match(/skor:\s*\*?\[?(\d+)\]?\/\[?(\d+)\]?\*?/i);
        if (match && criteriaIdx < 5) {
          sum[criteriaIdx] += parseInt(match[1], 10);
          count[criteriaIdx] += 1;
          criteriaIdx++;
        }
      });
    });

    return sum.map((s, idx) => (count[idx] > 0 ? Number((s / count[idx]).toFixed(1)) : null));
  };

  const akademisSessions = history.filter(h => h.mode === 'akademis' || !h.mode);
  const kreatifSessions = history.filter(h => h.mode === 'kreatif');

  const akademisAverages = getAverageCriteriaScores(akademisSessions);
  const kreatifAverages = getAverageCriteriaScores(kreatifSessions);

  const getStrengthAndWeakness = (averages, criteriaNames) => {
    let maxVal = -1;
    let minVal = 5;
    let maxIdx = -1;
    let minIdx = -1;
    let hasData = false;

    averages.forEach((avg, idx) => {
      if (avg !== null) {
        hasData = true;
        if (avg > maxVal) {
          maxVal = avg;
          maxIdx = idx;
        }
        if (avg < minVal) {
          minVal = avg;
          minIdx = idx;
        }
      }
    });

    return {
      hasData,
      strength: maxIdx !== -1 ? { name: criteriaNames[maxIdx], score: maxVal } : null,
      weakness: minIdx !== -1 ? { name: criteriaNames[minIdx], score: minVal } : null
    };
  };

  const akademisStats = getStrengthAndWeakness(akademisAverages, akademisCriteria);
  const kreatifStats = getStrengthAndWeakness(kreatifAverages, kreatifCriteria);

  const handleClearHistory = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua riwayat latihan Anda?')) {
      clearHistory();
      toast.success('Semua riwayat latihan telah dihapus.');
    }
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    } catch (e) {
      return isoString;
    }
  };

  const renderFeedbackText = (text, sessionMode) => {
    if (!text) return null;

    const lines = text.split('\n');
    let currentList = [];
    const elements = [];

    const flushList = (keyIndex) => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${keyIndex}`} className="list-disc list-inside space-y-1 my-2 pl-4 text-gray-600 text-sm">
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
          const colorClass = sessionMode === 'kreatif'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : 'bg-indigo-50 border-indigo-100 text-indigo-700';
          const pillColor = sessionMode === 'kreatif'
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
          const bgGrad = sessionMode === 'kreatif'
            ? 'from-emerald-50 to-emerald-100/50 border-emerald-200'
            : 'from-indigo-50 to-indigo-100/50 border-indigo-200';
          const badgeBg = sessionMode === 'kreatif'
            ? 'bg-emerald-600 text-white'
            : 'bg-indigo-600 text-white';
          const textColor = sessionMode === 'kreatif'
            ? 'text-emerald-800'
            : 'text-indigo-850';
          
          elements.push(
            <div key={`total-score-${index}`} className={`my-4 p-4 bg-gradient-to-r border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${bgGrad}`}>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>Skor Akhir Evaluasi</div>
                <div className="text-sm text-slate-800 font-semibold mt-0.5">Predikat: {predikat}</div>
              </div>
              <div className={`font-extrabold text-xl px-4 py-1.5 rounded-xl shadow-sm text-center ${badgeBg}`}>
                {totalVal} <span className="text-xs font-normal opacity-85">/ 20</span>
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
          ? "text-xl font-bold text-slate-800 mt-4 mb-2 border-b border-gray-100 pb-1"
          : level === 2 
            ? "text-lg font-bold text-slate-800 mt-3.5 mb-1.5"
            : "text-base font-semibold text-slate-800 mt-3 mb-1";

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
        <p key={`p-${index}`} className="text-gray-600 leading-relaxed mb-3 text-sm">
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
          customColor = "text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold inline-block my-0.5 text-xs";
        } else if (val.toLowerCase().includes('kekuatan')) {
          customColor = "text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold inline-block my-0.5 text-xs";
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

  // Set active tab default based on available history
  useEffect(() => {
    if (history.length > 0) {
      if (akademisSessions.length === 0 && kreatifSessions.length > 0) {
        setActiveTab('kreatif');
      }
    }
  }, [history, akademisSessions.length, kreatifSessions.length]);

  return (
    <div 
      className={`min-h-screen bg-white flex flex-col transition-all duration-500 ease-out transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Navigation Header */}
      <header className="border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-serif text-2xl text-slate-800 tracking-tight hover:text-indigo-600 transition-all duration-200">
            Jadi Penulis
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/pilih"
            className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-all duration-200 ease-in-out"
          >
            Kembali Latihan
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Nilai Saya</h1>
            <p className="text-gray-500 text-sm mt-1">
              Pantau perkembangan dan analisis kompetensi menulis Anda.
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="self-start sm:self-center text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              Hapus Semua Riwayat
            </button>
          )}
        </div>

        {/* Page Inaccuracy Disclaimer Callout */}
        <div className="text-xs text-slate-500 bg-gray-50 border border-gray-200 rounded-lg p-3 leading-relaxed">
          *Catatan: Seluruh nilai dan analisis kompetensi yang tersimpan di halaman ini dikalkulasikan secara otomatis berdasarkan umpan balik model AI (gpt-oss-120b). Evaluasi AI tidak mungkin 100% benar atau akurat secara mutlak. Gunakan data ini secara bijak sebagai bahan pembanding evaluasi diri.
        </div>

        {/* Grafis Analisis Perkembangan Kompetensi */}
        {history.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6 animate-slide-up-fade">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-150 pb-4 gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Grafik Analisis Kompetensi</h2>
                <p className="text-xs text-gray-500">Rata-rata skor per kriteria dihitung dari seluruh latihan Anda.</p>
              </div>
              
              {/* Tab Selector */}
              <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-center">
                <button
                  onClick={() => setActiveTab('akademis')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'akademis' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Akademis ({akademisSessions.length})
                </button>
                <button
                  onClick={() => setActiveTab('kreatif')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'kreatif' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  Kreatif ({kreatifSessions.length})
                </button>
              </div>
            </div>

            {/* Content rendering based on Tab */}
            {activeTab === 'akademis' ? (
              akademisSessions.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  Belum ada riwayat penulisan akademik yang disimpan. Silakan submit penulisan akademik untuk melihat grafik.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Strength and Weakness Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up-fade" style={{ animationDelay: '50ms' }}>
                    {akademisStats.strength && (
                      <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
                        <span className="text-xl">🌟</span>
                        <div>
                          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Kekuatan Utama</div>
                          <div className="text-sm font-semibold text-slate-800 mt-1">{akademisStats.strength.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Rata-rata: {akademisStats.strength.score} / 4.0</div>
                        </div>
                      </div>
                    )}
                    {akademisStats.weakness && (
                      <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Fokus Perbaikan</div>
                          <div className="text-sm font-semibold text-slate-800 mt-1">{akademisStats.weakness.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Rata-rata: {akademisStats.weakness.score} / 4.0</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Bar Charts */}
                  <div className="space-y-4 pt-2">
                    {akademisCriteria.map((cName, idx) => {
                      const scoreVal = akademisAverages[idx];
                      const percentage = scoreVal !== null ? (scoreVal / 4.0) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                            <span className="text-slate-800">{cName}</span>
                            <span className="text-indigo-600 font-bold">{scoreVal !== null ? `${scoreVal} / 4.0` : '-'}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out animate-slide-right" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              kreatifSessions.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  Belum ada riwayat penulisan kreatif yang disimpan. Silakan submit penulisan kreatif untuk melihat grafik.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Strength and Weakness Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up-fade" style={{ animationDelay: '50ms' }}>
                    {kreatifStats.strength && (
                      <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
                        <span className="text-xl">🌟</span>
                        <div>
                          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Kekuatan Utama</div>
                          <div className="text-sm font-semibold text-slate-800 mt-1">{kreatifStats.strength.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Rata-rata: {kreatifStats.strength.score} / 4.0</div>
                        </div>
                      </div>
                    )}
                    {kreatifStats.weakness && (
                      <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Fokus Perbaikan</div>
                          <div className="text-sm font-semibold text-slate-800 mt-1">{kreatifStats.weakness.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Rata-rata: {kreatifStats.weakness.score} / 4.0</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Bar Charts */}
                  <div className="space-y-4 pt-2">
                    {kreatifCriteria.map((cName, idx) => {
                      const scoreVal = kreatifAverages[idx];
                      const percentage = scoreVal !== null ? (scoreVal / 4.0) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                            <span className="text-slate-800">{cName}</span>
                            <span className="text-emerald-600 font-bold">{scoreVal !== null ? `${scoreVal} / 4.0` : '-'}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out animate-slide-right" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Statistics Block - Key Perbaikan Word Analysis (fallback display) */}
        {history.length > 0 && weaknessStats.length > 0 && (
          <div 
            className={`bg-gray-50 border border-gray-200 rounded-xl p-6 transition-opacity duration-500 ease-out delay-150 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <h2 className="text-base font-bold text-slate-800 mb-3">
              Frekuensi Topik Perbaikan (Analisis Kata Kunci)
            </h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Statistik di bawah diambil dari kemunculan kata kunci kelalaian ejaan pada bagian <strong>Area Perbaikan</strong> di seluruh riwayat latihan Anda.
            </p>
            <div className="flex flex-wrap gap-2">
              {weaknessStats.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3.5 py-1.5 text-xs font-semibold"
                >
                  <span>{item.name}</span>
                  <span className="bg-indigo-200 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded-full">
                    {item.count}x muncul
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* History List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            Riwayat Latihan ({history.length})
          </h2>

          {history.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-1">Belum Ada Riwayat Latihan</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Anda belum pernah menyimpan hasil latihan menulis. Silakan mulai latihan baru untuk mendapatkan analisis tulisan Anda.
                </p>
              </div>
              <button
                onClick={() => navigate('/pilih')}
                className="mt-2 bg-indigo-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all duration-200 text-sm"
              >
                Mulai Latihan Menulis
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((session, index) => {
                const isExpanded = !!expandedIds[session.id];
                const truncatedText = session.userText.length > 100
                  ? session.userText.slice(0, 100) + '...'
                  : session.userText;

                return (
                  <div
                    key={session.id}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-slide-up-fade"
                    style={{ animationDelay: `${Math.min(index * 75, 300)}ms` }}
                  >
                    {/* Card Header (Toggle Clickable) */}
                    <div
                      onClick={() => toggleExpand(session.id)}
                      className="p-5 md:p-6 cursor-pointer hover:bg-gray-50 flex items-start justify-between gap-4 transition-all duration-200 select-none"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-indigo-600">
                            {formatDate(session.timestamp)}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${
                            session.mode === 'kreatif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {session.mode === 'kreatif' ? 'Kreatif' : 'Akademis'}
                          </span>
                        </div>
                        <div className="font-serif text-slate-800 text-sm font-medium line-clamp-1">
                          Topik: {session.prompt}
                        </div>
                        <div className="text-gray-600 text-xs md:text-sm italic line-clamp-2">
                          "{truncatedText}"
                        </div>
                      </div>
                      
                      <div className="text-gray-400 mt-1 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
 
                    {/* Expandable Section - smooth accordion transition */}
                    <div
                      className={`transition-all duration-300 ease-in-out border-t border-gray-100 overflow-hidden ${
                        isExpanded ? 'max-h-[2000px] opacity-100 p-6 md:p-8' : 'max-h-0 opacity-0 p-0'
                      }`}
                    >
                      {isExpanded && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Topik Lengkap</h4>
                            <p className="font-serif text-slate-800 text-sm leading-relaxed">{session.prompt}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tulisan Anda</h4>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 border border-gray-150 p-4 rounded-lg">
                              {session.userText}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hasil Evaluasi AI</h4>
                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                              {renderFeedbackText(session.feedback, session.mode)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NilaiSayaPage;
