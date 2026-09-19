import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing large JSON payloads (for base64 images)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Gemini SDK lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCRS2cscEdc6M7lurTN4In9u0LNt54-37g';
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. AI analysis will use intelligent fallback.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Database store with initial rich seed data
interface InfrastructureReportStore {
  id: string;
  ticketNumber: string;
  imageUrl: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    district?: string;
  };
  kategori: string;
  tingkat_keparahan: 'Ringan' | 'Sedang' | 'Berat';
  deskripsi_otomatis: string;
  rekomendasi_prioritas: string;
  deskripsi_manual?: string;
  reporterName?: string;
  status: 'Baru' | 'Diproses' | 'Selesai';
  statusHistory: Array<{
    status: 'Baru' | 'Diproses' | 'Selesai';
    timestamp: string;
    notes?: string;
    updatedBy: string;
  }>;
  dinasNotes?: string;
  upvotes?: number;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_REPORTS: InfrastructureReportStore[] = [
  {
    id: 'rep-001',
    ticketNumber: 'INFRA-2026-0801',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    location: {
      lat: -6.2088,
      lng: 106.8456,
      address: 'Jl. Rasuna Said Kav. C-14, Karet Kuningan',
      city: 'Jakarta Selatan',
      district: 'Setiabudi'
    },
    kategori: 'Jalan Berlubang',
    tingkat_keparahan: 'Berat',
    deskripsi_otomatis: 'Lubang jalan sedalam ±12 cm dengan diameter 85 cm di lajur cepat. Terdapat retakan aspal aktif di sekitarnya yang berpotensi melebar saat hujan.',
    rekomendasi_prioritas: 'Perlu penanganan segera (Darurat < 24 jam) karena berada di jalur arteri berkecepatan tinggi dan sangat berisiko fatal bagi pengendara motor.',
    deskripsi_manual: 'Sudah ada 2 motor oleng kemarin malam karena jalanan gelap saat hujan gerimis. Mohon segera ditambal.',
    reporterName: 'Budi Santoso',
    status: 'Diproses',
    statusHistory: [
      {
        status: 'Baru',
        timestamp: '2026-08-28T08:30:00Z',
        updatedBy: 'Sistem LaporInfra'
      },
      {
        status: 'Diproses',
        timestamp: '2026-08-29T10:15:00Z',
        notes: 'Tim Unit Reaksi Cepat (URC) Dinas Bina Marga telah diterjunkan untuk pengaspalan darurat (cold mix).',
        updatedBy: 'Dinas Bina Marga Jaksel'
      }
    ],
    dinasNotes: 'Jadwal patching aspal hotmix permanen pada 31 Agustus 2026 pukul 23:00 WIB.',
    upvotes: 24,
    createdAt: '2026-08-28T08:30:00Z',
    updatedAt: '2026-08-29T10:15:00Z'
  },
  {
    id: 'rep-002',
    ticketNumber: 'INFRA-2026-0802',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
    location: {
      lat: -6.9175,
      lng: 107.6191,
      address: 'Jembatan Cikapundung, Jl. Asia Afrika No. 88',
      city: 'Bandung',
      district: 'Sumur Bandung'
    },
    kategori: 'Jembatan Retak',
    tingkat_keparahan: 'Berat',
    deskripsi_otomatis: 'Retakan struktural diagonal pada pilar penyangga samping barat jembatan dengan celah tampak melebar hingga 2.5 cm. Tanda-tanda rembesan air pada abutment.',
    rekomendasi_prioritas: 'Prioritas Tertinggi (Level 1). Butuh uji integritas struktural dan pembatasan tonase muatan kendaraan berat sebelum terjadi kegagalan struktur parsial.',
    deskripsi_manual: 'Retakan makin membesar setelah hujan lebat 3 hari berturut-turut. Terasa ada getaran abnormal saat truk lewat.',
    reporterName: 'Dewi Lestari',
    status: 'Baru',
    statusHistory: [
      {
        status: 'Baru',
        timestamp: '2026-08-30T14:20:00Z',
        updatedBy: 'Sistem LaporInfra'
      }
    ],
    upvotes: 48,
    createdAt: '2026-08-30T14:20:00Z',
    updatedAt: '2026-08-30T14:20:00Z'
  },
  {
    id: 'rep-003',
    ticketNumber: 'INFRA-2026-0803',
    imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=1200&q=80',
    location: {
      lat: -7.2575,
      lng: 112.7521,
      address: 'Jl. Pemuda No. 42 (Dekat Stasiun Gubeng)',
      city: 'Surabaya',
      district: 'Genteng'
    },
    kategori: 'Trotoar Rusak',
    tingkat_keparahan: 'Sedang',
    deskripsi_otomatis: 'Keramik paving block trotoar ambles dan paving guiding block (tanda tuna netra) pecah sepanjang ±6 meter di depan halte bus.',
    rekomendasi_prioritas: 'Prioritas Sedang. Mengganggu aksesibilitas pejalan kaki dan membahayakan penyandang disabilitas netra.',
    deskripsi_manual: 'Banyak pejalan kaki tersandung, terutama lansia dan anak sekolah yang menyeberang ke stasiun.',
    reporterName: 'Fajar Nugraha',
    status: 'Diproses',
    statusHistory: [
      {
        status: 'Baru',
        timestamp: '2026-08-25T09:10:00Z',
        updatedBy: 'Sistem LaporInfra'
      },
      {
        status: 'Diproses',
        timestamp: '2026-08-27T11:00:00Z',
        notes: 'Material paving block baru dan ubin difabel kuning sudah dikirim ke lokasi.',
        updatedBy: 'Dinas Sumber Daya Air & Bina Marga Surabaya'
      }
    ],
    dinasNotes: 'Pengerjaan pemasangan kembali ubin pemandu disabilitas sedang berjalan.',
    upvotes: 19,
    createdAt: '2026-08-25T09:10:00Z',
    updatedAt: '2026-08-27T11:00:00Z'
  },
  {
    id: 'rep-004',
    ticketNumber: 'INFRA-2026-0804',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    location: {
      lat: -7.7956,
      lng: 110.3695,
      address: 'Jl. Malioboro Gang 3 (Arah Pasar Beringharjo)',
      city: 'Yogyakarta',
      district: 'Danurejan'
    },
    kategori: 'Lampu Jalan Mati',
    tingkat_keparahan: 'Sedang',
    deskripsi_otomatis: 'Penerangan Jalan Umum (PJU) padam pada 3 tiang berurutan sepanjang 90 meter. Rumah lampu tampak pecah dan kabel sambungan terbuka.',
    rekomendasi_prioritas: 'Prioritas Sedang. Area wisata dan pertokoan menjadi gelap gulita, meningkatkan potensi tindak kejahatan jalanan dan kecelakaan penyeberang.',
    deskripsi_manual: 'Lampu sudah mati 4 malam. Jalur ini ramai wisatawan dan pedagang kaki lima saat malam hari.',
    reporterName: 'Rian Pradana',
    status: 'Selesai',
    statusHistory: [
      {
        status: 'Baru',
        timestamp: '2026-08-20T19:40:00Z',
        updatedBy: 'Sistem LaporInfra'
      },
      {
        status: 'Diproses',
        timestamp: '2026-08-21T09:00:00Z',
        notes: 'Pengecekan panel gardu dan penggantian modul LED 120W.',
        updatedBy: 'Dishub DIY'
      },
      {
        status: 'Selesai',
        timestamp: '2026-08-22T16:30:00Z',
        notes: 'Seluruh lampu telah menyala normal dan kabel diperbaiki sesuai standar K3.',
        updatedBy: 'Dishub DIY'
      }
    ],
    dinasNotes: 'Penggantian lampu LED hemat energi selesai dikerjakan.',
    upvotes: 31,
    createdAt: '2026-08-20T19:40:00Z',
    updatedAt: '2026-08-22T16:30:00Z'
  },
  {
    id: 'rep-005',
    ticketNumber: 'INFRA-2026-0805',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    location: {
      lat: -6.1754,
      lng: 106.8272,
      address: 'Jl. Gajah Mada No. 112 (Dekat Simpang Harmoni)',
      city: 'Jakarta Pusat',
      district: 'Gambir'
    },
    kategori: 'Saluran Air Tersumbat',
    tingkat_keparahan: 'Berat',
    deskripsi_otomatis: 'Saluran drainase primer tertimbun endapan sedimen lumpur padat dan sampah plastik setinggi 80% dari kapasitas gorong-gorong. Tutup grating besi patah.',
    rekomendasi_prioritas: 'Prioritas Tinggi menjelang musim penghujan. Potensi genangan banjir setinggi 40 cm meluap ke badan jalan utama dalam waktu 20 menit hujan.',
    deskripsi_manual: 'Setiap hujan air meluap ke ruko-ruko sekitar. Saluran tidak pernah dikeruk 6 bulan terakhir.',
    reporterName: 'Siti Aminah',
    status: 'Baru',
    statusHistory: [
      {
        status: 'Baru',
        timestamp: '2026-08-30T16:45:00Z',
        updatedBy: 'Sistem LaporInfra'
      }
    ],
    upvotes: 14,
    createdAt: '2026-08-30T16:45:00Z',
    updatedAt: '2026-08-30T16:45:00Z'
  },
  {
    id: 'rep-006',
    ticketNumber: 'INFRA-2026-0806',
    imageUrl: 'https://images.unsplash.com/photo-1588694926280-3ae414d06ccb?auto=format&fit=crop&w=1200&q=80',
    location: {
      lat: 3.5952,
      lng: 98.6722,
      address: 'Jl. Gatot Subroto No. 210',
      city: 'Medan',
      district: 'Medan Petisah'
    },
    kategori: 'Jalan Berlubang',
    tingkat_keparahan: 'Ringan',
    deskripsi_otomatis: 'Retakan buaya (alligator cracking) pada bahu jalan sebelah kiri dengan kedalaman < 3 cm. Belum terbentuk lubang tembus ke lapis pondasi.',
    rekomendasi_prioritas: 'Prioritas Ringan. Disarankan peremajaan seal coat sebelum retakan tergerus air dan berubah menjadi lubang besar.',
    deskripsi_manual: 'Permukaan aspal mulai terkelupas sedikit di tepi jalan.',
    reporterName: 'Hendra Gunawan',
    status: 'Selesai',
    statusHistory: [
      {
        status: 'Baru',
        timestamp: '2026-08-15T10:00:00Z',
        updatedBy: 'Sistem LaporInfra'
      },
      {
        status: 'Selesai',
        timestamp: '2026-08-18T14:00:00Z',
        notes: 'Dilakukan perataan slurry seal permukaan bahu jalan.',
        updatedBy: 'Dinas PU Kota Medan'
      }
    ],
    upvotes: 7,
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-18T14:00:00Z'
  }
];

