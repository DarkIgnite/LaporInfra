import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
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
  Image,
  Map as MapIcon,
  ChevronUp,
  Navigation
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

// --- Interactive Location Pin Picker Map ---
interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  onClose: () => void;
  isLocating?: boolean;
  onLocateMe?: () => void;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  lat,
  lng,
  onLocationChange,
  onClose,
  isLocating,
  onLocateMe
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const createDamagePinIcon = () => {
    return L.divIcon({
      className: 'damage-pin-picker-marker',
      html: `
        <div style="width: 38px; height: 52px; position: relative; cursor: grab; user-select: none;">
          <svg width="38" height="52" viewBox="0 0 38 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
            <path d="M19 0C8.50659 0 0 8.50659 0 19C0 32 19 52 19 52C19 52 38 32 38 19C38 8.50659 29.4934 0 19 0Z" fill="#ef4444"/>
            <path d="M19 1.5C9.33502 1.5 1.5 9.33502 1.5 19C1.5 30.5 19 49.5 19 49.5C19 49.5 36.5 30.5 36.5 19C36.5 9.33502 28.665 1.5 19 1.5Z" stroke="white" stroke-width="1.5"/>
            <circle cx="19" cy="19" r="8.5" fill="white"/>
            <path d="M19 14V20M19 23.5H19.01" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      `,
      iconSize: [38, 52],
      iconAnchor: [19, 52]
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let resizeObserver: ResizeObserver | null = null;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Create draggable pin marker
      const marker = L.marker([lat, lng], {
        icon: createDamagePinIcon(),
        draggable: true,
        autoPan: true
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onLocationChange(Number(position.lat.toFixed(5)), Number(position.lng.toFixed(5)));
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const clickedLat = Number(e.latlng.lat.toFixed(5));
        const clickedLng = Number(e.latlng.lng.toFixed(5));
        marker.setLatLng([clickedLat, clickedLng]);
        onLocationChange(clickedLat, clickedLng);
      });

      mapRef.current = map;
      markerRef.current = marker;

      // Invalidate size immediately and after modal animation settles
      map.invalidateSize();
      const t1 = setTimeout(() => map.invalidateSize(), 100);
      const t2 = setTimeout(() => map.invalidateSize(), 300);

      if (window.ResizeObserver && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (resizeObserver) resizeObserver.disconnect();
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
        }
      };
    } else {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      mapRef.current.invalidateSize();
    }
  }, []);

  // Update marker position when lat/lng props change from outside
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.panTo([lat, lng]);
      }
    }
  }, [lat, lng]);

  return (
    <div className="rounded-xl border-2 border-blue-500 overflow-hidden bg-white shadow-md space-y-0">
      {/* Map Header Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-100 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-blue-900">
          <MapPin className="h-4 w-4 text-red-500" />
          <span>Klik atau geser pin ke titik kerusakan</span>
        </div>
        <div className="flex items-center gap-2">
          {onLocateMe && (
            <button
              type="button"
              onClick={onLocateMe}
              disabled={isLocating}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 rounded-md px-2 py-0.5 shadow-2xs"
            >
              <Crosshair className={`h-3 w-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>Lokasi Saya</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-gray-500 hover:text-gray-800"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span>Tutup</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative h-56 sm:h-64 w-full">
        <div ref={containerRef} className="h-full w-full [&_.leaflet-grab]:cursor-crosshair [&_.leaflet-container]:cursor-crosshair cursor-crosshair" />
        {/* Floating Instruction Banner */}
        <div className="absolute bottom-2 inset-x-2 z-[500] pointer-events-none flex justify-center">
          <div className="bg-white/95 backdrop-blur-xs border border-gray-200 rounded-lg px-3 py-1 shadow-sm text-[10px] font-medium text-gray-700 text-center">
            💡 <b>Tips:</b> Klik pada peta jalan atau tarik pin merah tepat di posisi lubang/kerusakan
          </div>
        </div>
      </div>
    </div>
  );
};

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: (newReport: InfrastructureReport) => void;
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

  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isInvalidInfraWarning, setIsInvalidInfraWarning] = useState<boolean>(false);

  const [selectedCategory, setSelectedCategory] = useState<DamageCategory>('Jalan Berlubang');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('Sedang');
  const [autoDescription, setAutoDescription] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>('');
  const [priorityRecommendation, setPriorityRecommendation] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');

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
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  const updateLocationCoords = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const addr = await getReadableAddress(lat, lng);
      setLocation((prev) => ({
        ...prev,
        lat,
        lng,
        address: addr.address || `Koordinat ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        city: addr.city || prev.city,
        district: addr.district || prev.district,
        isGps: false,
      }));
    } catch (e) {
      setLocation((prev) => ({
        ...prev,
        lat,
        lng,
        address: `Koordinat ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        isGps: false,
      }));
    } finally {
      setIsReverseGeocoding(false);
    }
  };

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
      setLocationError('Izin lokasi tidak aktif.');
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
      if (user?.displayName) setReporterName(user.displayName);
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
      if (!result.is_valid_infrastructure) setIsInvalidInfraWarning(true);
      setStep('review');
    } catch (err: any) {
      setAnalysisError('AI belum dapat membaca foto. Pilih kategori secara manual.');
      setSelectedCategory('Jalan Berlubang');
      setSelectedSeverity('Sedang');
      setAutoDescription('Laporan kerusakan fasilitas publik.');
      setPriorityRecommendation('Menunggu pemeriksaan lapangan.');
      setStep('review');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) { alert('Foto kerusakan wajib diambil.'); return; }
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
          address: location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
          city: location.city || 'Indonesia',
          district: location.district
        },
        status: 'Baru',
        reporterName: reporterName || user?.displayName || 'Warga',
        reporterId: user?.uid,
        reporterEmail: user?.email || undefined,
        reporterAvatar: user?.photoURL || undefined,
      });
      setCreatedTicketNumber(report.ticketNumber);
      setStep('success');
      onReportCreated(report);
    } catch (err) {
      alert('Gagal mengirim laporan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-end sm:items-center justify-center sm:p-4 bg-black/50 font-sans">
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Camera className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Buat Laporan</h3>
              {step !== 'initial' && (
                <p className="text-[10px] text-gray-400">
                  {step === 'analyzing' ? 'AI menganalisis...' : step === 'review' ? 'Periksa & kirim' : 'Laporan terkirim'}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">

          {/* STEP 1: INITIAL */}
          {step === 'initial' && (
            <div className="space-y-4">
              {/* Location bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{location.city || 'Mendeteksi lokasi...'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{isReverseGeocoding ? 'Mengambil alamat titik baru...' : location.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className={`text-[11px] font-bold flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                        showMapPicker
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <MapIcon className="h-3.5 w-3.5" />
                      <span>{showMapPicker ? 'Tutup Peta' : 'Pin di Peta'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isLocating}
                      className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 bg-white rounded-lg px-2 py-1 flex items-center gap-1"
                      title="Gunakan GPS lokasi saya"
                    >
                      <Crosshair className={`h-3 w-3 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
                      <span className="hidden sm:inline">GPS</span>
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCityDropdown(!showCityDropdown)}
                        className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 bg-white rounded-lg px-2 py-1"
                      >
                        Kota ▾
                      </button>
                      {showCityDropdown && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-xl border border-gray-200 shadow-xl p-1 max-h-48 overflow-y-auto">
                          {INDONESIA_CITY_PRESETS.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => handleSelectCityPreset(c)}
                              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-blue-50 text-gray-700 rounded-lg"
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interactive Pin Map Picker in Step 1 */}
                {showMapPicker && (
                  <div className="pt-1">
                    <LocationPickerMap
                      lat={location.lat}
                      lng={location.lng}
                      onLocationChange={updateLocationCoords}
                      onClose={() => setShowMapPicker(false)}
                      isLocating={isLocating}
                      onLocateMe={detectLocation}
                    />
                  </div>
                )}
              </div>

              {/* Photo actions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tambahkan Foto Kerusakan</p>
                <button
                  id="open-realtime-camera-btn"
                  type="button"
                  onClick={() => { setCameraModalMode('camera'); setShowCameraModal(true); }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">Buka Kamera</p>
                    <p className="text-xs text-blue-700">Foto langsung, AI analisis otomatis</p>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="open-upload-modal-btn"
                    type="button"
                    onClick={() => { setCameraModalMode('upload'); setShowCameraModal(true); }}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
                  >
                    <Upload className="h-4 w-4 text-gray-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Unggah Foto</p>
                      <p className="text-[10px] text-gray-500">dari Galeri</p>
                    </div>
                  </button>
                  <button
                    id="open-preset-modal-btn"
                    type="button"
                    onClick={() => { setCameraModalMode('preset'); setShowCameraModal(true); }}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left"
                  >
                    <Image className="h-4 w-4 text-gray-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Foto Contoh</p>
                      <p className="text-[10px] text-gray-500">Demo / Pengujian</p>
                    </div>
                  </button>
                </div>
              </div>

              {!user && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-600">Masuk untuk lacak laporan kamu</p>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Masuk Google
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ANALYZING */}
          {step === 'analyzing' && (
            <div className="py-16 text-center space-y-4">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">AI menganalisis foto...</p>
                <p className="text-xs text-gray-500 mt-1">Mengklasifikasi jenis & tingkat bahaya</p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 'review' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isInvalidInfraWarning && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>Infrastruktur tidak terdeteksi jelas. Pilih kategori manual di bawah.</p>
                </div>
              )}

              {/* Photo + AI summary */}
              <div className="flex gap-3">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {photoBase64 && <img src={photoBase64} alt="Foto" className="h-full w-full object-cover" />}
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold"
                  >
                    Ganti
                  </button>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[11px] font-bold text-blue-700">Analisis AI</span>
                    {aiResult?.skor_keparahan && (
                      <span className="text-[10px] text-gray-500">Skor: {aiResult.skor_keparahan}/10</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 leading-snug line-clamp-3">{autoDescription || 'Kerusakan terdeteksi'}</p>
                </div>
              </div>

              {/* Category & Severity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategori</label>
                  <select
                    id="select-report-category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as DamageCategory)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Keparahan</label>
                  <div className="grid grid-cols-3 gap-1">
                    {SEVERITY_OPTIONS.map((sev) => {
                      const isSelected = selectedSeverity === sev;
                      const colors = { Ringan: 'border-green-500 bg-green-50 text-green-700', Sedang: 'border-amber-500 bg-amber-50 text-amber-700', Berat: 'border-red-500 bg-red-50 text-red-700' };
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSelectedSeverity(sev)}
                          className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${
                            isSelected ? colors[sev] + ' border-2' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Location with Interactive Pin Trigger */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                    <span>Titik Lokasi &amp; Alamat</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    <span>{showMapPicker ? 'Tutup Peta' : '📍 Pasang Pin di Peta'}</span>
                  </button>
                </div>

                {/* Map Picker in Step 3 */}
                {showMapPicker && (
                  <LocationPickerMap
                    lat={location.lat}
                    lng={location.lng}
                    onLocationChange={updateLocationCoords}
                    onClose={() => setShowMapPicker(false)}
                    isLocating={isLocating}
                    onLocateMe={detectLocation}
                  />
                )}

                <input
                  type="text"
                  required
                  value={location.address || ''}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  placeholder="Alamat lokasi kerusakan"
                />
                <div className="flex items-center justify-between text-[10px] text-gray-400 px-0.5">
                  <span>Koordinat: {location.lat.toFixed(5)}, {location.lng.toFixed(5)} ({location.city})</span>
                  {isReverseGeocoding && <span className="text-blue-500 font-semibold animate-pulse">Menyelaraskan alamat titik baru...</span>}
                </div>
              </div>

              {/* Notes & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catatan (opsional)</label>
                  <textarea
                    rows={2}
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Info tambahan..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Pelapor</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder={user?.displayName || 'Nama kamu'}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('initial')}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ← Kembali
                </button>
                <button
                  id="submit-final-report-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /><span>Mengirim...</span></>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /><span>Kirim Laporan</span></>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Laporan Terkirim!</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Laporan kamu sudah masuk dan diteruskan ke dinas terkait.</p>
                <div className="mt-3">
                  <span className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-mono font-bold text-green-400">
                    {createdTicketNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>

      <CameraCaptureModal
        isOpen={showCameraModal}
        initialMode={cameraModalMode}
        onClose={() => setShowCameraModal(false)}
        onImageSelected={handleImageSelected}
      />
    </div>
  );
};
