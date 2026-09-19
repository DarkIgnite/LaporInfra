import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  increment
} from '../lib/firebase';
import { InfrastructureReport, AIAnalysisResult, ReportFilterState } from '../types';
import { SEED_REPORTS } from '../data/seedReports';

const REPORTS_COLLECTION = 'reports';
const STORAGE_KEY = 'laporinfra_reports_local_cache';

// Helper for local cache fallback
function getLocalCache(): InfrastructureReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage', e);
  }
  return SEED_REPORTS;
}

function saveLocalCache(reports: InfrastructureReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

// Seed initial reports to Firestore if collection is empty
let hasInitializedSeed = false;
export async function initializeFirestoreDatabase(): Promise<void> {
  if (hasInitializedSeed) return;
  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('Seeding initial reports to Firestore database...');
      for (const report of SEED_REPORTS) {
        await setDoc(doc(db, REPORTS_COLLECTION, report.id), report);
      }
      console.log('Firestore seed completed successfully!');
    }
    hasInitializedSeed = true;
  } catch (err) {
    console.warn('Firestore initialization seed check skipped/failed (will fallback):', err);
  }
}

// Real-time subscriber to reports collection
export function subscribeToReports(
  onUpdate: (reports: InfrastructureReport[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    // Ensure initial seed in background
    initializeFirestoreDatabase().catch(() => {});

    const colRef = collection(db, REPORTS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreList = snapshot.docs
            .map((docSnap) => docSnap.data() as InfrastructureReport)
            .filter((r) => r && r.id && r.ticketNumber);

          const cached = getLocalCache();
          const firestoreIds = new Set(firestoreList.map((r) => r.id));
          const localOnly = cached.filter((r) => !firestoreIds.has(r.id));
          const combined = [...localOnly, ...firestoreList];

          if (combined.length > 0) {
            saveLocalCache(combined);
            onUpdate(combined);
          } else {
            onUpdate(getLocalCache());
          }
        } else {
          onUpdate(getLocalCache());
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot listener error, using local fallback:', error);
        if (onError) onError(error);
        onUpdate(getLocalCache());
      }
    );

    return unsubscribe;
  } catch (e: any) {
    console.warn('Failed to subscribe to Firestore, falling back to cached reports:', e);
    onUpdate(getLocalCache());
    return () => {};
  }
}

// Fetch reports with filters
export async function fetchReports(filters?: Partial<ReportFilterState>): Promise<InfrastructureReport[]> {
  let list: InfrastructureReport[] = [];

  // 1. Try Firestore First
  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    if (!snap.empty) {
      list = snap.docs
        .map((d) => d.data() as InfrastructureReport)
        .filter((r) => r && r.id && r.ticketNumber);
    }
  } catch (err) {
    console.warn('Firestore getDocs failed, fallback to Express API / cache:', err);
  }

  // 2. Fallback to Express backend API if remote is empty
  if (list.length === 0) {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        if (data.reports && data.reports.length > 0) {
          list = data.reports;
        }
      }
    } catch (apiErr) {
      console.warn('API fetch failed:', apiErr);
    }
  }

  // 3. Always merge with locally created reports so recent user submissions never disappear
  const cached = getLocalCache();
  const remoteIds = new Set(list.map((r) => r.id));
  const localOnly = cached.filter((r) => !remoteIds.has(r.id));
  const merged = [...localOnly, ...list];

  if (merged.length > 0) {
    list = merged;
    saveLocalCache(list);
  } else {
    list = cached.length > 0 ? cached : SEED_REPORTS;
  }

  // Apply client-side filters
  if (filters?.category && filters.category !== 'Semua') {
    list = list.filter((r) => r.kategori === filters.category);
  }
  if (filters?.severity && filters.severity !== 'Semua') {
    list = list.filter((r) => r.tingkat_keparahan === filters.severity);
  }
  if (filters?.status && filters.status !== 'Semua') {
    list = list.filter((r) => r.status === filters.status);
  }
  if (filters?.searchQuery) {
    const qStr = filters.searchQuery.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.kategori.toLowerCase().includes(qStr) ||
        (r.deskripsi_otomatis && r.deskripsi_otomatis.toLowerCase().includes(qStr)) ||
        (r.deskripsi_manual && r.deskripsi_manual.toLowerCase().includes(qStr)) ||
        (r.location.address && r.location.address.toLowerCase().includes(qStr)) ||
        (r.location.city && r.location.city.toLowerCase().includes(qStr)) ||
        (r.location.province && r.location.province.toLowerCase().includes(qStr)) ||
        (r.ticketNumber && r.ticketNumber.toLowerCase().includes(qStr))
    );
  }

  if (filters?.sortBy === 'keparahan_tertinggi') {
    const order = { Berat: 3, Sedang: 2, Ringan: 1 };
    list.sort((a, b) => (order[b.tingkat_keparahan] || 0) - (order[a.tingkat_keparahan] || 0));
  } else if (filters?.sortBy === 'terlama') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (filters?.sortBy === 'paling_banyak_dukungan') {
    list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list;
}

