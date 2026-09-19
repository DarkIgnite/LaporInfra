export type DamageCategory =
  | 'Jalan Berlubang'
  | 'Jembatan Retak'
  | 'Trotoar Rusak'
  | 'Lampu Jalan Mati'
  | 'Saluran Air Tersumbat'
  | 'Fasilitas Publik Lainnya';

export type SeverityLevel = 'Ringan' | 'Sedang' | 'Berat';

export type ReportStatus = 'Baru' | 'Diproses' | 'Selesai';

export interface LocationCoords {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  district?: string;
  province?: string;
}

export interface AIAnalysisResult {
  kategori: DamageCategory;
  tingkat_keparahan: SeverityLevel;
  deskripsi_otomatis: string;
  rekomendasi_prioritas: string;
  is_valid_infrastructure: boolean;
  perkiraan_bahaya?: string;
  skor_keparahan?: number; // 1-10 scale
  is_fallback?: boolean;
  fallback_notice?: string;
}

export interface StatusUpdateHistory {
  status: ReportStatus;
  timestamp: string;
  notes?: string;
  updatedBy: string;
}

export interface InfrastructureReport {
  id: string;
  ticketNumber: string;
  imageUrl: string;
  thumbnailUrl?: string;
  location: LocationCoords;
  kategori: DamageCategory;
  tingkat_keparahan: SeverityLevel;
  deskripsi_otomatis: string;
  rekomendasi_prioritas: string;
  deskripsi_manual?: string;
  reporterName?: string;
  reporterId?: string;
  reporterEmail?: string;
  reporterAvatar?: string;
  status: ReportStatus;
  statusHistory: StatusUpdateHistory[];
  dinasNotes?: string;
  upvotes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilterState {
  category: string;
  severity: string;
  status: string;
  searchQuery: string;
  sortBy: 'terbaru' | 'terlama' | 'keparahan_tertinggi' | 'paling_banyak_dukungan';
}

export interface AdminUser {
  id: string;
  name: string;
  username?: string;
  role: 'Petugas Dinas' | 'Super Admin' | 'Verifikator Lapangan';
  email: string;
  department: string;
  avatarUrl?: string;
}

export type UserRole = 'warga' | 'petugas' | 'super_admin';

export interface AuthUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  department?: string;
  subRole?: string;
  createdAt?: string;
}

export type ChatRoleMode = 'general' | 'complex' | 'fast' | 'maps';

export interface GroundingMapsPlace {
  uri?: string;
  title?: string;
  placeAnswerSources?: {
    reviewSnippets?: Array<{
      reviewText?: string;
      authorAttribution?: { displayName?: string };
    }>;
  };
}

export interface GroundingChunk {
  maps?: GroundingMapsPlace;
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  roleMode?: ChatRoleMode;
  modelUsed?: string;
  groundingChunks?: GroundingChunk[];
  isError?: boolean;
}
