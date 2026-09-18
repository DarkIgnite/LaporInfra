import React from 'react';
import { X, Building2, Globe2, Sparkles, CheckCircle2, ShieldCheck, HeartHandshake } from 'lucide-react';

interface SDGInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SDGInfoModal: React.FC<SDGInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4 animate-in fade-in font-sans">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="border-b border-stone-800 bg-stone-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Tujuan Pembangunan Berkelanjutan (SDGs)
              </span>
              <h3 className="text-lg font-black leading-tight text-white">
                SDG 9: Industri, Inovasi, &amp; Infrastruktur
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-stone-700 max-h-[75vh] overflow-y-auto">
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 space-y-2">
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Relevansi LaporInfra Terhadap SDG Target 9.1</span>
            </h4>
            <p className="leading-relaxed text-amber-900">
              <b>Target 9.1:</b> <i>&ldquo;Membangun infrastruktur yang berkualitas, andal, berkelanjutan dan tangguh, termasuk infrastruktur regional dan lintas batas, untuk mendukung pembangunan ekonomi dan kesejahteraan manusia...&rdquo;</i>
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Tiga Pilar Solusi Inovatif LaporInfra:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <h5 className="font-bold text-stone-900">Partisipasi Warga Inklusif</h5>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Memudahkan setiap warga melaporkan kerusakan fasilitas umum hanya dengan 1 foto tanpa birokrasi berbelit.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h5 className="font-bold text-stone-900">Inovasi AI Vision Cerdas</h5>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Mengklasifikasi keparahan jalan &amp; jembatan secara objektif menggunakan AI Gemini untuk estimasi bahaya keselamatan.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h5 className="font-bold text-stone-900">Prioritas Berbasis Data</h5>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Dinas memprioritaskan perbaikan berdasar urgensi keparahan teknis (bukan urutan antrean), memangkas waktu respon perbaikan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 bg-stone-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
