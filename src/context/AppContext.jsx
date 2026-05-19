import React, { createContext, useState, useEffect } from 'react';
import { 
  PROMPT_GENERATOR_INSTRUCTIONS, 
  buildEvaluationPrompt 
} from '../config/aiPrompts';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('belajar_menulis_history') || localStorage.getItem('jadi_penulis_history');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse belajar_menulis_history', e);
      return [];
    }
  });

  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('custom_cerebras_api_key') || '';
  });

  // Sync History to localStorage
  useEffect(() => {
    localStorage.setItem('belajar_menulis_history', JSON.stringify(history));
  }, [history]);

  // Sync customApiKey to localStorage
  useEffect(() => {
    if (customApiKey) {
      localStorage.setItem('custom_cerebras_api_key', customApiKey);
    } else {
      localStorage.removeItem('custom_cerebras_api_key');
    }
  }, [customApiKey]);

  // Helper to handle API response errors cleanly
  const handleResponseError = async (response) => {
    const errText = await response.text();
    console.error('Cerebras API error response status:', response.status, 'body:', errText);
    
    if (response.status === 429) {
      throw new ApiError('Batas limitasi request (Rate Limit 429) tercapai. Harap tunggu beberapa saat sebelum mencoba kembali.', 429);
    }
    if (response.status === 401) {
      throw new ApiError('API Key tidak valid atau tidak memiliki izin akses (Unauthorized 401). Periksa kembali API Key Anda.', 401);
    }
    if (response.status === 403) {
      throw new ApiError('Akses ditolak (Forbidden 403). Silakan periksa kembali konfigurasi API Key Anda.', 403);
    }
    if (response.status >= 500) {
      throw new ApiError(`Terjadi kegagalan server pada Cerebras AI (Server Error ${response.status}). Silakan coba sesaat lagi.`, response.status);
    }
    throw new ApiError(`Gagal terhubung ke Cerebras AI (Status ${response.status}). Silakan periksa koneksi internet atau kunci API Anda.`, response.status);
  };

  // Generate a writing prompt using Cerebras API
  const generateWritingPrompt = async (mode = 'akademis') => {
    const apiKey = customApiKey || import.meta.env.VITE_CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error('Cerebras API Key is missing. Silakan masukkan API Key Anda di halaman utama.');
    }

    // Load custom instructions from central prompts configuration
    const systemInstruction = PROMPT_GENERATOR_INSTRUCTIONS[mode] || PROMPT_GENERATOR_INSTRUCTIONS.akademis;

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
            content: systemInstruction,
          },
          {
            role: 'user',
            content: 'Berikan saya satu topik atau prompt menulis baru.',
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      await handleResponseError(response);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;
    if (!generatedText) {
      throw new Error('Empty prompt returned from Cerebras');
    }

    return generatedText.trim();
  };

  // Evaluate writing using Cerebras API
  const evaluateWriting = async (mode = 'akademis', promptText, studentText) => {
    const apiKey = customApiKey || import.meta.env.VITE_CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error('Cerebras API Key is missing. Silakan masukkan API Key Anda di halaman utama.');
    }

    // Build the system prompt using the configuration helper
    const systemPrompt = buildEvaluationPrompt(mode);

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
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Topik Penulisan:\n${promptText}\n\nTulisan Siswa:\n${studentText}`,
          },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      await handleResponseError(response);
    }

    const data = await response.json();
    const evaluationText = data.choices?.[0]?.message?.content;
    if (!evaluationText) {
      throw new Error('Empty evaluation returned from Cerebras');
    }

    return evaluationText.trim();
  };

  // Add exercise session to history with mode details
  const saveToHistory = (mode, promptText, userText, feedback) => {
    const newSession = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      mode: mode,
      prompt: promptText,
      userText: userText,
      feedback: feedback,
    };
    setHistory((prev) => [newSession, ...prev]);
  };

  // Remove all sessions
  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <AppContext.Provider
      value={{
        history,
        customApiKey,
        setCustomApiKey,
        generateWritingPrompt,
        evaluateWriting,
        saveToHistory,
        clearHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
