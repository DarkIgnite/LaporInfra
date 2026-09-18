import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
  Car,
  Milestone,
  Footprints,
  Lightbulb,
  Droplets,
  Building2,
  Crosshair,
  ChevronRight,
  ShieldCheck,
  Navigation,
  Check,
  ChevronDown,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Flame,
  Construction,
  Radio
} from 'lucide-react';
import { InfrastructureReport, SeverityLevel, DamageCategory } from '../types';
import { GoogleInfrastructureMap } from './GoogleInfrastructureMap';
import {
  getSeverityStyle,
  getStatusStyle,
  calculateDistanceKm,
  formatDistance,
  formatTimeAgo
} from '../utils/helpers';
import {
  detectPreciseUserLocation,
  UserLocationData,
  INDONESIA_CITY_PRESETS,
  CityPreset,
  searchAddress,
  getReadableAddress
} from '../utils/locationService';

interface HeroLandingProps {
  reports: InfrastructureReport[];
  onOpenReportModal: () => void;
  onNavigateToMap: () => void;
  onNavigateToList: () => void;
  onSelectReport: (reportId: string) => void;
  onOpenSDGModal: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  reports,
  onOpenReportModal,
  onNavigateToMap,
  onNavigateToList,
  onSelectReport,
  onOpenSDGModal
}) => {
  // Core Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReportOnMap, setSelectedReportOnMap] = useState<InfrastructureReport | null>(null);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'severity' | 'newest'>('distance');

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);

  // Detect location with high precision
  const handleDetectLocation = useCallback(async (isManualTrigger = false) => {
    setIsLocating(true);
    try {
      const loc = await detectPreciseUserLocation();
      setUserLocation(loc);
      if (isManualTrigger) {
        setLocationToast(loc.isGps ? `GPS Terdeteksi: ${loc.city}` : `Pusat Wilayah: ${loc.city}`);
        setTimeout(() => setLocationToast(null), 3000);
      }
    } catch (err) {
      console.warn('Location detection failed:', err);
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    handleDetectLocation(false);
  }, [handleDetectLocation]);

  // Set preset city location
  const handleSelectCityPreset = async (city: CityPreset) => {
    setShowCityPicker(false);
    setIsLocating(true);
    const addr = await getReadableAddress(city.lat, city.lng);
    const loc: UserLocationData = {
      lat: city.lat,
      lng: city.lng,
      address: addr.address,
      city: city.name,
      district: addr.district,
      isGps: false
    };
    setUserLocation(loc);
    setIsLocating(false);
    setLocationToast(`Pusat peta diubah ke: ${city.name}`);
    setTimeout(() => setLocationToast(null), 3000);
  };

  // Compute distances relative to userLocation
  const reportsWithDistance = useMemo(() => {
    return reports.map((r) => {
      let distanceKm: number | null = null;
      if (userLocation && typeof r.location?.lat === 'number' && typeof r.location?.lng === 'number') {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, r.location.lat, r.location.lng);
      }
      return { ...r, distanceKm };
    });
  }, [reports, userLocation]);

  // Filter & Sort reports
  const filteredReports = useMemo(() => {
    let result = reportsWithDistance.filter((r) => {
      const matchCat = selectedCategory === 'Semua' || r.kategori === selectedCategory;
      const matchSev =
        selectedSeverity === 'Semua' ||
        (selectedSeverity === 'Kritis' && r.tingkat_keparahan === 'Berat') ||
        r.tingkat_keparahan === selectedSeverity;
      const matchStatus = selectedStatus === 'Semua' || r.status === selectedStatus;
      const matchRadius =
        selectedRadiusKm === 'all' ||
        (r.distanceKm !== null && r.distanceKm <= selectedRadiusKm);
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        r.kategori.toLowerCase().includes(q) ||
        (r.location.address && r.location.address.toLowerCase().includes(q)) ||
        (r.location.city && r.location.city.toLowerCase().includes(q)) ||
        (r.location.province && r.location.province.toLowerCase().includes(q)) ||
        (r.deskripsi_otomatis && r.deskripsi_otomatis.toLowerCase().includes(q)) ||
        (r.deskripsi_manual && r.deskripsi_manual.toLowerCase().includes(q)) ||
        (r.ticketNumber && r.ticketNumber.toLowerCase().includes(q));
      return matchCat && matchSev && matchStatus && matchRadius && matchSearch;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === 'severity') {
        const score = (s: SeverityLevel) => (s === 'Berat' ? 3 : s === 'Sedang' ? 2 : 1);
        return score(b.tingkat_keparahan) - score(a.tingkat_keparahan);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reportsWithDistance, selectedCategory, selectedSeverity, selectedStatus, selectedRadiusKm, searchQuery, sortBy]);

  // High-level KPI Counters
  const totalCount = reports.length;
  const criticalCount = reports.filter((r) => r.tingkat_keparahan === 'Berat').length;
  const resolvedCount = reports.filter((r) => r.status === 'Selesai').length;
  const inProgressCount = reports.filter((r) => r.status === 'Diproses').length;

  const categories = [
    'Semua',
    'Jalan Berlubang',
    'Jembatan Retak',
    'Trotoar Rusak',
    'Lampu Jalan Mati',
    'Saluran Air Tersumbat'
  ];

  const hasActiveFilter =
    selectedCategory !== 'Semua' ||
    selectedSeverity !== 'Semua' ||
    selectedStatus !== 'Semua' ||
    selectedRadiusKm !== 'all' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setSelectedSeverity('Semua');
    setSelectedStatus('Semua');
    setSelectedRadiusKm('all');
    setSearchQuery('');
  };

  const radiusMeters = selectedRadiusKm === 'all' ? 1500 : selectedRadiusKm * 1000;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafaf9] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="mx-auto max-w-[1360px] space-y-6">
        {/* TOAST ALERT NOTIFICATION */}
        {locationToast && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-stone-700 animate-in fade-in slide-in-from-top-3 duration-200">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>{locationToast}</span>
          </div>
        )}

        {/* 1. TOP HEADER & KEY STATS SUMMARY */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                Pusat Pantauan Wilayah Terpadu
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              Radar Kerusakan Fasilitas Publik
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-xl leading-relaxed">
              Pantau laporan warga secara real-time dengan verifikasi visual AI Gemini untuk akselerasi respon Dinas Bina Marga &amp; Tata Ruang.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3.5 text-center min-w-[110px]">
              <span className="text-[11px] font-semibold text-stone-500">Total Masuk</span>
              <div className="text-2xl font-black text-stone-900 mt-0.5">{totalCount}</div>
            </div>

            <div className="rounded-2xl bg-rose-50/80 border border-rose-200/80 p-3.5 text-center min-w-[110px]">
              <span className="text-[11px] font-bold text-rose-700">Kritis / Bahaya</span>
              <div className="text-2xl font-black text-rose-700 mt-0.5">{criticalCount}</div>
            </div>

            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 text-center min-w-[110px]">
              <span className="text-[11px] font-bold text-amber-800">Dikerjakan</span>
              <div className="text-2xl font-black text-amber-700 mt-0.5">{inProgressCount}</div>
            </div>

            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-3.5 text-center min-w-[110px]">
              <span className="text-[11px] font-bold text-emerald-800">Selesai</span>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">{resolvedCount}</div>
            </div>
          </div>
        </div>

        {/* 2. UNIFIED CONTROL BAR (Pomaii Capsule & Warm Palette Style) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                id="search-report-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi jalan, kota, deskripsi kerusakan, atau tiket..."
                className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Quick Filters in One Neat Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Dropdown */}
              <div className="relative">
                <select
                  id="category-filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl px-3 py-2.5 pr-8 text-xs font-bold text-stone-700 focus:outline-hidden cursor-pointer transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Semua' ? 'Semua Kategori' : c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>

              {/* Severity Filter Dropdown */}
              <div className="relative">
                <select
                  id="severity-filter-select"
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="appearance-none bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl px-3 py-2.5 pr-8 text-xs font-bold text-stone-700 focus:outline-hidden cursor-pointer transition-colors"
                >
                  <option value="Semua">Semua Urgensi</option>
                  <option value="Kritis">Kritis / Berat</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Ringan">Ringan</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>

              {/* City / Location Center Selector */}
              <div className="relative">
                <button
                  id="city-picker-toggle-btn"
                  type="button"
                  onClick={() => setShowCityPicker(!showCityPicker)}
                  className="flex items-center gap-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-700 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-[160px]">
                    {userLocation?.city || 'Pilih Kota'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                </button>

                {showCityPicker && (
                  <div className="absolute top-full right-0 lg:left-0 mt-2 z-50 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-stone-100 mb-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Pilih Wilayah Pantau
                      </span>
                      <button
                        onClick={() => setShowCityPicker(false)}
                        className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                      >
                        &times;
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                      {INDONESIA_CITY_PRESETS.map((city) => (
                        <button
                          key={city.name}
                          onClick={() => handleSelectCityPreset(city)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors ${
                            userLocation?.city === city.name
                              ? 'bg-amber-50 text-amber-900 font-bold'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{city.name}</div>
                            <div className="text-[10px] text-stone-400">{city.province}</div>
                          </div>
                          {userLocation?.city === city.name && <Check className="h-3.5 w-3.5 text-amber-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* GPS Me Trigger Button */}
              <button
                id="gps-locate-btn"
                type="button"
                onClick={() => handleDetectLocation(true)}
                disabled={isLocating}
                title="Gunakan GPS Perangkat"
                className={`p-2.5 rounded-xl border transition-all ${
                  userLocation?.isGps
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
              </button>

              {/* Reset Filter Button if active */}
              {hasActiveFilter && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              id="hero-create-report-btn"
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center justify-center gap-2 rounded-full bg-stone-900 hover:bg-stone-800 px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-98 transition-all shrink-0"
            >
              <Camera className="h-4 w-4 text-amber-400" />
              <span>+ Lapor Cepat</span>
            </button>
          </div>
        </div>

        {/* 3. BALANCED 2-PANE WORKSTATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* PANE 1: INTERACTIVE GOOGLE MAP */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="relative w-full h-[480px] lg:h-[640px] rounded-3xl bg-white border border-stone-200/80 shadow-xs overflow-hidden">
              {/* Radar Radius Switcher overlay on top-left of map */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-xs border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 px-1">Radius:</span>
                {[
                  { label: 'Semua', val: 'all' },
                  { label: '3 km', val: 3 },
                  { label: '5 km', val: 5 },
                  { label: '10 km', val: 10 }
                ].map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setSelectedRadiusKm(r.val as any)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedRadiusKm === r.val
                        ? 'bg-amber-500 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Google Map Canvas */}
              <GoogleInfrastructureMap
                reports={filteredReports}
                selectedReport={selectedReportOnMap}
                onSelectReport={(r) => setSelectedReportOnMap(r)}
                userLocation={userLocation}
                isLocating={isLocating}
                onLocateMe={() => handleDetectLocation(true)}
                heightClass="h-full"
                radarRadiusMeters={radiusMeters}
              />

              {/* Floating Bottom Card for Selected Marker */}
              {selectedReportOnMap && (
                <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={selectedReportOnMap.imageUrl}
                      alt={selectedReportOnMap.kategori}
                      className="h-12 w-12 rounded-xl object-cover shrink-0 border border-stone-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                          {selectedReportOnMap.kategori}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            selectedReportOnMap.tingkat_keparahan === 'Berat'
                              ? 'bg-rose-100 text-rose-700'
                              : selectedReportOnMap.tingkat_keparahan === 'Sedang'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {selectedReportOnMap.tingkat_keparahan}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {selectedReportOnMap.location.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectReport(selectedReportOnMap.id)}
                      className="rounded-full bg-stone-900 hover:bg-stone-800 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
                    >
                      Buka Rincian
                    </button>
                    <button
                      onClick={() => setSelectedReportOnMap(null)}
                      className="text-stone-400 hover:text-stone-600 p-1.5 text-sm font-bold rounded-lg hover:bg-stone-100"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PANE 2: INCIDENT REPORT FEED */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Feed Header */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-extrabold text-stone-800 tracking-tight">
                  Daftar Titik Kerusakan ({filteredReports.length})
                </h3>
                <p className="text-[11px] text-stone-500">
                  Klik kartu untuk menyorot koordinat di peta atau melihat detail
                </p>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-0.5 text-[11px] font-bold">
                <button
                  onClick={() => setSortBy('distance')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    sortBy === 'distance' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Terdekat
                </button>
                <button
                  onClick={() => setSortBy('severity')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    sortBy === 'severity' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Kritis
                </button>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    sortBy === 'newest' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Terbaru
                </button>
              </div>
            </div>

            {/* Scrollable Card List */}
            <div className="space-y-3 overflow-y-auto max-h-[580px] lg:max-h-[600px] pr-1.5 scrollbar-thin scrollbar-thumb-stone-200">
              {filteredReports.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-800">Tidak ada laporan yang cocok</h4>
                    <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                      Coba atur ulang kata kunci pencarian atau perluas radius filter.
                    </p>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 hover:bg-stone-200 px-4 py-2 text-xs font-bold text-stone-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Hapus Semua Filter</span>
                  </button>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isSelected = selectedReportOnMap?.id === report.id;
                  const isResolved = report.status === 'Selesai';
                  const isCritical = report.tingkat_keparahan === 'Berat';

                  return (
                    <div
                      key={report.id}
                      onClick={() => {
                        setSelectedReportOnMap(report);
                      }}
                      className={`group cursor-pointer bg-white rounded-2xl border p-3.5 transition-all duration-150 flex gap-3.5 items-start ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20'
                          : 'border-stone-200 hover:border-stone-300 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {/* Left Photo Thumbnail */}
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                        <img
                          src={report.imageUrl}
                          alt={report.kategori}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        {report.distanceKm !== null && (
                          <span className="absolute bottom-1 right-1 rounded-md bg-stone-900/80 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-0.5">
                            <Navigation className="h-2 w-2 text-amber-400" />
                            {formatDistance(report.distanceKm)}
                          </span>
                        )}
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                        <div>
                          {/* Badges line */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-700'
                                  : report.tingkat_keparahan === 'Sedang'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {report.tingkat_keparahan}
                            </span>

                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isResolved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : report.status === 'Diproses'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {report.status}
                            </span>

                            {report.ticketNumber && (
                              <span className="text-[10px] font-bold text-stone-400 ml-auto hidden sm:inline">
                                #{report.ticketNumber}
                              </span>
                            )}
                          </div>

                          {/* Category Title */}
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 mt-1 truncate">
                            {report.kategori}
                          </h4>

                          {/* Location Address */}
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5 truncate">
                            <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                            <span className="truncate">{report.location.address || report.location.city}</span>
                          </div>
                        </div>

                        {/* Bottom Row (Time & Action CTA) */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2">
                          <span className="text-[10px] font-medium text-stone-400">
                            {formatTimeAgo(report.createdAt)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectReport(report.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 group-hover:translate-x-0.5 transition-transform"
                          >
                            <span>Lihat Detail</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
