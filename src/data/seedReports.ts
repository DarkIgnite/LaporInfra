import { InfrastructureReport } from '../types';

export const SEED_REPORTS: InfrastructureReport[] = [
  {
    id: 'rep-001',
    ticketNumber: 'INFRA-2026-0801',
    title: 'Lubang Aspal Ambles di Lajur Cepat Rasuna Said',
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
    title: 'Retakan Struktural Abutment Jembatan Cikapundung',
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
    title: 'Paving Guiding Block Trotoar Ambles Dekat Stasiun',
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
    title: '3 Tiang Lampu PJU Padam Berurutan di Malioboro',
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
    title: 'Saluran Drainase Primer Tersumbat Lumpur & Sampah',
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
    title: 'Retak Buaya Pada Bahu Jalan Gatot Subroto',
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

export const DEMO_PRESET_IMAGES = [
  {
    id: 'sample-pothole',
    name: 'Jalan Berlubang Parah (Lajur Arteri)',
    category: 'Jalan Berlubang',
    severity: 'Berat',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    lat: -6.2088,
    lng: 106.8456,
    address: 'Jl. Rasuna Said Kav. C-14, Jakarta Selatan'
  },
  {
    id: 'sample-bridge',
    name: 'Retak Abutment Jembatan',
    category: 'Jembatan Retak',
    severity: 'Berat',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    lat: -6.9175,
    lng: 107.6191,
    address: 'Jembatan Cikapundung, Jl. Asia Afrika, Bandung'
  },
  {
    id: 'sample-sidewalk',
    name: 'Paving Trotoar Ambles & Pecah',
    category: 'Trotoar Rusak',
    severity: 'Sedang',
    url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    lat: -7.2575,
    lng: 112.7521,
    address: 'Jl. Pemuda No. 42, Genteng, Surabaya'
  },
  {
    id: 'sample-drainage',
    name: 'Drainase Tersumbat & Meluap',
    category: 'Saluran Air Tersumbat',
    severity: 'Berat',
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    lat: -6.1754,
    lng: 106.8272,
    address: 'Jl. Gajah Mada No. 112, Gambir, Jakarta Pusat'
  },
  {
    id: 'sample-light',
    name: 'Lampu PJU Padam di Tikungan',
    category: 'Lampu Jalan Mati',
    severity: 'Sedang',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    lat: -7.7956,
    lng: 110.3695,
    address: 'Jl. Malioboro Gang 3, Danurejan, Yogyakarta'
  }
];
