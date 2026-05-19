import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AppContext } from '../context/AppContext';

const SplashPage = () => {
  const navigate = useNavigate();
  const { customApiKey, setCustomApiKey } = useContext(AppContext);
  
  const [visible, setVisible] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState(customApiKey);

  useEffect(() => {
    // Small timeout to trigger transition after mounting
    const timer = setTimeout(() => {
      setVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Keep input value in sync with context value if updated elsewhere
  useEffect(() => {
    setApiKeyValue(customApiKey);
  }, [customApiKey]);

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Left Column - Informational */}
      <div 
        className={`w-full md:w-1/2 px-6 py-12 md:px-16 md:py-20 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200 transition-all duration-700 ease-out transform ${
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        }`}
      >
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold font-serif text-slate-800 tracking-tight">
            Jadi Penulis
          </h1>
          <p className="text-gray-500 text-lg mt-3 font-medium">
            Platform latihan menulis akademik untuk pelajar Indonesia.
          </p>

          {/* Disclaimer Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-8 text-sm text-gray-500 leading-relaxed">
            Project ini hanyalah sebuah proof of concept menggunakan LLM gpt-oss-120b via Cerebras AI untuk menghilangkan cost development. Untuk implementasi lebih lanjut dapat dilakukan dengan model LLM yang trained in-house (khusus untuk aplikasi ini) atau dengan menggunakan model LLM yang lebih kuat dan akurat. Penilaian yang diberikan oleh AI bersifat subjektif dan tidak mungkin 100% benar, apabila terdapat kesalahan penilaian oleh AI merupakan hal normal dan tidak bisa menjadi patokan 100% terhadap kemampuan menulis anda.
          </div>

          {/* Setup Instructions Dropdown */}
          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="w-full px-5 py-3.5 flex justify-between items-center bg-gray-50 text-sm font-semibold text-slate-700 hover:bg-gray-100 transition-colors duration-200 select-none focus:outline-none"
            >
              <span>Cara Setup Cerebras API Key (Gratis)</span>
              <svg
                className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${showSetup ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showSetup ? 'max-h-96 border-t border-gray-200 p-5 bg-white' : 'max-h-0'
              }`}
            >
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-gray-600 leading-relaxed">
                <li>Kunjungi dashboard resmi Cerebras Cloud di <a href="https://cloud.cerebras.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold underline hover:text-indigo-800">cloud.cerebras.ai</a></li>
                <li>Daftar akun baru secara gratis atau masuk menggunakan akun Google Anda.</li>
                <li>Arahkan ke tab menu <strong>"API Keys"</strong> yang terletak di sidebar sebelah kiri.</li>
                <li>Klik tombol <strong>"Create API Key"</strong>, beri nama bebas, lalu salin kunci yang dihasilkan.</li>
                <li>Kembali ke halaman ini, klik form input API Key di sebelah kanan, masukkan kuncinya, lalu klik <strong>Simpan</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Call to Action & Custom Key Configuration */}
      <div 
        className={`w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-16 md:px-16 transition-all duration-700 ease-out transform delay-300 ${
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        }`}
      >
        <button
          onClick={() => navigate('/pilih')}
          className="w-full max-w-xs bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-sm hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out text-center"
        >
          Mulai Menulis
        </button>

        {/* API Key Toggle Trigger Button */}
        <button
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="mt-4 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors duration-200 focus:outline-none flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m-2-2a2 2 0 11-2-2m2 2l-3 3m0 0l-3-3m3 3v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h8" />
          </svg>
          <span>{customApiKey ? 'Menggunakan API Key Kustom (Ubah)' : 'Gunakan API Key Sendiri'}</span>
        </button>

        {/* Custom API Key Input Form card */}
        <div
          className={`w-full max-w-xs transition-all duration-300 ease-in-out overflow-hidden ${
            showApiKeyInput ? 'max-h-72 opacity-100 mt-5' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Cerebras API Key Anda
              </label>
              <input
                type="password"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="csk-..."
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!apiKeyValue.trim()) {
                    toast.error('Kunci API tidak boleh kosong!');
                    return;
                  }
                  setCustomApiKey(apiKeyValue.trim());
                  toast.success('Kunci API kustom disimpan!');
                  setShowApiKeyInput(false);
                }}
                className="flex-1 bg-indigo-600 text-white text-[11px] font-bold py-2 rounded hover:bg-indigo-700 active:scale-95 transition-all duration-150"
              >
                Simpan
              </button>
              {customApiKey && (
                <button
                  onClick={() => {
                    setCustomApiKey('');
                    setApiKeyValue('');
                    toast.success('Kembali menggunakan Kunci API default!');
                    setShowApiKeyInput(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 text-[11px] font-bold py-2 rounded hover:bg-gray-300 active:scale-95 transition-all duration-150"
                >
                  Hapus Key
                </button>
              )}
            </div>
            
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              *Kunci disimpan secara lokal di browser Anda dan tidak pernah dikirim ke luar sistem kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;