// Fetch single report by ID
export async function fetchReportById(id: string): Promise<InfrastructureReport | null> {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as InfrastructureReport;
    }
  } catch (e) {
    console.warn('Firestore fetchReportById error:', e);
  }

  const list = getLocalCache();
  return list.find((r) => r.id === id || r.ticketNumber === id) || null;
}

// Analyze image with Gemini AI
export async function analyzeDamageWithAI(
  imageBase64: string,
  mimeType = 'image/jpeg',
  manualHint = ''
): Promise<AIAnalysisResult> {
  try {
    const res = await fetch('/api/gemini/analyze-damage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, manualHint }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return (
        errData.fallback || {
          kategori: 'Jalan Berlubang',
          tingkat_keparahan: 'Sedang',
          deskripsi_otomatis:
            'Terdeteksi laporan kerusakan infrastruktur publik. Anda dapat menyesuaikan rincian laporan secara manual.',
          rekomendasi_prioritas: 'Menunggu peninjauan dan verifikasi dinas terkait.',
          is_valid_infrastructure: true,
        }
      );
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Error calling Gemini analyze-damage:', err);
    return {
      kategori: 'Jalan Berlubang',
      tingkat_keparahan: 'Sedang',
      deskripsi_otomatis:
        'Terdeteksi kerusakan infrastruktur umum. Silakan periksa kembali kategori dan deskripsi laporan.',
      rekomendasi_prioritas: 'Menunggu verifikasi lapangan oleh dinas terkait.',
      is_valid_infrastructure: true,
    };
  }
}

// Create new report (persisted directly to Firestore & synced)
export async function createReport(
  payload: Omit<InfrastructureReport, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'statusHistory'>
): Promise<InfrastructureReport> {
  const now = new Date().toISOString();
  const list = getLocalCache();
  const count = list.length + 1;
  const ticketNumber = `INFRA-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
  const newId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const newReport: InfrastructureReport = {
    ...payload,
    id: newId,
    ticketNumber,
    status: 'Baru',
    statusHistory: [
      {
        status: 'Baru',
        timestamp: now,
        notes: 'Laporan warga berhasil dicatat di sistem database terpadu.',
        updatedBy: 'Sistem LaporInfra'
      }
    ],
    upvotes: 1,
    createdAt: now,
    updatedAt: now
  };

  // 1. Update local cache immediately so it's instantly available in the UI
  list.unshift(newReport);
  saveLocalCache(list);

  // 2. Always persist to Express backend in-memory database
  try {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport),
    });
  } catch (e) {
    console.warn('Express API write failed:', e);
  }

  // 3. Try to sync to Firestore in background
  try {
    const docRef = doc(db, REPORTS_COLLECTION, newId);
    await setDoc(docRef, newReport);
    console.log('Report synced directly to Firestore:', newId);
  } catch (err) {
    console.warn('Firestore write skipped (persisted in local cache & Express API):', err);
  }

  return newReport;
}

// Update report status (Admin Dinas)
export async function updateReportStatus(
  id: string,
  status: 'Baru' | 'Diproses' | 'Selesai',
  notes?: string,
  updatedBy = 'Petugas Dinas PU'
): Promise<InfrastructureReport | null> {
  const now = new Date().toISOString();
  const list = getLocalCache();
  const reportIndex = list.findIndex((r) => r.id === id || r.ticketNumber === id);
  let updatedReport: InfrastructureReport | null = null;

  if (reportIndex !== -1) {
    const rep = { ...list[reportIndex] };
    rep.status = status;
    if (notes) rep.dinasNotes = notes;
    rep.statusHistory = [
      ...(rep.statusHistory || []),
      {
        status,
        timestamp: now,
        notes: notes || `Status diubah menjadi "${status}"`,
        updatedBy
      }
    ];
    rep.updatedAt = now;
    list[reportIndex] = rep;
    saveLocalCache(list);
    updatedReport = rep;
  }

  // Update in Firestore
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    if (updatedReport) {
      await setDoc(docRef, updatedReport, { merge: true });
    } else {
      await updateDoc(docRef, {
        status,
        ...(notes ? { dinasNotes: notes } : {}),
        updatedAt: now
      });
    }
  } catch (err) {
    console.warn('Firestore update failed, fallback to Express API:', err);
    try {
      await fetch(`/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, updatedBy }),
      });
    } catch (e) {
      console.warn(e);
    }
  }

  return updatedReport;
}

