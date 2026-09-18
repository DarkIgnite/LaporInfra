import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  Award,
  Navigation,
  Milestone,
  Lightbulb,
  Droplets,
  BrainCircuit,
  Cpu,
  ChevronRight,
  ChevronLeft,
  Check,
  Car,
  Footprints,
  Clock,
  Search,
  Building2,
  Sliders,
  Calendar,
  Layers,
  Filter,
  Eye
} from 'lucide-react';
import { InfrastructureReport } from '../types';
import { DEMO_PRESET_IMAGES } from '../data/seedReports';
import { formatTimeAgo } from '../utils/helpers';
import { InteractiveLandingMap } from './InteractiveLandingMap';

interface LandingPageProps {
  reports: InfrastructureReport[];
  onOpenReportModal: () => void;
  onNavigateToRadar: () => void;
  onNavigateToList: () => void;
  onNavigateToMap: () => void;
  onSelectReport: (reportId: string) => void;
  onOpenSDGModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  reports,
  onOpenReportModal,
  onNavigateToRadar,
  onNavigateToList,
  onNavigateToMap,
  onSelectReport,
  onOpenSDGModal,
}) => {
  // Floating Search Capsule States
  const [selectedCity, setSelectedCity] = useState<string>('Semua Kota');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Fasilitas');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('Semua Tingkat');

  // AI Interactive Showcase Demo
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const aiDemoSamples = [
    {
      id: 'demo-1',
      title: 'Jalan Berlubang Parah',
      location: 'Jl. Pemuda No. 84, Semarang',
      category: 'Jalan Berlubang',
      severity: 'Berat' as const,
      score: 8.8,
      image: DEMO_PRESET_IMAGES[0].url,
      detection: {
        damageType: 'Alligator Cracking & Deep Pothole',
        dimensions: 'Perkiraan diameter ±85 cm, kedalaman ±12 cm',
        dangerLevel: 'Tinggi — Risiko fatal kendaraan roda dua & patah as roda',
        assignment: 'Dinas Bina Marga — Unit Reaksi Cepat (URC)',
        slaRecommendation: 'Maksimal 24 Jam (Prioritas Utama)',
        summary:
          'Terdeteksi lubang aspal dalam dengan pelepasan agregat kasar di lajur aktif kendaraan bermotor.'
      }
    },
    {
      id: 'demo-2',
      title: 'Retak Fisik Pier Cap Jembatan',
      location: 'Jembatan Ciliwung, Jakarta Selatan',
      category: 'Jembatan Retak',
      severity: 'Berat' as const,
      score: 9.4,
      image: DEMO_PRESET_IMAGES[1].url,
      detection: {
        damageType: 'Structural Shear Cracking Pier Cap',
        dimensions: 'Panjang retakan diagonal ±2.4 meter, celah ±8 mm',
        dangerLevel: 'Kritis — Risiko kegagalan beban jembatan & getaran tonase berat',
        assignment: 'Dinas Bina Marga & Tim Ahli Struktur',
        slaRecommendation: 'Maksimal 12 Jam (Inspeksi Khusus)',
        summary:
          'Retakan geser struktural pada tiang penopang jembatan. Memerlukan audit NDT dan perkuatan segera.'
      }
    },
    {
      id: 'demo-3',
      title: 'Paving Trotoar Amblas & Rusak',
      location: 'Jl. Malioboro, Yogyakarta',
      category: 'Trotoar Rusak',
      severity: 'Sedang' as const,
      score: 5.6,
      image: DEMO_PRESET_IMAGES[2].url,
      detection: {
        damageType: 'Paving Settlement & Broken Tactile Guiding Block',
        dimensions: 'Area amblas ±3.5 m², ubin pemandu difabel terputus',
        dangerLevel: 'Sedang — Bahaya tersandung pejalan kaki & disabilitas',
        assignment: 'Dinas Cipta Karya & Tata Ruang',
        slaRecommendation: 'Maksimal 48 Jam (Penataan Ulang)',
        summary:
          'Kerusakan susunan paving blok dan hilangnya continuity guiding block ramah difabel.'
      }
    },
    {
      id: 'demo-4',
      title: 'Penerangan Jalan (PJU) Mati',
      location: 'Jl. Ir. H. Juanda, Bandung',
      category: 'Lampu Jalan Mati',
      severity: 'Sedang' as const,
      score: 6.8,
      image: DEMO_PRESET_IMAGES[3].url,
      detection: {
        damageType: 'PJU Blackout & Fixture Power Failure',
        dimensions: 'Segmen jalan gelap gulita sepanjang ±300 meter (3 tiang padam)',
        dangerLevel: 'Sedang-Tinggi — Risiko blindspot malam & potensi kerawanan',
        assignment: 'Dinas Perhubungan (PJU)',
        slaRecommendation: 'Maksimal 24 Jam',
        summary:
          'Lampu penerangan jalan utama padam saat malam hari, menurunkan jarak pandang pengemudi.'
      }
    }
  ];

  const currentSample = aiDemoSamples[selectedDemoIndex];

  const handleSelectSample = (index: number) => {
    setIsScanning(true);
    setSelectedDemoIndex(index);
    setTimeout(() => {
      setIsScanning(false);
    }, 300);
  };

  // Filtered count based on quick search
  const totalReportsCount = reports.length;
  const criticalCount = reports.filter((r) => r.tingkat_keparahan === 'Berat').length;
  const resolvedCount = reports.filter((r) => r.status === 'Selesai').length;

  const handleScrollToMap = () => {
    const el = document.getElementById('radar-map-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onNavigateToRadar();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-amber-600 selection:text-white">
      {/* =========================================================
          1. SCENIC HERO SECTION (MATCHING THE UPLOADED REFERENCE DESIGN)
         ========================================================= */}
      <section className="relative overflow-hidden bg-[#fafaf9] pt-2 pb-14 sm:pb-20">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          
          {/* Main Scenic Canvas Box with Organic Curves */}
          <div className="relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden min-h-[580px] sm:min-h-[640px] flex flex-col justify-between p-6 sm:p-12 md:p-16 shadow-2xl border border-stone-200/80 bg-stone-900">
            
            {/* High-res Scenic Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2200&q=85"
                alt="Infrastruktur & Lanskap Alam Indonesia"
                className="h-full w-full object-cover object-center scale-105"
                referrerPolicy="no-referrer"
              />
              {/* Soft organic light vignette */}
              <div className="absolute inset-0 bg-linear-to-r from-stone-950/80 via-stone-950/40 to-transparent" />
            </div>

            {/* Organic Fluid Wave Frame (Left & Bottom curves like the reference) */}
            <div className="absolute -left-12 -top-12 w-96 h-96 bg-white/20 backdrop-blur-3xl rounded-full pointer-events-none -z-0 opacity-40" />
            <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-amber-500/10 backdrop-blur-3xl rounded-full pointer-events-none -z-0" />

            {/* Top Sub-navigation / Brand Capsule inside Hero */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 shadow-xs border border-white/60">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-black tracking-wide text-stone-900 uppercase">
                  LaporInfra &bull; AI Powered City Care
                </span>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={onOpenSDGModal}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white/90 border border-white/20 transition-colors"
                >
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  <span>Dukung SDG 9</span>
                </button>
              </div>
            </div>

            {/* Main Content: Left-Aligned Editorial Headline (Pomaii Reference Style) */}
            <div className="relative z-10 max-w-2xl space-y-6 my-auto pt-8 pb-12">
              <div className="space-y-3">
                <span className="inline-block text-xs font-black tracking-[0.2em] uppercase text-amber-400 drop-shadow-xs">
                  PARTISIPASI PUBLIK &amp; AI MULTIMODAL
                </span>
                
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
                  Lapor Cepat.<br />
                  <span className="relative inline-block text-white">
                    Pulihkan Kota.
                    {/* Organic warm underline like the reference */}
                    <svg
                      className="absolute -bottom-2.5 left-0 w-full h-3.5 text-amber-400/90"
                      viewBox="0 0 250 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 10.5C65 3.5 185 2 247 11"
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>
              </div>

              <p className="text-sm sm:text-base lg:text-lg text-stone-200 font-normal leading-relaxed max-w-xl drop-shadow-xs">
                Deteksi jalan berlubang, retak jembatan, dan penerangan padam seketika dengan <strong>Gemini AI Vision</strong>. Pantau perbaikan dinas secara transparan dalam satu radar kota terpadu.
              </p>

              {/* Warm Amber/Orange Pill Action Button (Apple Tactile Style) */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="hero-explore-now-btn"
                  onClick={onOpenReportModal}
                  className="apple-press inline-flex items-center gap-2 rounded-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-7 py-3.5 text-sm font-bold shadow-lg shadow-amber-600/30 border-t border-white/30 active:scale-95 transition-all"
                >
                  <span>Lapor Sekarang</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </button>

                <button
                  id="hero-open-map-btn"
                  onClick={handleScrollToMap}
                  className="apple-press inline-flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white border border-white/30 px-6 py-3.5 text-sm font-semibold transition-all active:scale-95"
                >
                  <Navigation className="h-4 w-4 text-amber-300" />
                  <span>Buka Radar Peta</span>
                </button>
              </div>
            </div>

            {/* Bottom Floating Search Capsule (Apple Translucent Material) */}
            <div className="relative z-20 -mb-2 sm:-mb-6 pt-4">
              <div className="apple-glass rounded-[2rem] p-3 sm:p-4 shadow-2xl text-stone-900 border border-stone-200/90">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                  
                  {/* Segment 1: Where / Kota */}
                  <div className="lg:col-span-3 px-3 py-1.5 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer border-b sm:border-b-0 sm:border-r border-stone-200/70">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Wilayah / Kota
                        </span>
                        <select
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-stone-800 focus:outline-hidden cursor-pointer"
                        >
                          <option value="Semua Kota">Semua Kota (Indonesia)</option>
                          <option value="Semarang">Semarang</option>
                          <option value="DKI Jakarta">DKI Jakarta</option>
                          <option value="Bandung">Bandung</option>
                          <option value="Yogyakarta">D.I. Yogyakarta</option>
                          <option value="Surabaya">Surabaya</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Segment 2: Facility / Tipe Kerusakan */}
                  <div className="lg:col-span-3 px-3 py-1.5 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer border-b sm:border-b-0 sm:border-r border-stone-200/70">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Jenis Fasilitas
                        </span>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-stone-800 focus:outline-hidden cursor-pointer"
                        >
                          <option value="Semua Fasilitas">Semua Fasilitas</option>
                          <option value="Jalan Berlubang">Jalan Berlubang</option>
                          <option value="Jembatan Retak">Jembatan Retak</option>
                          <option value="Trotoar Rusak">Trotoar Rusak</option>
                          <option value="Lampu Jalan Mati">Lampu Jalan Mati</option>
                          <option value="Saluran Air Tersumbat">Saluran Air</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Segment 3: AI & Urgency */}
                  <div className="lg:col-span-3 px-3 py-1.5 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer border-b sm:border-b-0 sm:border-r border-stone-200/70">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Tingkat Keparahan AI
                        </span>
                        <select
                          value={selectedSeverity}
                          onChange={(e) => setSelectedSeverity(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-stone-800 focus:outline-hidden cursor-pointer"
                        >
                          <option value="Semua Tingkat">Semua Tingkat Urgensi</option>
                          <option value="Berat">Kritis / Berat (Prioritas URC)</option>
                          <option value="Sedang">Sedang (Perhatian)</option>
                          <option value="Ringan">Ringan (Monitoring)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Segment 4: Search Button */}
                  <div className="lg:col-span-3 flex items-center justify-end px-2">
                    <button
                      onClick={handleScrollToMap}
                      className="apple-press w-full inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white px-6 py-3.5 text-xs font-bold shadow-md border-t border-white/20 active:scale-95 transition-all"
                    >
                      <Search className="h-4 w-4 text-amber-400" />
                      <span>Cari di Radar Peta</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================
          INTERACTIVE LIVE RADAR MAP SECTION
         ========================================================= */}
      <section className="py-8 sm:py-12 bg-[#fafaf9]">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/90 px-3.5 py-1 text-xs font-black uppercase text-amber-800 tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>PETA RADAR INTERAKTIF REAL-TIME</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
                Pantau Sebaran Titik Kerusakan Kota
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
                Eksplorasi laporan masyarakat secara spasial. Dilengkapi pergantian gaya peta (radar gelap, satelit, standar), pendeteksi GPS terdekat, dan pratinjau tiket instan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateToMap}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-800 hover:text-amber-600 transition-colors"
              >
                <span>Buka Mode Peta Penuh</span>
                <ChevronRight className="h-4 w-4 text-amber-500" />
              </button>
            </div>
          </div>

          {/* Interactive Map Component with current filter props */}
          <InteractiveLandingMap
            reports={reports}
            onSelectReport={onSelectReport}
            onNavigateToMap={onNavigateToMap}
            onOpenReportModal={onOpenReportModal}
            initialCity={selectedCity}
            initialCategory={selectedCategory}
            initialSeverity={selectedSeverity}
          />
        </div>
      </section>


      {/* =========================================================
          2. THE AI SPOTLIGHT & INSPECTOR PLAYGROUND
         ========================================================= */}
      <section className="py-12 sm:py-16 bg-white border-y border-stone-200/80">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                <BrainCircuit className="h-3.5 w-3.5 text-amber-600" />
                <span>Teknologi Vision &bull; Powered by Gemini AI</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                Inspeksi Kerusakan Cerdas Tanpa Istilah Rumit
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Cukup ambil foto di jalan, model AI mengekstraksi tipe degradasi fisik, menghitung skor bahaya (1–10), dan mengarahkan tiket ke dinas pelaksana dalam hitungan detik.
              </p>
            </div>

            {/* Sample Selector Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
              {aiDemoSamples.map((sample, idx) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(idx)}
                  className={`apple-press px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedDemoIndex === idx
                      ? 'bg-stone-900 text-white shadow-md border-t border-white/25'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <span>{sample.category}</span>
                  {selectedDemoIndex === idx && <Check className="h-3 w-3 text-amber-400 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column AI Vision Inspector Card */}
          <div className="rounded-3xl bg-stone-900 text-white p-5 sm:p-8 border border-stone-800 shadow-xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Image with AI Bounding Box Overlay */}
              <div className="lg:col-span-6">
                <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-inner">
                  <img
                    src={currentSample.image}
                    alt={currentSample.title}
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      isScanning ? 'opacity-40 scale-105' : 'opacity-100 scale-100'
                    }`}
                    referrerPolicy="no-referrer"
                  />

                  {/* AI HUD Scanner Bounding Box */}
                  <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-amber-400/90 rounded-xl pointer-events-none flex flex-col justify-between p-3.5 bg-amber-500/5 backdrop-blur-[1px]">
                    <div className="flex justify-between items-start">
                      <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        AI DETECT: {currentSample.category}
                      </span>
                      <span className="bg-black/75 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-400/30">
                        CONFIDENCE: 98.6%
                      </span>
                    </div>

                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-white/90 font-mono bg-black/70 px-2 py-0.5 rounded">
                        SKOR: {currentSample.score} / 10
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40">
                        {currentSample.severity} Level
                      </span>
                    </div>
                  </div>

                  {/* Location Chip */}
                  <div className="absolute bottom-3 left-3 right-3 bg-stone-950/90 backdrop-blur-md rounded-xl p-2.5 border border-stone-700/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span className="font-semibold text-stone-200 truncate">{currentSample.location}</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 shrink-0">Terverifikasi GPS</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Structured Extraction Data */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-start justify-between border-b border-stone-800 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Hasil Analisis Multimodal AI
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {currentSample.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {currentSample.score}
                      <span className="text-xs text-stone-400 font-normal">/10</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-semibold">Skor Urgensi</span>
                  </div>
                </div>

                {/* AI Summary Quote */}
                <div className="rounded-2xl bg-stone-950/80 p-4 border border-stone-800 text-xs text-stone-300 leading-relaxed italic">
                  "{currentSample.detection.summary}"
                </div>

                {/* Structured Extraction Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-stone-800/60 p-3 border border-stone-700/60">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Klasifikasi Sipil</span>
                    <p className="font-bold text-stone-200 mt-0.5">{currentSample.detection.damageType}</p>
                  </div>

                  <div className="rounded-xl bg-stone-800/60 p-3 border border-stone-700/60">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">Estimasi Dimensi</span>
                    <p className="font-bold text-stone-200 mt-0.5">{currentSample.detection.dimensions}</p>
                  </div>

                  <div className="rounded-xl bg-stone-800/60 p-3 border border-stone-700/60 sm:col-span-2">
                    <span className="text-[10px] text-rose-400 font-bold uppercase">Tingkat Bahaya Lalu Lintas</span>
                    <p className="font-bold text-stone-200 mt-0.5">{currentSample.detection.dangerLevel}</p>
                  </div>

                  <div className="rounded-xl bg-stone-800/60 p-3 border border-stone-700/60">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">Instansi Pelaksana</span>
                    <p className="font-bold text-stone-200 mt-0.5">{currentSample.detection.assignment}</p>
                  </div>

                  <div className="rounded-xl bg-stone-800/60 p-3 border border-stone-700/60">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Target Respons (SLA)</span>
                    <p className="font-bold text-stone-200 mt-0.5">{currentSample.detection.slaRecommendation}</p>
                  </div>
                </div>

                {/* Direct Action */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-stone-400">Siap mencoba kamera AI di lokasi Anda?</span>
                  <button
                    onClick={onOpenReportModal}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md active:scale-95 transition-all"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Lapor dengan Kamera</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================
          3. CATEGORIES SECTION (PORTRAIT CARDS WITH CLEAN PHOTOGRAPHY)
         ========================================================= */}
      <section className="py-14 sm:py-20 bg-[#fafaf9]">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-amber-600">
                CAKUPAN INFRASTRUKTUR
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mt-1">
                Kategori Laporan Utama
              </h2>
            </div>

            <button
              onClick={onNavigateToList}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-900 hover:text-amber-600 transition-colors"
            >
              <span>Lihat Semua Laporan ({reports.length})</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 4 Portrait Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'Jalan Berlubang & Amblas',
                category: 'Jalan Berlubang',
                count: '480+ Laporan',
                image: DEMO_PRESET_IMAGES[0].url,
                sla: 'SLA < 24 Jam',
                color: 'text-blue-500'
              },
              {
                title: 'Retak Fisik Jembatan',
                category: 'Jembatan Retak',
                count: '120+ Laporan',
                image: DEMO_PRESET_IMAGES[1].url,
                sla: 'SLA < 12 Jam (Kritis)',
                color: 'text-rose-500'
              },
              {
                title: 'Trotoar & Fasilitas Difabel',
                category: 'Trotoar Rusak',
                count: '210+ Laporan',
                image: DEMO_PRESET_IMAGES[2].url,
                sla: 'SLA < 48 Jam',
                color: 'text-amber-500'
              },
              {
                title: 'Penerangan Jalan (PJU) Mati',
                category: 'Lampu Jalan Mati',
                count: '340+ Laporan',
                image: DEMO_PRESET_IMAGES[3].url,
                sla: 'SLA < 24 Jam',
                color: 'text-yellow-500'
              }
            ].map((item) => (
              <div
                key={item.title}
                onClick={onOpenReportModal}
                className="group relative aspect-3/4 rounded-3xl overflow-hidden bg-stone-900 text-white cursor-pointer shadow-md hover:shadow-xl transition-all flex flex-col justify-between p-5"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-75"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                {/* Top Badge */}
                <div className="relative z-10">
                  <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-stone-950 shadow-xs">
                    {item.sla}
                  </span>
                </div>

                {/* Bottom Card Meta */}
                <div className="relative z-10 space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-stone-300 pt-1">
                    <span>{item.count}</span>
                    <span className="text-amber-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Lapor <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* =========================================================
          4. 3 SIMPLE STEPS TO REPORT
         ========================================================= */}
      <section className="py-14 sm:py-18 bg-white border-t border-stone-200/80">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black tracking-widest uppercase text-amber-600">
              ALUR TRANSPARAN
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Pelaporan Semudah 1-2-3
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Dari jalan rusak hingga perbaikan selesai tanpa birokrasi manual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl bg-[#fafaf9] p-6 border border-stone-200/90 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-stone-900">Jepret Foto &amp; Lokasi GPS</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Buka kamera aplikasi saat melihat jalan rusak. Koordinat presisi dan nama jalan terkunci secara otomatis.
              </p>
            </div>

            <div className="rounded-3xl bg-[#fafaf9] p-6 border border-stone-200/90 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-stone-900">AI Gemini Menganalisis</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Model AI membaca foto, mengklasifikasi tingkat keparahan, serta menerbitkan nomor tiket publik instan.
              </p>
            </div>

            <div className="rounded-3xl bg-[#fafaf9] p-6 border border-stone-200/90 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-stone-900">Dinas Eksekusi Perbaikan</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Tim Unit Reaksi Cepat dikerahkan ke lokasi dan memutakhirkan status perbaikan secara transparan.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
