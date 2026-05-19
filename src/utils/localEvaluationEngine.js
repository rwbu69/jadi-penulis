import { SLANG_DICTIONARY, PREPOSITION_ERRORS } from '../config/fallbackData';

/**
 * Local offline evaluation engine for writing essays (akademis / kreatif)
 * Evaluates Indonesian texts locally based on rule sets when AI is offline.
 * Returns evaluation formatted in the standard tag format so ResultsPage can parse it.
 */
export function runLocalEvaluation(mode, promptText, studentText) {
  const wordsCount = studentText.trim().split(/\s+/).filter(Boolean).length;
  const sentences = studentText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const paragraphCount = studentText.split(/\n+/).map(p => p.trim()).filter(Boolean).length;
  
  const corrections = [];
  let scoreEYD = 4;
  let scoreStructure = 4;
  let scoreCohesion = 4;
  let scoreDiksi = 4;
  let scoreRelevance = 4;

  // 1. Evaluate Relevance to the Prompt/Topic
  // Simple keyword inclusion matching. We will check if there's any semantic link.
  const promptWords = promptText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const studentTextLower = studentText.toLowerCase();
  
  let matchCount = 0;
  promptWords.forEach(word => {
    if (studentTextLower.includes(word)) {
      matchCount++;
    }
  });

  const relevanceRatio = promptWords.length > 0 ? matchCount / promptWords.length : 1;
  
  if (relevanceRatio < 0.15) {
    scoreRelevance = 1; // Strict penalty for off-topic
  } else if (relevanceRatio < 0.35) {
    scoreRelevance = 2;
  } else if (relevanceRatio < 0.6) {
    scoreRelevance = 3;
  }

  // 2. Evaluate EYD and Preposition Prefixes
  // Scan for preposition errors
  PREPOSITION_ERRORS.forEach(rule => {
    let match;
    // Reset regex index
    rule.regex.lastIndex = 0;
    while ((match = rule.regex.exec(studentText)) !== null) {
      const wrongWord = match[0];
      // Generate suggestion
      const suggestedWord = rule.correctFormat(wrongWord, match[1], match[2]);
      if (wrongWord !== suggestedWord) {
        corrections.push({
          wrong: wrongWord,
          correct: suggestedWord,
          type: 'EYD V'
        });
      }
    }
  });

  // Scan for slang words
  const words = studentText.split(/[^a-zA-Z0-9'-]+/).filter(Boolean);
  words.forEach(word => {
    const lowerWord = word.toLowerCase();
    if (SLANG_DICTIONARY[lowerWord]) {
      corrections.push({
        wrong: word,
        correct: SLANG_DICTIONARY[lowerWord],
        type: 'Diksi'
      });
    }
  });

  // Deduplicate corrections
  const uniqueCorrections = [];
  const seenWrong = new Set();
  corrections.forEach(c => {
    if (!seenWrong.has(c.wrong)) {
      seenWrong.add(c.wrong);
      uniqueCorrections.push(c);
    }
  });

  // Deduct scores based on spelling errors count
  const eydErrorCount = uniqueCorrections.filter(c => c.type === 'EYD V').length;
  if (eydErrorCount >= 6) scoreEYD = 1;
  else if (eydErrorCount >= 4) scoreEYD = 2;
  else if (eydErrorCount >= 1) scoreEYD = 3;

  // Deduct diksi scores based on slang words count
  const slangErrorCount = uniqueCorrections.filter(c => c.type === 'Diksi').length;
  if (slangErrorCount >= 6) scoreDiksi = 1;
  else if (slangErrorCount >= 3) scoreDiksi = 2;
  else if (slangErrorCount >= 1) scoreDiksi = 3;

  // 3. Evaluate Paragraph Structure
  // Standard academic structure needs multiple paragraphs and proper sentence lengths
  if (paragraphCount < 2) {
    scoreStructure = 2; // Needs introduction, body, or conclusion
  } else if (paragraphCount > 5) {
    scoreStructure = 3; // Too fragmented
  }

  // Average sentence length
  const averageSentenceLength = sentences.length > 0 ? wordsCount / sentences.length : 0;
  if (averageSentenceLength > 28) {
    // Sentences are too long, difficult to read
    scoreStructure = Math.min(scoreStructure, 3);
  } else if (averageSentenceLength < 7) {
    // Too short, child-like structure
    scoreStructure = Math.min(scoreStructure, 2);
  }

  // 4. Evaluate Cohesion & Coherency
  // Check for common transition words: "namun", "oleh karena itu", "tetapi", "karena", "sehingga", "selain itu", "kemudian", "lalu"
  const transitionWords = ["namun", "oleh karena itu", "tetapi", "karena", "sehingga", "selain itu", "kemudian", "lalu", "juga", "sedangkan", "sebaliknya"];
  let transitionCount = 0;
  transitionWords.forEach(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'gi');
    const matches = studentText.match(regex);
    if (matches) transitionCount += matches.length;
  });

  if (transitionCount < 2) scoreCohesion = 2;
  else if (transitionCount < 4) scoreCohesion = 3;

  // Compile feedbacks
  const feedbackEYD = uniqueCorrections.filter(c => c.type === 'EYD V');
  const feedbackDiksi = uniqueCorrections.filter(c => c.type === 'Diksi');

  // Format corrections into required output tags: [Koreksi]: "salah" -> "benar"
  const eydPerbaikan = feedbackEYD.length > 0
    ? `Ditemukan beberapa ketidaksesuaian EYD Edisi V. Harap perhatikan penulisan berikut:\n` + 
      feedbackEYD.map(c => `[Koreksi]: "${c.wrong}" -> "${c.correct}"`).join('\n')
    : `Tidak ditemukan kesalahan EYD V yang signifikan secara struktural.`;

  const diksiPerbaikan = feedbackDiksi.length > 0
    ? `Hindari pemakaian bahasa percakapan informal/slang di penulisan formal. Perbaikan kata:\n` +
      feedbackDiksi.map(c => `[Koreksi]: "${c.wrong}" -> "${c.correct}"`).join('\n')
    : `Diksi sudah cukup formal dan disesuaikan dengan ejaan baku.`;

  const totalScore = scoreStructure + scoreEYD + scoreCohesion + scoreDiksi + scoreRelevance;
  let predikat = "Cukup (C)";
  if (totalScore >= 18) predikat = "Sangat Baik (A)";
  else if (totalScore >= 14) predikat = "Baik (B)";
  else if (totalScore >= 10) predikat = "Cukup (C)";
  else predikat = "Perlu Banyak Perbaikan (D)";

  // Format identical to how ResultsPage expects it
  return `
### Kriteria 1: Struktur Paragraf
**Kekuatan:** Tulisan memiliki total ${wordsCount} kata terbagi dalam ${paragraphCount} paragraf dengan panjang rata-rata kalimat sekitar ${Math.round(averageSentenceLength)} kata.
**Area Perbaikan:** ${scoreStructure < 4 ? 'Cobalah buat paragraf yang seimbang dengan minimal terdapat 2-3 paragraf utuh (pengantar, penjelasan, dan kesimpulan) agar argumen runut.' : 'Struktur penulisan sudah tertata sangat baik dan proporsional.'}
Skor: ${scoreStructure}/4

### Kriteria 2: Penggunaan EYD Edisi V
**Kekuatan:** Berhasil menulis kalimat utuh dengan tanda baca titik dan koma di sebagian besar teks.
**Area Perbaikan:** ${eydPerbaikan}
Skor: ${scoreEYD}/4

### Kriteria 3: Kohesi dan Koherensi
**Kekuatan:** Menggunakan sekitar ${transitionCount} kata penghubung antarkalimat untuk menjaga keberlanjutan alur gagasan Anda.
**Area Perbaikan:** ${scoreCohesion < 4 ? 'Gunakan konjungsi antarkalimat seperti "Namun", "Selain itu", atau "Oleh karena itu" untuk merekatkan gagasan di baris berikutnya.' : 'Alur kohesi kalimat terjalin rapi dan mudah diikuti.'}
Skor: ${scoreCohesion}/4

### Kriteria 4: Diksi dan Kosakata
**Kekuatan:** Mampu menyampaikan kosa kata utama bahasa Indonesia secara lugas.
**Area Perbaikan:** ${diksiPerbaikan}
Skor: ${scoreDiksi}/4

### Kriteria 5: Kejelasan Ide dan Argumentasi
**Kekuatan:** Ide yang diajukan memiliki korelasi dengan kata kunci topik sekitar ${Math.round(relevanceRatio * 100)}%.
**Area Perbaikan:** ${scoreRelevance === 1 ? 'PENTING: Tulisan Anda dinilai melenceng jauh dari Topik (Prompt) utama yang diajukan. Harap tulis ulang esai agar sepenuhnya menjawab topik penulisan.' : scoreRelevance < 4 ? 'Fokuskan argumen utama agar langsung mengarah pada topik yang diminta tanpa melebar terlalu jauh.' : 'Ide utama orisinal dan tersampaikan dengan argumentasi yang relevan.'}
Skor: ${scoreRelevance}/4

---
**Ringkasan Keseluruhan:** Ulasan lokal (offline) mendeteksi tulisan Anda telah disubmit dengan total skor ${totalScore}/20. Evaluasi ini menggunakan mesin tata bahasa cadangan lokal karena koneksi AI sedang sibuk/offline.
**Total Skor: ${totalScore}/20 — ${predikat}**

**Kalimat Penutup Motivasi:** Teruslah berlatih menulis dan perbaiki ejaan yang salah agar kemampuan literasimu semakin matang!
  `.trim();
}