// Upvote report
export async function upvoteReport(id: string): Promise<number> {
  const list = getLocalCache();
  const report = list.find((r) => r.id === id);
  const newVoteCount = (report?.upvotes || 1) + 1;

  if (report) {
    report.upvotes = newVoteCount;
    saveLocalCache(list);
  }

  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    await updateDoc(docRef, {
      upvotes: increment(1)
    });
  } catch (e) {
    console.warn('Firestore upvote increment failed, calling API fallback:', e);
    try {
      await fetch(`/api/reports/${id}/upvote`, { method: 'POST' });
    } catch (err) {
      console.warn(err);
    }
  }

  return newVoteCount;
}

// Fetch Admin Stats
export async function fetchAdminStats() {
  let list = getLocalCache();
  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      list = snap.docs.map((d) => d.data() as InfrastructureReport);
    }
  } catch (e) {
    console.warn('Firestore stats fetch error:', e);
  }

  const total = list.length;
  const countBaru = list.filter((r) => r.status === 'Baru').length;
  const countDiproses = list.filter((r) => r.status === 'Diproses').length;
  const countSelesai = list.filter((r) => r.status === 'Selesai').length;

  const countBerat = list.filter((r) => r.tingkat_keparahan === 'Berat').length;
  const countSedang = list.filter((r) => r.tingkat_keparahan === 'Sedang').length;
  const countRingan = list.filter((r) => r.tingkat_keparahan === 'Ringan').length;

  const categoryCounts: Record<string, number> = {};
  list.forEach((r) => {
    categoryCounts[r.kategori] = (categoryCounts[r.kategori] || 0) + 1;
  });

  return {
    total,
    statusCounts: { baru: countBaru, diproses: countDiproses, selesai: countSelesai },
    severityCounts: { berat: countBerat, sedang: countSedang, ringan: countRingan },
    categoryCounts,
    resolutionRate: total > 0 ? Math.round((countSelesai / total) * 100) : 0,
    urgentPending: list.filter((r) => r.tingkat_keparahan === 'Berat' && r.status !== 'Selesai').length
  };
}

// Reset reports to seed
export async function resetReportsToSeed(): Promise<boolean> {
  try {
    for (const report of SEED_REPORTS) {
      await setDoc(doc(db, REPORTS_COLLECTION, report.id), report);
    }
  } catch (e) {
    console.warn('Firestore reset failed:', e);
  }
  saveLocalCache(SEED_REPORTS);
  return true;
}

// Multi-turn Gemini Chat with Role Switching & Maps Grounding
export async function sendGeminiChatMessage(params: {
  messages: Array<{ role: 'user' | 'model'; text: string }>;
  roleMode: 'general' | 'complex' | 'fast' | 'maps';
  location?: { lat: number; lng: number } | null;
  enableMapsGrounding?: boolean;
}): Promise<{
  text: string;
  groundingChunks?: any[];
  groundingMetadata?: any;
  modelUsed?: string;
}> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server error ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn('Gemini chat request error:', error);
    return {
      text: `Maaf, saat ini terjadi kendala koneksi ke server AI (${error.message || 'Error'}). Silakan coba sesaat lagi atau gunakan panduan pelaporan manual.`,
      groundingChunks: [],
      modelUsed: 'client-fallback',
    };
  }
}
