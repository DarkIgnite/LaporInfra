import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Crosshair,
  LogIn
} from 'lucide-react';
import {
  DamageCategory,
  SeverityLevel,
  AIAnalysisResult,
  InfrastructureReport
} from '../types';
import { analyzeDamageWithAI, createReport } from '../services/api';
import { CameraCaptureModal } from './CameraCaptureModal';
import { getSeverityStyle } from '../utils/helpers';
import {
  detectPreciseUserLocation,
  INDONESIA_CITY_PRESETS,
  CityPreset,
  getReadableAddress
} from '../utils/locationService';
import { useAuth } from '../context/AuthContext';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: (newReportId: string) => void;
}

const CATEGORY_OPTIONS: DamageCategory[] = [
  'Jalan Berlubang',
  'Jembatan Retak',
  'Trotoar Rusak',
  'Lampu Jalan Mati',
  'Saluran Air Tersumbat',
  'Fasilitas Publik Lainnya',
];

const SEVERITY_OPTIONS: SeverityLevel[] = ['Ringan', 'Sedang', 'Berat'];

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onReportCreated,
}) => {
  const { user, signInWithGoogle } = useAuth();
  const [step, setStep] = useState<'initial' | 'analyzing' | 'review' | 'success'>('initial');
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraModalMode, setCameraModalMode] = useState<'camera' | 'upload' | 'preset'>('camera');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // AI analysis state
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isInvalidInfraWarning, setIsInvalidInfraWarning] = useState<boolean>(false);

  // Form edit states
  const [selectedCategory, setSelectedCategory] = useState<DamageCategory>('Jalan Berlubang');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('Sedang');
  const [autoDescription, setAutoDescription] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>('');
  const [priorityRecommendation, setPriorityRecommendation] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');

  // Location state
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    district?: string;
    isGps?: boolean;
  }>({
    lat: -6.2088,
    lng: 106.8456,
    address: 'Jl. Jenderal Sudirman, Jakarta Pusat',
    city: 'Jakarta Pusat',
    isGps: false
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  // Geolocation detection
  const detectLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const loc = await detectPreciseUserLocation();
      setLocation({
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address,
        city: loc.city,
        district: loc.district,
        isGps: loc.isGps
      });
    } catch (err) {
      console.warn('Geolocation detection failed:', err);
      setLocationError('Izin akses lokasi tidak aktif. Menggunakan titik pusat default.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectCityPreset = async (city: CityPreset) => {
    setShowCityDropdown(false);
    setIsLocating(true);
    const addr = await getReadableAddress(city.lat, city.lng);
    setLocation({
      lat: city.lat,
      lng: city.lng,
      address: addr.address,
      city: city.name,
      district: addr.district,
      isGps: false
    });
    setIsLocating(false);
  };

  useEffect(() => {
    if (isOpen) {
      detectLocation();
      if (user?.displayName) {
        setReporterName(user.displayName);
      }
    } else {
      setTimeout(() => {
        setStep('initial');
        setPhotoBase64(null);
        setAiResult(null);
        setManualDescription('');
        setReporterName('');
        setAnalysisError(null);
        setIsInvalidInfraWarning(false);
        setCreatedTicketNumber(null);
      }, 300);
    }
  }, [isOpen, user]);

  // Handle image selected
  const handleImageSelected = async (
    base64: string,
    presetLocation?: { lat: number; lng: number; address: string }
  ) => {
    setShowCameraModal(false);
    setPhotoBase64(base64);

    if (presetLocation) {
      setLocation({
        lat: presetLocation.lat,
        lng: presetLocation.lng,
        address: presetLocation.address,
        city: presetLocation.address.split(',')[1]?.trim() || 'Indonesia',
        isGps: false
      });
    }

    await runAIAnalysis(base64);
  };

  const runAIAnalysis = async (imgBase64: string) => {
    setStep('analyzing');
    setAnalysisError(null);
    setIsInvalidInfraWarning(false);

    try {
      const result = await analyzeDamageWithAI(imgBase64, 'image/jpeg', manualDescription);
      setAiResult(result);
      setSelectedCategory(result.kategori);
      setSelectedSeverity(result.tingkat_keparahan);
      setAutoDescription(result.deskripsi_otomatis);
      setPriorityRecommendation(result.rekomendasi_prioritas);

      if (!result.is_valid_infrastructure) {
        setIsInvalidInfraWarning(true);
      }

      setStep('review');
    } catch (err: any) {
      console.warn('AI analysis fallback:', err);
      setAnalysisError(
        'AI Vision belum dapat membaca detail foto secara otomatis. Anda tetap dapat melanjutkan dengan memilih kategori secara manual.'
      );
      setSelectedCategory('Jalan Berlubang');
      setSelectedSeverity('Sedang');
      setAutoDescription('Laporan kerusakan fasilitas publik oleh warga.');
      setPriorityRecommendation('Menunggu pemeriksaan lapangan oleh dinas terkait.');
      setStep('review');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      alert('Foto kerusakan wajib diambil sebelum mengirim laporan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await createReport({
        imageUrl: photoBase64,
        kategori: selectedCategory,
        tingkat_keparahan: selectedSeverity,
        deskripsi_otomatis: autoDescription,
        deskripsi_manual: manualDescription,
        rekomendasi_prioritas: priorityRecommendation,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address || `Koordinat ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
          city: location.city || 'Indonesia',
          district: location.district
        },
        status: 'Baru',
        reporterName: reporterName || user?.displayName || 'Warga Masyarakat',
        reporterId: user?.uid,
        reporterEmail: user?.email || undefined,
        reporterAvatar: user?.photoURL || undefined,
      });

      setCreatedTicketNumber(report.ticketNumber);
      setStep('success');
      onReportCreated(report.id);
    } catch (err) {
      console.error('Failed to submit report:', err);
      alert('Gagal mengirimkan laporan. Mohon coba sesaat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs shadow-xs">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900">
                Lapor Kerusakan Infrastruktur
              </h3>
              <p className="text-[11px] text-stone-500">
                Penyimpanan Database Terpadu &amp; Analisis AI Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Google Auth Status Banner */}
          {!user && step === 'initial' && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-xs font-bold text-amber-950">Masuk Akun Google (Opsional)</p>
                  <p className="text-[11px] text-amber-800">Laporan akan tersambung ke profil Anda untuk pantauan status.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="shrink-0 rounded-full bg-stone-900 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                Masuk
              </button>
            </div>
          )}

          {/* STEP 1: INITIAL SELECT / CAPTURE PHOTO */}
          {step === 'initial' && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200/80">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Didukung Gemini Multimodal AI &amp; Cloud Database</span>
                </div>
                <h4 className="text-base font-bold text-stone-900">
                  Mulai dengan Mengambil atau Mengunggah Foto
                </h4>
                <p className="text-xs text-stone-500">
                  Sistem kami akan memindai jenis kerusakan, menghitung tingkat bahaya, dan menyimpan ke database real-time.
                </p>
              </div>

              {/* Action Trigger Cards */}
              <div className="space-y-3">
                {/* Primary Real-time Camera Action */}
                <div
                  id="open-realtime-camera-btn"
                  onClick={() => {
                    setCameraModalMode('camera');
                    setShowCameraModal(true);
                  }}
                  className="group cursor-pointer rounded-2xl border-2 border-stone-900 bg-linear-to-br from-stone-900/5 via-amber-500/5 to-white p-5 text-center transition-all hover:border-amber-600 hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.99]"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-md shadow-stone-900/20 group-hover:scale-110 group-hover:bg-amber-500 transition-all">
                    <Camera className="h-7 w-7 text-amber-400 group-hover:text-white" />
                  </div>
                  <h5 className="mt-3 text-sm sm:text-base font-extrabold text-stone-900">
                    Buka Kamera Langsung (Real-time Video)
                  </h5>
                  <p className="mt-1 text-xs text-stone-600 max-w-md mx-auto">
                    Arahkan kamera ke jalan berlubang, trotoar patah, atau fasilitas rusak. Jepret seketika untuk pemindaian otomatis oleh AI Gemini.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 text-white text-[11px] font-bold shadow-xs">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Jepret &amp; Pindai AI Otomatis</span>
                  </div>
                </div>

                {/* Secondary Actions (Upload & Presets) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="open-upload-modal-btn"
                    type="button"
                    onClick={() => {
                      setCameraModalMode('upload');
                      setShowCameraModal(true);
                    }}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-stone-200 bg-stone-50/80 hover:bg-stone-100 hover:border-stone-300 active:scale-98 transition-all text-left"
                  >
                    <Upload className="h-4 w-4 text-stone-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold text-stone-800">Unggah Foto</span>
                      <span className="block text-[10px] text-stone-500">Dari Galeri HP/Laptop</span>
                    </div>
                  </button>

                  <button
                    id="open-preset-modal-btn"
                    type="button"
                    onClick={() => {
                      setCameraModalMode('preset');
                      setShowCameraModal(true);
                    }}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100/70 hover:border-amber-300 active:scale-98 transition-all text-left"
                  >
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold text-amber-900">Sampel Pengujian</span>
                      <span className="block text-[10px] text-amber-700">Contoh Foto Nyata</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Location Status & Accuracy Preview Box */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-stone-800">
                      Titik Lokasi Pelaporan Anda:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800"
                  >
                    <Crosshair className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Mendeteksi...' : 'Perbarui GPS'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-stone-600 truncate max-w-[340px]">
                    <span className="font-semibold text-stone-900">{location.city}: </span>
                    {location.address || 'Mencari alamat...'}
                  </div>

                  {/* City Selector Button */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCityDropdown(!showCityDropdown)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-100"
                    >
                      Pilih Kota &darr;
                    </button>
                    {showCityDropdown && (
                      <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white rounded-xl border border-stone-200 shadow-xl p-1 max-h-48 overflow-y-auto">
                        {INDONESIA_CITY_PRESETS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => handleSelectCityPreset(c)}
                            className="w-full text-left px-2 py-1 text-xs hover:bg-amber-50 text-stone-700 rounded-lg"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {location.isGps && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Koordinat GPS Aktif ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: AI ANALYZING PROGRESS */}
          {step === 'analyzing' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
                <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-stone-900">
                  Gemini Vision Sedang Menganalisis Foto...
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Mendeteksi klasifikasi kerusakan, estimasi luas jalan berlubang, dan skor urgensi penanganan.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & EDIT AI RESULTS BEFORE SUBMIT */}
          {step === 'review' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Warning if AI detected non-infrastructure photo */}
              {isInvalidInfraWarning && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">
                      Perhatian: Objek Infrastruktur Tidak Terdeteksi Jelas
                    </p>
                    <p className="text-amber-800 mt-0.5">
                      Foto tampak bukan fasilitas umum publik atau kurang fokus. Anda tetap dapat melanjutkan dengan memilih kategori &amp; keparahan secara manual di bawah, atau mengambil foto ulang.
                    </p>
                  </div>
                </div>
              )}

              {/* Photo & AI Classification Summary Card */}
              <div className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 sm:p-4">
                {/* Photo Preview */}
                <div className="relative sm:w-36 h-36 rounded-xl overflow-hidden bg-stone-950 shrink-0 border border-stone-200 shadow-xs">
                  {photoBase64 && (
                    <img
                      src={photoBase64}
                      alt="Foto Kerusakan"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="absolute bottom-1.5 right-1.5 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-xs hover:bg-black"
                  >
                    Ganti Foto
                  </button>
                </div>

                {/* AI Quick Assessment Badges */}
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        <Sparkles className="h-3 w-3 text-amber-600" /> Hasil Analisis Gemini AI
                      </span>
                      {aiResult?.skor_keparahan && (
                        <span className="rounded-md bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                          Skor: {aiResult.skor_keparahan}/10
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 leading-snug">
                      {autoDescription || 'Kerusakan infrastruktur terdeteksi'}
                    </h4>
                  </div>

                  <div className="rounded-xl bg-white p-2.5 border border-stone-200/80 text-[11px] text-stone-600">
                    <span className="font-semibold text-stone-800">Rekomendasi Penanganan: </span>
                    {priorityRecommendation}
                  </div>
                </div>
              </div>

              {/* Form Fields & Overrides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kategori Kerusakan */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Kategori Kerusakan (Bisa Disesuaikan)
                  </label>
                  <select
                    id="select-report-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as DamageCategory)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-800 shadow-xs focus:border-amber-500 focus:outline-hidden"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tingkat Keparahan */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Tingkat Keparahan
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SEVERITY_OPTIONS.map((sev) => {
                      const style = getSeverityStyle(sev);
                      const isSelected = selectedSeverity === sev;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSelectedSeverity(sev)}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? `${style.badge} border-2 ${style.border} shadow-xs`
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${style.dot}`}></span>
                          <span>{sev}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lokasi Alamat */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                    Alamat / Patokan Lokasi
                  </span>
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Segarkan GPS
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={location.address || ''}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-hidden"
                />
                <p className="mt-1 text-[11px] text-stone-400">
                  Koordinat: {location.lat.toFixed(5)}, {location.lng.toFixed(5)} ({location.city})
                </p>
              </div>

              {/* Deskripsi Tambahan & Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Catatan Tambahan Warga
                  </label>
                  <textarea
                    rows={2}
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Informasi tambahan terkait kondisi lapangan..."
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-stone-800 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                    <span>Nama Pelapor</span>
                    {user && (
                      <span className="text-[10px] text-emerald-600 font-bold">Akun Google Aktif</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder={user?.displayName || 'Anonim / Nama Anda'}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-hidden"
                  />
                  <p className="mt-1 text-[10px] text-stone-400">
                    Tersimpan permanen di cloud database LaporInfra.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setStep('initial')}
                  className="rounded-full border border-stone-200 px-5 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Kembali
                </button>
                <button
                  id="submit-final-report-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-stone-800 active:scale-98 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                      <span>Menyimpan ke Cloud Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-amber-400" />
                      <span>Kirim Laporan Resmi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-stone-900">
                  Laporan Berhasil Masuk Database!
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Terima kasih atas partisipasi Anda. Laporan ini telah tersimpan di cloud database Firestore dan diteruskan ke dinas terkait dengan nomor tiket:
                </p>
                <div className="pt-2">
                  <span className="inline-block rounded-full bg-stone-900 px-5 py-2 text-sm font-mono font-bold text-amber-400 shadow-xs">
                    {createdTicketNumber}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-full bg-stone-900 hover:bg-stone-800 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
                >
                  Tutup &amp; Lihat di Peta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CAMERA / UPLOAD CAPTURE MODAL */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        initialMode={cameraModalMode}
        onClose={() => setShowCameraModal(false)}
        onImageSelected={handleImageSelected}
      />
    </div>
  );
};