let reportsDatabase: InfrastructureReportStore[] = JSON.parse(JSON.stringify(INITIAL_REPORTS));

// ================= API ENDPOINTS ================= //

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'LaporInfra API', timestamp: new Date().toISOString() });
});

// 2. AI Vision Damage Analysis with Gemini
app.post('/api/gemini/analyze-damage', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', imageUrl, manualHint } = req.body;

    let base64Data = imageBase64;
    let actualMime = mimeType;

    // If imageUrl is provided without imageBase64, fetch it and convert to base64
    if (!base64Data && imageUrl) {
      try {
        const fetchRes = await fetch(imageUrl);
        const arrayBuf = await fetchRes.arrayBuffer();
        base64Data = Buffer.from(arrayBuf).toString('base64');
        const headerMime = fetchRes.headers.get('content-type');
        if (headerMime) actualMime = headerMime;
      } catch (err) {
        console.error('Failed to fetch image from URL:', err);
      }
    }

    if (!base64Data) {
      return res.status(400).json({
        error: 'Foto kerusakan wajib disediakan (dalam format base64 atau image URL).'
      });
    }

    // Clean base64 prefix if present (e.g. data:image/png;base64,...)
    if (base64Data.includes(',')) {
      const parts = base64Data.split(',');
      const match = parts[0].match(/data:(.*?);base64/);
      if (match && match[1]) {
        actualMime = match[1];
      }
      base64Data = parts[1];
    }

    const ai = getGeminiClient();

    // Helper for intelligent heuristic fallback
    const createHeuristicFallback = (reason?: string) => {
      const hint = (manualHint || '').toLowerCase();
      let kategori = 'Jalan Berlubang';
      let keparahan: 'Ringan' | 'Sedang' | 'Berat' = 'Sedang';
      let deskripsi = 'Terdeteksi indikasi kerusakan permukaan jalan dan aspal yang membutuhkan perbaikan.';
      let prioritas = 'Prioritas Penanganan Standar (Dinas Bina Marga). Menunggu verifikasi tim lapangan.';
      let skor = 6.0;

      if (hint.includes('lampu') || hint.includes('pju') || hint.includes('gelap')) {
        kategori = 'Lampu Jalan Mati';
        deskripsi = 'Penerangan Jalan Umum (PJU) padam atau mengalami gangguan kelistrikan.';
        prioritas = 'Prioritas Sedang. Mengurangi risiko kriminalitas dan kecelakaan saat malam hari.';
        skor = 6.5;
      } else if (hint.includes('jembatan') || hint.includes('retak')) {
        kategori = 'Jembatan Retak';
        keparahan = 'Berat';
        deskripsi = 'Retakan fisik pada struktur pondasi atau dinding penopang jembatan.';
        prioritas = 'Prioritas Tinggi (Level 1). Diperlukan inspeksi visual dan struktural mendesak.';
        skor = 8.5;
      } else if (hint.includes('trotoar') || hint.includes('paving') || hint.includes('pedestrian')) {
        kategori = 'Trotoar Rusak';
        deskripsi = 'Kerusakan paving block atau jalur pedestrian yang mengganggu aksesibilitas pejalan kaki.';
        prioritas = 'Prioritas Sedang. Perbaikan jalur pedestrian dan ubin pemandu.';
        skor = 5.5;
      } else if (hint.includes('banjir') || hint.includes('drainase') || hint.includes('got') || hint.includes('saluran')) {
        kategori = 'Saluran Air Tersumbat';
        keparahan = 'Berat';
        deskripsi = 'Endapan sedimen atau sumbatan pada gorong-gorong drainase pembuangan air.';
        prioritas = 'Prioritas Tinggi menjelang musim hujan guna mencegah genangan air meluap.';
        skor = 7.5;
      }

      return {
        kategori,
        tingkat_keparahan: keparahan,
        deskripsi_otomatis: deskripsi,
        rekomendasi_prioritas: prioritas,
        is_valid_infrastructure: true,
        perkiraan_bahaya: 'Potensi gangguan kenyamanan dan keselamatan pengguna fasilitas umum.',
        skor_keparahan: skor,
        is_fallback: true,
        fallback_notice: reason || 'Analisis awal estimasi aktif (server AI sedang sibuk).'
      };
    };

    if (!ai) {
      console.log('Using simulated Gemini analysis heuristic (no API key)');
      return res.json(createHeuristicFallback());
    }

    const promptText = `Anda adalah asisten AI inspeksi infrastruktur publik dan sipil (Dinas Bina Marga & Cipta Karya) untuk sistem LaporInfra (mendukung SDG 9: Ketahanan Infrastruktur & Inovasi Berkelanjutan).

Tugas Anda: Analisis foto infrastruktur yang diunggah warga secara teliti.
${manualHint ? `Catatan dari pelapor: "${manualHint}"` : ''}

Periksa apakah foto benar-benar memperlihatkan infrastruktur/fasilitas publik (seperti jalan, jembatan, trotoar, lampu jalan/PJU, drainase/gorong-gorong, rambu jalan, halte, dsb.).
- Jika BUKAN infrastruktur publik (misal: foto selfie, wajah orang, hewan, makanan, dokumen, pemandangan alam bebas tanpa infrastruktur, atau foto buram total tanpa objek jelas), set 'is_valid_infrastructure' menjadi false, berikan deskripsi_otomatis dan rekomendasi_prioritas yang sopan dalam Bahasa Indonesia menjelaskan bahwa foto tidak memuat kerusakan fasilitas umum yang valid.

Jika MERUPAKAN infrastruktur publik, klasifikasikan:
1. kategori: Pilih salah satu yang paling presisi:
   - "Jalan Berlubang"
   - "Jembatan Retak"
   - "Trotoar Rusak"
   - "Lampu Jalan Mati"
   - "Saluran Air Tersumbat"
   - "Fasilitas Publik Lainnya"

2. tingkat_keparahan:
   - "Ringan": Kerusakan minor/estetik, retak rambut halus, belum membahayakan nyawa atau mengganggu kelancaran umum.
   - "Sedang": Paving ambles, lampu mati sebagian, lubang kedalaman sedang (<5 cm), mengganggu kenyamanan & akses disabilitas.
   - "Berat": Lubang jalan dalam (>8 cm) di jalur cepat, jembatan retak struktural/pilar amblas, drainase tersumbat total pemicu banjir, tiang roboh/kabel bertegangan menjuntai, sangat membahayakan keselamatan jiwa.

3. deskripsi_otomatis: Buat ringkasan kondisi kerusakan dalam 1-2 kalimat Bahasa Indonesia yang teknis, padat, dan jelas.
4. rekomendasi_prioritas: Jelaskan urgensi respon waktu penanganan (misal: "Respon Darurat < 24 jam" atau "Respon Terjadwal < 7 hari") beserta alasan keselamatan.
5. perkiraan_bahaya: Potensi risiko langsung bagi pengguna jalan atau warga sekitar.
6. skor_keparahan: Nilai numerik 1.0 (sangat ringan) hingga 10.0 (sangat kritis/bencana).`;

    // Multi-tier model fallback list to handle high demand (503 / 429) gracefully
    const candidateModels = [
      'gemini-3.7-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite'
    ];

    let lastError: any = null;
    let parsedResult: any = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Attempting damage analysis with model: ${modelName}`);

        // Try up to 2 attempts per model with backoff
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: actualMime,
                      data: base64Data,
                    },
                  },
                  {
                    text: promptText,
                  },
                ],
              },
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    kategori: {
                      type: Type.STRING,
                      description: 'Kategori kerusakan infrastruktur publik',
                    },
                    tingkat_keparahan: {
                      type: Type.STRING,
                      description: 'Tingkat keparahan: Ringan, Sedang, atau Berat',
                    },
                    deskripsi_otomatis: {
                      type: Type.STRING,
                      description: 'Ringkasan kondisi kerusakan dalam Bahasa Indonesia',
                    },
                    rekomendasi_prioritas: {
                      type: Type.STRING,
                      description: 'Alasan teknis dan rekomendasi urgensi penanganan',
                    },
                    is_valid_infrastructure: {
                      type: Type.BOOLEAN,
                      description: 'True jika foto valid memuat kerusakan infrastruktur/fasilitas umum, False jika bukan',
                    },
                    perkiraan_bahaya: {
                      type: Type.STRING,
                      description: 'Potensi risiko keselamatan atau dampak lingkungan',
                    },
                    skor_keparahan: {
                      type: Type.NUMBER,
                      description: 'Skor keparahan 1-10',
                    },
                  },
                  required: [
                    'kategori',
                    'tingkat_keparahan',
                    'deskripsi_otomatis',
                    'rekomendasi_prioritas',
                    'is_valid_infrastructure',
                  ],
                },
              },
            });

            const textOutput = response.text;
            if (textOutput) {
              parsedResult = JSON.parse(textOutput);
              break;
            }
          } catch (attemptErr: any) {
            lastError = attemptErr;
            const errMsg = String(attemptErr?.message || attemptErr);
            const isTransient = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('429') || errMsg.includes('UNAVAILABLE');

            if (isTransient && attempt < 2) {
              console.warn(`Transient error on ${modelName} (attempt ${attempt}), retrying in 600ms...`);
              await new Promise((resolve) => setTimeout(resolve, 600));
              continue;
            }
            throw attemptErr;
          }
        }

        if (parsedResult) {
          return res.json(parsedResult);
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        console.warn(`Model ${modelName} failed, falling back to next candidate:`, modelErr?.message || modelErr);
      }
    }

    // If all remote models failed due to upstream 503 high demand or network limits,
    // return resilient domain heuristic analysis so citizen reporting is never blocked
    console.warn('All Gemini candidate models failed, providing resilient heuristic fallback:', lastError?.message);
    return res.json(createHeuristicFallback('Analisis estimasi disajikan sementara karena lonjakan lalu lintas server AI.'));
  } catch (error: any) {
    console.error('Error in analyze-damage:', error);
    return res.json({
      kategori: 'Jalan Berlubang',
      tingkat_keparahan: 'Sedang',
      deskripsi_otomatis: 'Terdeteksi laporan kerusakan infrastruktur. Silakan periksa kembali kategori dan deskripsi.',
      rekomendasi_prioritas: 'Menunggu peninjauan oleh verifikator dinas terkait.',
      is_valid_infrastructure: true,
      is_fallback: true,
      fallback_notice: 'Mode cadangan aktif.'
    });
  }
});

// 2b. Gemini Multi-Turn Chatbot with Model Switching & Google Maps Grounding
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      messages = [],
      roleMode = 'general',
      location = null,
      enableMapsGrounding = false,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Daftar pesan percakapan (messages) tidak boleh kosong.' });
    }

    const ai = getGeminiClient();

    // Determine target primary model and candidate fallback chain based on requested roleMode
    // Complex tasks -> gemini-3.1-pro-preview
    // General tasks -> gemini-2.5-flash
    // Fast tasks -> gemini-3.1-flash-lite
    // Maps grounded tasks -> gemini-2.5-flash (with googleMaps tool)
    let candidateModels: string[] = [];
    let systemInstruction = '';
    let isMapsTask = Boolean(enableMapsGrounding || roleMode === 'maps');

    if (roleMode === 'complex') {
      candidateModels = ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-3.7-flash'];
      systemInstruction = `Anda adalah "Insinyur Sipil Senior & Analis Struktur PUPR" untuk platform LaporInfra (mendukung SDG 9: Infrastruktur Berkelanjutan).
Keahlian Anda mencakup:
- Rekayasa perkerasan jalan raya (Hotmix AC-WC, AC-BC, subgrade CBR, rigid pavement beton semen K-350).
- Analisis kegagalan struktural jembatan (defleksi girder, settlement abutment, scouring pilar, retak geser).
- Hidrologi dan drainase primer/sekunder perkotaan, kapasitas debit air kala ulang Q25/Q50.
- Standar teknis Bina Marga Kementerian PUPR & SNI.
- Estimasi volume pekerjaan fisik & perkiraan anggaran biaya perbaikan (RAB/AHSP).
- Metodologi mitigasi darurat dan perbaikan permanen bertahap.

Berikan analisis yang mendalam, berwibawa, teknis, runtut, dan mudah dipahami dengan perhitungan estimasi praktis jika ditanyakan.`;
    } else if (roleMode === 'fast') {
      candidateModels = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];
      systemInstruction = `Anda adalah "Bot Tanggap Kilat & FAQ LaporInfra".
Tugas utama Anda:
- Memberikan jawaban super ringkas, cepat, dan to-the-point (maksimal 3-4 kalimat atau poin-poin padat).
- Menjawab alur lapor kerusakan jalan/fasilitas umum, nomor darurat dinas PU/Polantas/BPBD, dan kriteria tingkat urgensi (Level 1 Darurat <24 jam, Level 2 Sedang <7 hari, Level 3 Ringan).
- Bersikap ramah, efisien, dan responsif.`;
    } else if (isMapsTask) {
      candidateModels = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
      systemInstruction = `Anda adalah "Navigator Fasilitas Infrastruktur & Tanggap Darurat PU" berbasis data Google Maps Platform.
Tugas utama Anda:
- Membantu warga dan petugas menemukan lokasi kantor Dinas Pekerjaan Umum, kantor Bina Marga, posko Unit Reaksi Cepat (URC), depo aspal/material konstruksi, kantor polisi lalu lintas, atau rumah sakit/fasilitas darurat terdekat di seluruh Indonesia.
- Menyajikan nama tempat, estimasi jarak/aksesibilitas, dan panduan rute navigasi yang jelas.
- Data grounding Google Maps akan otomatis dilampirkan sebagai tautan peta interaktif.`;
    } else {
      // General Mode
      candidateModels = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
      systemInstruction = `Anda adalah "LaporInfra Assistant", asisten AI ramah, cerdas, dan interaktif untuk sistem pelaporan kerusakan infrastruktur publik di Indonesia.
Anda siap membantu warga mengenai:
1. Cara mengambil foto dan melaporkan jalan berlubang, jembatan retak, trotoar rusak, lampu jalan mati, dan saluran tersumbat.
2. Memberikan tips keselamatan saat melintasi jalur rawan atau jalan rusak.
3. Menjelaskan transparansi status laporan (Baru -> Diproses -> Selesai) dan peran masyarakat dalam mendukung SDG 9.
4. Memberikan saran rute atau tindakan pencegahan kecelakaan.

Gunakan Bahasa Indonesia yang sopan, solutif, komunikatif, dan terstruktur rapi (gunakan formatting Markdown tebal/poin untuk kemudahan membaca).`;
    }

    // Format multi-turn conversation history for @google/genai SDK
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.text || m.content || '') }],
    }));

    // Build configuration object
    const configPayload: any = {
      systemInstruction,
    };

    // If Maps Grounding is requested, add the googleMaps tool & user location if present
    if (isMapsTask) {
      configPayload.tools = [{ googleMaps: {} }];
      if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
        configPayload.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng,
            },
          },
        };
      }
    }

    if (!ai) {
      // Offline / No-API-key heuristic fallback response
      const lastMsg = messages[messages.length - 1]?.text || '';
      return res.json({
        text: `Halo! Saya adalah Asisten AI LaporInfra (Mode Edukasi & Demo). 

Mengenai pertanyaan Anda: *"**${lastMsg.substring(0, 100)}**"*, Anda dapat membuat laporan kerusakan infrastruktur dengan tombol **+ Lapor Kerusakan** di bagian atas layar. Tim Dinas Pekerjaan Umum akan memverifikasi foto dan koordinat GPS secara berkala.

Jika terjadi keadaan darurat di jalan raya (misal lubang dalam di lajur cepat atau tiang listrik roboh), segera hubungi Call Center Darurat PU / 112.`,
        groundingChunks: [],
        modelUsed: 'offline-demo',
      });
    }

    let responseText = '';
    let groundingChunks: any[] = [];
    let groundingMetadata: any = null;
    let successfulModel = '';
    let lastChatError: any = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Executing multi-turn chat with model: ${modelName} (isMaps: ${isMapsTask})`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: configPayload,
        });

        if (response && response.text) {
          responseText = response.text;
          successfulModel = modelName;

          // Extract Maps & Web grounding metadata as required by Guidelines
          if (response.candidates?.[0]?.groundingMetadata) {
            groundingMetadata = response.candidates[0].groundingMetadata;
            if (Array.isArray(groundingMetadata.groundingChunks)) {
              groundingChunks = groundingMetadata.groundingChunks;
            }
          }
          break;
        }
      } catch (err: any) {
        lastChatError = err;
        console.warn(`Chat model ${modelName} failed:`, err?.message || err);

        // If failure was due to googleMaps tool incompatibility on a specific model, try without tools or next model
        if (isMapsTask && String(err?.message).includes('tool')) {
          try {
            console.log(`Retrying without googleMaps tool on ${modelName}...`);
            const retryResp = await ai.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config: { systemInstruction },
            });
            if (retryResp && retryResp.text) {
              responseText = retryResp.text;
              successfulModel = modelName;
              break;
            }
          } catch (retryErr) {
            console.warn(`Retry without tool failed:`, retryErr);
          }
        }
      }
    }

    if (!responseText) {
      console.warn('All candidate models failed in chat, providing resilient fallback:', lastChatError?.message);
      responseText = `Mohon maaf, lalu lintas layanan AI saat ini sedang tinggi. Namun informasi penting untuk Anda:
- Untuk melaporkan kerusakan baru: Buka tab **Lapor** dan unggah foto lokasi.
- Untuk penanganan darurat jalan: Hubungi Posko Siaga Unit Reaksi Cepat Dinas Bina Marga terdekat atau Call Center 112.
- Data laporan Anda tetap tersimpan dan disinkronisasi ke dashboard dinas secara real-time.`;
      successfulModel = 'system-fallback';
    }

    return res.json({
      text: responseText,
      groundingChunks,
      groundingMetadata,
      modelUsed: successfulModel,
      roleMode,
    });
  } catch (chatError: any) {
    console.error('Error in /api/gemini/chat endpoint:', chatError);
    return res.status(500).json({
      error: 'Terjadi gangguan saat memproses percakapan AI.',
      message: chatError?.message || 'Internal Server Error',
    });
  }
});

