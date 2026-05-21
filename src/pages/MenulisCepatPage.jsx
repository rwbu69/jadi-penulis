import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';
import { aiPrompts } from '../config/aiPrompts';
import { FALLBACK_TYPING_PARAGRAPHS } from '../config/fallbackData';
import Logo from '../components/Logo';

const MenulisCepatPage = () => {
  const { customApiKey } = useContext(AppContext);
  const navigate = useNavigate();

  // State Declarations
  const [targetText, setTargetText] = useState('');
  const [userText, setUserText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentWpm, setCurrentWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [consistency, setConsistency] = useState(0);
  
  // Loading States
  const [loadingParagraph, setLoadingParagraph] = useState(true);
  const [paragraphRateLimitCountdown, setParagraphRateLimitCountdown] = useState(0);
  const [isOfflineParagraph, setIsOfflineParagraph] = useState(false);

  // Refs for tracking timestamps & intervals
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const wpmSamplesRef = useRef([]);
  const lastSampleTimeRef = useRef(null);
  const userTextRef = useRef('');
  const activeCharRef = useRef(null);

  // Auto scroll to active character
  useEffect(() => {
    if (activeCharRef.current) {
      activeCharRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [userText]);

  // Sync ref with state so intervals can access latest typed characters
  useEffect(() => {
    userTextRef.current = userText;
  }, [userText]);

  // Kalkulasi sesuai dengan contohkalkulasi.js
  const calculateWPM = (dataLen, totalMin) => {
    if (totalMin <= 0) return 0;
    return (dataLen / 5) / totalMin;
  };

  const calculateCPM = (dataLen, totalMin) => {
    if (totalMin <= 0) return 0;
    return dataLen / totalMin;
  };

  const calculateAccuracyStat = (correctCharCount, totalCharCount) => {
    if (totalCharCount === 0) return 100;
    return (correctCharCount / totalCharCount) * 100;
  };

  // Standard Deviation calculator for Consistency metric
  const calculateStdDev = (samples) => {
    if (!samples || samples.length <= 1) return 0;
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
    return Number(Math.sqrt(variance).toFixed(1));
  };

  const getCorrectCharsCount = (typed, target) => {
    let correct = 0;
    const limit = Math.min(typed.length, target.length);
    for (let i = 0; i < limit; i++) {
      if (typed[i] === target[i]) {
        correct++;
      }
    }
    return correct;
  };

  // Fetch paragraph from Cerebras API
  const fetchParagraph = async () => {
    setLoadingParagraph(true);
    setParagraphRateLimitCountdown(0);
    setIsOfflineParagraph(false);
    try {
      const apiKey = customApiKey || import.meta.env.VITE_CEREBRAS_API_KEY;
      if (!apiKey) {
        throw new Error('API Key tidak ditemukan. Silakan masukkan API Key Anda di halaman utama.');
      }

      const response = await fetch('/cerebras/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content: aiPrompts.menulisCepat.generateParagraph,
            },
            {
              role: 'user',
              content: 'Berikan satu paragraf bahasa Indonesia untuk tes mengetik cepat. Panjang teks WAJIB minimal 100 kata.',
            }
          ],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw { status: 429 };
        }
        throw new Error(`Gagal terhubung ke Cerebras AI (Status ${response.status})`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
      if (!content) throw new Error('Response kosong diterima dari AI');
      setTargetText(content.trim());
    } catch (err) {
      console.error(err);
      if (err.status === 429) {
        setParagraphRateLimitCountdown(60);
        return;
      }
      toast.error('Gagal memuat paragraf dari AI. Menggunakan paragraf cadangan.');
      setIsOfflineParagraph(true);
      const randomParagraph = FALLBACK_TYPING_PARAGRAPHS[Math.floor(Math.random() * FALLBACK_TYPING_PARAGRAPHS.length)];
      setTargetText(randomParagraph);
    } finally {
      setLoadingParagraph(false);
    }
  };

  // Run initial paragraph fetch
  useEffect(() => {
    fetchParagraph();
  }, []);

  // Interval hook for paragraph rate limits countdown
  useEffect(() => {
    if (paragraphRateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      setParagraphRateLimitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchParagraph();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paragraphRateLimitCountdown]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Complete session handler
  const handleComplete = (finalText) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsFinished(true);

    const endTime = Date.now();
    const elapsedMin = (endTime - startTimeRef.current) / 60000;
    
    // Hitung exact stats berdasarkan contohkalkulasi.js
    const totalCharsInf = finalText.length;
    const correctCharsCount = getCorrectCharsCount(finalText, targetText);
    
    const finalWpm = calculateWPM(totalCharsInf, elapsedMin).toFixed(2);
    const finalCpm = calculateCPM(totalCharsInf, elapsedMin).toFixed(2);
    const finalAcc = calculateAccuracyStat(correctCharsCount, totalCharsInf).toFixed(2);

    // Standard deviation computation for consistency
    const finalSamples = [...wpmSamplesRef.current];
    if (finalSamples.length === 0 || (endTime - lastSampleTimeRef.current) >= 1000) {
      finalSamples.push(parseFloat(finalWpm));
    }
    const finalConsistency = calculateStdDev(finalSamples);

    // Get mistyped characters array for AI feedback
    const mistyped = [];
    const limit = Math.min(finalText.length, targetText.length);
    for (let i = 0; i < limit; i++) {
      if (finalText[i] !== targetText[i]) {
        mistyped.push({
          expected: targetText[i],
          typed: finalText[i],
          position: i
        });
      }
    }

    // Arahkan ke ResultsPage
    navigate('/results', {
      state: {
        mode: 'menulisCepat',
        prompt: targetText,
        text: finalText,
        wpm: finalWpm,
        cpm: finalCpm,
        accuracy: finalAcc,
        consistency: finalConsistency,
        mistypedChars: mistyped
      }
    });
  };

  // Keyboard typing input trigger
  const handleType = (e) => {
    if (isFinished) return;
    const val = e.target.value;
    if (val.length > targetText.length) return;

    // Start timer on first keystroke
    if (!isStarted && val.length > 0) {
      setIsStarted(true);
      startTimeRef.current = Date.now();
      lastSampleTimeRef.current = Date.now();
      wpmSamplesRef.current = [];

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const nextSec = prev + 1;
          const elapsed = (Date.now() - startTimeRef.current) / 60000;
          const liveWpm = calculateWPM(userTextRef.current.length, elapsed);
          setCurrentWpm(Math.round(liveWpm));

          // Sample WPM speed every 5 seconds for consistency
          if (nextSec % 5 === 0) {
            wpmSamplesRef.current.push(liveWpm);
            lastSampleTimeRef.current = Date.now();
          }
          return nextSec;
        });
      }, 1000);
    }

    setUserText(val);

    // Compute live stats
    const correctCount = getCorrectCharsCount(val, targetText);
    const acc = calculateAccuracyStat(correctCount, val.length);
    setAccuracy(Math.round(acc));

    const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 60000 : 0;
    const wpm = calculateWPM(val.length, elapsed);
    setCurrentWpm(Math.round(wpm));

    if (val.length === targetText.length) {
      handleComplete(val);
    }
  };

  // Try again reset helper
  const handleRetry = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setUserText('');
    setIsStarted(false);
    setIsFinished(false);
    setElapsedSeconds(0);
    setCurrentWpm(0);
    setAccuracy(100);
    setConsistency(0);
    startTimeRef.current = null;
    wpmSamplesRef.current = [];
    fetchParagraph();
  };

  // Render HTML markup of targeted paragraph character by character
  const renderTargetText = () => {
    if (!targetText) return null;
    return targetText.split('').map((char, index) => {
      let className = 'font-mono font-medium transition-colors duration-75 ';
      let style = {};
      if (index < userText.length) {
        if (userText[index] === char) {
          className += 'text-emerald-600 bg-emerald-50/70';
        } else {
          className += 'text-rose-600 bg-rose-50/70 underline decoration-rose-400';
        }
      } else if (index === userText.length) {
        className += 'text-slate-800 bg-indigo-100 animate-pulse';
        style = { boxShadow: 'inset 2px 0 0 0 #4f46e5' };
        return (
          <span key={index} ref={activeCharRef} className={className} style={style}>
            {char}
          </span>
        );
      } else {
        className += 'text-gray-400';
      }
      return (
        <span key={index} className={className} style={style}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:opacity-90 transition-all duration-200">
            <Logo size="sm" />
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-amber-50 text-amber-700 border-amber-200">
            Mode: Menulis Cepat
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
            Pilih Mode Lain
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Rules & Video Tutorial */}
          <div className="lg:col-span-5 space-y-6">
            {/* Rules Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Kriteria Penilaian Menulis Cepat
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-0.5">1. WPM (Words Per Minute)</div>
                  <p className="text-gray-500 leading-relaxed text-xs">
                    Kecepatan mengetik kotor yang dihitung berdasarkan jumlah karakter terketik dibagi 5, kemudian dibagi dengan total waktu berlalu dalam menit.
                  </p>
                </div>
                <div className="border-t border-gray-250/30 pt-3">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-0.5">2. Akurasi Pengetikan</div>
                  <p className="text-gray-500 leading-relaxed text-xs">
                    Persentase kecocokan karakter yang Anda ketik secara langsung terhadap teks target. Setiap huruf, spasi, dan tanda baca dihitung.
                  </p>
                </div>
                <div className="border-t border-gray-250/30 pt-3">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-0.5">3. Konsistensi Kecepatan</div>
                  <p className="text-gray-500 leading-relaxed text-xs">
                    Tingkat kestabilan ritme mengetik Anda. Ini diukur dari standar deviasi sampel WPM yang diambil setiap 5 detik. Nilai deviasi yang lebih rendah menunjukkan konsistensi ritme yang lebih baik.
                  </p>
                </div>
              </div>
            </div>

            {/* Video Tutorial Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Video Tutorial Mengetik Sepuluh Jari
              </h3>
              <iframe
                src="https://www.youtube.com/embed/hhIQStOZgJA"
                allowFullScreen
                className="w-full aspect-video rounded-xl border border-gray-200 shadow-sm"
              />
              <p className="text-gray-400 text-xxs mt-2 text-center">
                Tutorial mengetik cepat oleh Kevin Anggara
              </p>
            </div>
          </div>

          {/* Right Column: Speed Test Exercise & Analysis */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Speed Test Panel */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  Teks Target
                  {isOfflineParagraph && (
                    <span className="text-[10px] lowercase first-letter:uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-normal">
                      Teks Cadangan (Offline)
                    </span>
                  )}
                </span>
                {isStarted && !isFinished && (
                  <span className="text-xs font-semibold text-indigo-600 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    Tes Berjalan...
                  </span>
                )}
              </div>

              {/* Render Target Text Card */}
              {paragraphRateLimitCountdown > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-3 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
                  <span className="text-xs text-amber-700 font-semibold">
                    Rate limit tercapai. Mencoba ulang dalam {paragraphRateLimitCountdown} detik...
                  </span>
                </div>
              ) : loadingParagraph ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-500 animate-pulse">Membuat teks baru dari AI...</span>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 select-none font-mono text-sm md:text-base leading-relaxed tracking-normal min-h-32 whitespace-pre-wrap max-h-56 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {renderTargetText()}
                </div>
              )}

              {/* Real-time Indicators Grid */}
              <div className="grid grid-cols-4 gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-amber-600">{currentWpm}</div>
                  <div className="text-xxs font-bold text-gray-400 uppercase tracking-wider mt-0.5">WPM</div>
                </div>
                <div className="border-l border-gray-200">
                  <div className="text-2xl font-bold text-emerald-600">{accuracy}%</div>
                  <div className="text-xxs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Akurasi</div>
                </div>
                <div className="border-l border-gray-200">
                  <div className="text-2xl font-bold text-indigo-600">
                    {isFinished ? `${consistency}` : '-'}
                  </div>
                  <div className="text-xxs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Deviasi</div>
                </div>
                <div className="border-l border-gray-200">
                  <div className="text-2xl font-bold text-slate-700">{elapsedSeconds}s</div>
                  <div className="text-xxs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Waktu</div>
                </div>
              </div>

              {/* Input Area */}
              <div>
                <label htmlFor="typing-input" className="sr-only">Typing input area</label>
                <textarea
                  id="typing-input"
                  rows={4}
                  value={userText}
                  onChange={handleType}
                  disabled={loadingParagraph || isFinished || paragraphRateLimitCountdown > 0}
                  placeholder={
                    loadingParagraph
                      ? 'Harap tunggu, teks sedang dimuat...'
                      : 'Mulai mengetik di sini. Tes kecepatan akan langsung dimulai pada ketukan pertama...'
                  }
                  className="w-full p-4 border border-gray-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 resize-none transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* Disclaimer */}
              <div className="text-xxs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-center leading-relaxed">
                *Pengingat: Evaluasi teks mengetik dan analisis performa dari AI (gpt-oss-120b) tidak mungkin 100% benar.
              </div>
            </div>

            {/* Default Retry CTA if finished isn't shown yet and load succeeds */}
            {!isFinished && !loadingParagraph && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleRetry}
                  className="text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
                  </svg>
                  Muat Ulang Paragraf Baru
                </button>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
};

export default MenulisCepatPage;