/**
 * Local offline evaluation engine for typing tests (Menulis Cepat)
 */
export function runLocalMenulisCepatEvaluation(wpm, accuracy, consistency, mistypedChars) {
  let speedCategory = "pemula";
  if (wpm >= 80) speedCategory = "profesional kilat";
  else if (wpm >= 50) speedCategory = "menengah cepat";
  else if (wpm >= 30) speedCategory = "rata-rata";

  let feedbackAcc = "Akurasi pengetikan luar biasa!";
  if (accuracy < 90) {
    feedbackAcc = `Akurasi Anda (${accuracy}%) di bawah standar. Perhatikan huruf-huruf yang salah ketik.`;
  }

  let feedbackCons = "Ritme ketikan Anda stabil.";
  if (consistency > 8) {
    feedbackCons = "Ritme mengetik Anda kurang stabil, cobalah mengetik secara konstan tanpa terburu-buru.";
  }

  const errorsList = mistypedChars && mistypedChars.length > 0
    ? `Karakter bermasalah terbanyak: ` + mistypedChars.slice(0, 5).map(c => `"${c.expected}" tertukar "${c.typed}"`).join(', ')
    : "Tidak ada kesalahan karakter.";

  return `
Hasil evaluasi mengetik cepat (Lokal Offline):
Kecepatan mengetik Anda mencapai WPM ${wpm} yang tergolong dalam kategori ${speedCategory}.
${feedbackAcc}
${feedbackCons}
${errorsList}
Semoga sesi berikutnya bisa berjalan lebih konsisten dan cepat!
  `.trim();
}
