/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GeminiChatbot } from './GeminiChatbot';
import {
  Sparkles,
  Bot,
  HardHat,
  Zap,
  MapPin,
  Compass,
  Building2,
  PhoneCall,
  ShieldCheck,
  Award,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { ChatRoleMode } from '../types';

interface AIAssistantViewProps {
  onOpenReportModal: () => void;
  onNavigateToMap: () => void;
  onOpenSDGModal: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  onOpenReportModal,
  onNavigateToMap,
  onOpenSDGModal,
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatRoleMode>('general');

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Turn Gemini Assistant &amp; Maps Grounding</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Konsultasi AI &amp; Radar Fasilitas Infrastruktur
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Dukungan kecerdasan buatan multi-model untuk warga dan dinas PU: mulai dari panduan lapor, kalkulasi teknis Bina Marga (RAB/AHSP), respons darurat kilat, hingga pencarian kantor PU terdekat terverifikasi Google Maps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <span>+ Buat Laporan Kerusakan</span>
            </button>
            <button
              onClick={onOpenSDGModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs active:scale-95 transition-all"
            >
              <Award className="h-4 w-4 text-amber-400" />
              <span>Dukungan SDG 9</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Chatbot on left/center (70%), Info cards on right (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chatbot Interface */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden min-h-[660px] h-[720px] flex flex-col">
          <GeminiChatbot
            floating={false}
            initialRole={selectedRole}
            isOpen={true}
          />
        </div>

        {/* Sidebar Info & Model Architecture */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Model Selector Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Pilihan Karakter &amp; Model AI</span>
            </h3>

            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-amber-600" />
                    Asisten Warga
                  </span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-800">
                    Gemini 2.5 Flash
                  </span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Panduan lapor, tips keselamatan jalan, dan transparansi status perbaikan.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-indigo-200/80 bg-indigo-50/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <HardHat className="h-3.5 w-3.5 text-indigo-600" />
                    Insinyur Sipil PU
                  </span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-800">
                    Gemini 3.1 Pro
                  </span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Standar tebal aspal hotmix, RAB/AHSP, hidrologi drainase, dan defleksi jembatan.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-sky-200/80 bg-sky-50/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sky-900 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-sky-600" />
                    Radar Google Maps
                  </span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 text-sky-800">
                    Maps Grounding
                  </span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Data real-time kantor Dinas PU, posko URC, depo material, dan rumah sakit terdekat.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-emerald-600" />
                    Respon Kilat
                  </span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800">
                    Gemini 3.1 Flash Lite
                  </span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Triage cepat, nomor darurat jalan raya, dan FAQ ringkas.
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Hotline Card */}
          <div className="bg-stone-900 text-white rounded-2xl p-4 border border-stone-800 shadow-xs">
            <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Kontak Darurat Kerusakan Jalan</span>
            </h4>
            <div className="space-y-1.5 text-xs text-stone-300">
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span>Call Center Darurat PU:</span>
                <span className="font-bold text-white">112 / 158</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span>Posko Siaga URC Bina Marga:</span>
                <span className="font-bold text-amber-300">021-3844-000</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Polantas Gangguan Jalan:</span>
                <span className="font-bold text-white">110</span>
              </div>
            </div>
          </div>

          {/* Google Maps Integration Notice */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-800">
              <MapPin className="h-4 w-4 text-sky-600" />
              <span>Google Maps Grounding Aktif</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Setiap kali Anda menanyakan lokasi fasilitas dinas, depo aspal, atau rute darurat, model Gemini mengakses basis data Google Maps secara langsung untuk memberikan tautan navigasi dan informasi tempat akurat.
            </p>
            <button
              onClick={onNavigateToMap}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors"
            >
              <Compass className="h-3.5 w-3.5 text-stone-600" />
              <span>Buka Peta Sebaran Laporan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
