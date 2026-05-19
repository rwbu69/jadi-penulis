import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import SplashPage from './pages/SplashPage';
import OptionPage from './pages/OptionPage';
import WritingPage from './pages/WritingPage';
import ResultsPage from './pages/ResultsPage';
import NilaiSayaPage from './pages/NilaiSayaPage';
import MenulisCepatPage from './pages/MenulisCepatPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/pilih" element={<OptionPage />} />
          <Route path="/write" element={<WritingPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/nilai" element={<NilaiSayaPage />} />
          <Route path="/menulis-cepat" element={<MenulisCepatPage />} />
        </Routes>
      </Router>
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'font-sans text-sm border border-gray-200 text-slate-800 bg-white rounded-lg shadow-sm',
          duration: 4000,
        }} 
      />
    </AppProvider>
  );
}

export default App;