// 3. Get all reports (with optional filters)
app.get('/api/reports', (req, res) => {
  const { category, severity, status, search, sort } = req.query;

  let list = [...reportsDatabase];

  if (category && category !== 'Semua') {
    list = list.filter((r) => r.kategori === category);
  }

  if (severity && severity !== 'Semua') {
    list = list.filter((r) => r.tingkat_keparahan === severity);
  }

  if (status && status !== 'Semua') {
    list = list.filter((r) => r.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.kategori.toLowerCase().includes(q) ||
        r.deskripsi_otomatis.toLowerCase().includes(q) ||
        (r.deskripsi_manual && r.deskripsi_manual.toLowerCase().includes(q)) ||
        (r.location.address && r.location.address.toLowerCase().includes(q)) ||
        (r.location.city && r.location.city.toLowerCase().includes(q)) ||
        r.ticketNumber.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'keparahan_tertinggi') {
    const order = { Berat: 3, Sedang: 2, Ringan: 1 };
    list.sort((a, b) => {
      const diff = (order[b.tingkat_keparahan] || 0) - (order[a.tingkat_keparahan] || 0);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sort === 'terlama') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'paling_banyak_dukungan') {
    list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  } else {
    // Default 'terbaru'
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({
    total: list.length,
    reports: list,
  });
});

// 4. Get single report by ID
app.get('/api/reports/:id', (req, res) => {
  const report = reportsDatabase.find((r) => r.id === req.params.id || r.ticketNumber === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  }
  res.json(report);
});

// 5. Create new report
app.post('/api/reports', (req, res) => {
  const {
    imageUrl,
    location,
    kategori,
    tingkat_keparahan,
    deskripsi_otomatis,
    rekomendasi_prioritas,
    deskripsi_manual,
    reporterName = 'Warga Peduli'
  } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Foto kerusakan wajib disertakan' });
  }

  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return res.status(400).json({ error: 'Koordinat lokasi tidak valid' });
  }

  const now = new Date().toISOString();
  const count = reportsDatabase.length + 1;
  const ticketNumber = `INFRA-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
  const newId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const newReport: InfrastructureReportStore = {
    id: newId,
    ticketNumber,
    imageUrl,
    location: {
      lat: location.lat,
      lng: location.lng,
      address: location.address || 'Lokasi Terdeteksi GPS',
      city: location.city || 'Kota Pelapor',
      district: location.district || 'Kecamatan Terdeteksi'
    },
    kategori: kategori || 'Jalan Berlubang',
    tingkat_keparahan: tingkat_keparahan || 'Sedang',
    deskripsi_otomatis: deskripsi_otomatis || 'Laporan kerusakan infrastruktur umum telah dicatat oleh sistem.',
    rekomendasi_prioritas: rekomendasi_prioritas || 'Akan diverifikasi oleh dinas terkait.',
    deskripsi_manual: deskripsi_manual || '',
    reporterName,
    status: 'Baru',
    statusHistory: [
      {
        status: 'Baru',
        timestamp: now,
        notes: 'Laporan warga berhasil tercatat di sistem LaporInfra.',
        updatedBy: 'Sistem LaporInfra'
      }
    ],
    upvotes: 1,
    createdAt: now,
    updatedAt: now
  };

  reportsDatabase.unshift(newReport);

  res.status(201).json({
    message: 'Laporan berhasil dibuat dan diteruskan ke dashboard dinas.',
    report: newReport
  });
});

// 6. Update report status & dinas notes (Admin)
app.patch('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes, updatedBy = 'Petugas Dinas PU' } = req.body;

  const report = reportsDatabase.find((r) => r.id === id || r.ticketNumber === id);
  if (!report) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  }

  const now = new Date().toISOString();

  if (status && ['Baru', 'Diproses', 'Selesai'].includes(status)) {
    report.status = status;
  }

  if (notes) {
    report.dinasNotes = notes;
  }

  report.statusHistory.push({
    status: report.status,
    timestamp: now,
    notes: notes || `Status diubah menjadi "${report.status}"`,
    updatedBy
  });

  report.updatedAt = now;

  res.json({
    message: 'Status laporan berhasil diperbarui',
    report
  });
});

// 7. Upvote a report
app.post('/api/reports/:id/upvote', (req, res) => {
  const { id } = req.params;
  const report = reportsDatabase.find((r) => r.id === id);
  if (!report) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  }

  report.upvotes = (report.upvotes || 0) + 1;
  res.json({ upvotes: report.upvotes });
});

// 8. Super Admin: Update full report details (title, photos, description, severity, status, location)
app.put('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const index = reportsDatabase.findIndex((r) => r.id === id || r.ticketNumber === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  }

  const existing = reportsDatabase[index];
  const now = new Date().toISOString();
  const updates = req.body;

  const updatedReport: InfrastructureReportStore = {
    ...existing,
    ...updates,
    id: existing.id,
    ticketNumber: existing.ticketNumber,
    updatedAt: now,
  };

  reportsDatabase[index] = updatedReport;
  res.json({
    message: 'Laporan berhasil diperbarui oleh Super Admin',
    report: updatedReport
  });
});

// 9. Super Admin: Delete report
app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const index = reportsDatabase.findIndex((r) => r.id === id || r.ticketNumber === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  }

  reportsDatabase.splice(index, 1);
  res.json({ message: 'Laporan berhasil dihapus oleh Super Admin', success: true });
});

// 10. Reset reports to initial seed
app.post('/api/reports/reset', (req, res) => {
  reportsDatabase = JSON.parse(JSON.stringify(INITIAL_REPORTS));
  res.json({ message: 'Database laporan berhasil di-reset ke data demo awal', count: reportsDatabase.length });
});

// 9. Admin Statistics Overview
app.get('/api/admin/stats', (req, res) => {
  const total = reportsDatabase.length;
  const countBaru = reportsDatabase.filter((r) => r.status === 'Baru').length;
  const countDiproses = reportsDatabase.filter((r) => r.status === 'Diproses').length;
  const countSelesai = reportsDatabase.filter((r) => r.status === 'Selesai').length;

  const countBerat = reportsDatabase.filter((r) => r.tingkat_keparahan === 'Berat').length;
  const countSedang = reportsDatabase.filter((r) => r.tingkat_keparahan === 'Sedang').length;
  const countRingan = reportsDatabase.filter((r) => r.tingkat_keparahan === 'Ringan').length;

  const categoryCounts: Record<string, number> = {};
  reportsDatabase.forEach((r) => {
    categoryCounts[r.kategori] = (categoryCounts[r.kategori] || 0) + 1;
  });

  res.json({
    total,
    statusCounts: {
      baru: countBaru,
      diproses: countDiproses,
      selesai: countSelesai,
    },
    severityCounts: {
      berat: countBerat,
      sedang: countSedang,
      ringan: countRingan,
    },
    categoryCounts,
    resolutionRate: total > 0 ? Math.round((countSelesai / total) * 100) : 0,
    urgentPending: reportsDatabase.filter((r) => r.tingkat_keparahan === 'Berat' && r.status !== 'Selesai').length
  });
});

// Setup Vite development middleware or static production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LaporInfra full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
