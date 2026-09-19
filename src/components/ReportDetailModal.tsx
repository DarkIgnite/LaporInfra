import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Share2,
  ThumbsUp,
  ShieldCheck,
  User,
  FileText,
  Building2,
  Wrench,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Check,
  Copy,
  MessageCircle,
  Send
} from 'lucide-react';
import { InfrastructureReport } from '../types';
import {
  getSeverityStyle,
  getStatusStyle,
  formatIndonesianDate,
  shareReport,
  getWhatsAppShareUrl,
  getTwitterShareUrl,
  getTelegramShareUrl,
  getFacebookShareUrl,
  getReportShareUrl
} from '../utils/helpers';
import { upvoteReport } from '../services/api';
import { ReportStatusTracker } from './ReportStatusTracker';
import { SuperAdminEditModal } from './SuperAdminEditModal';
import { useAuth } from '../context/AuthContext';
import { Crown, Edit3 } from 'lucide-react';

interface ReportDetailModalProps {
  report: InfrastructureReport | null;
  isOpen: boolean;
  onClose: () => void;
  onReportsUpdated?: () => void;
  onOpenAdminUpdate?: (report: InfrastructureReport) => void;
  isAdmin?: boolean;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onReportsUpdated,
  onOpenAdminUpdate,
  isAdmin,
}) => {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const miniMapRef = useRef<HTMLDivElement | null>(null);
  const miniMapInstance = useRef<L.Map | null>(null);

  const [localReport, setLocalReport] = useState<InfrastructureReport | null>(report);
  const [isSuperAdminEditOpen, setIsSuperAdminEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(report?.upvotes || 1);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    setLocalReport(report);
    if (report) {
      setCurrentUpvotes(report.upvotes || 1);
      setUpvoted(false);
      setShowShareMenu(false);
    }
  }, [report]);

  // Initialize mini map
  useEffect(() => {
    if (!isOpen || !report || !miniMapRef.current) return;

    const { lat, lng } = report.location;
    if (typeof lat !== 'number' || typeof lng !== 'number') return;

    // Small delay to ensure container has rendered dimensions
    const timer = setTimeout(() => {
      if (miniMapInstance.current) {
        miniMapInstance.current.remove();
        miniMapInstance.current = null;
      }

      if (!miniMapRef.current) return;

      const map = L.map(miniMapRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const sev = getSeverityStyle(report.tingkat_keparahan);

      const markerHtml = `
        <div style="transform: translate(-50%, -100%);">
          <div style="background-color: ${sev.colorHex}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <span style="color: white; font-weight: bold; font-size: 10px;">!</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'minimap-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      L.marker([lat, lng], { icon: customIcon }).addTo(map);
      miniMapInstance.current = map;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (miniMapInstance.current) {
        miniMapInstance.current.remove();
        miniMapInstance.current = null;
      }
    };
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const activeReport = localReport || report;
  const sevStyle = getSeverityStyle(activeReport.tingkat_keparahan);
  const stStyle = getStatusStyle(activeReport.status);
  const shareUrl = getReportShareUrl(activeReport.id);

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleNativeShare = async () => {
    const success = await shareReport(
      `LaporInfra: ${activeReport.kategori} - ${activeReport.ticketNumber}`,
      `Laporan kerusakan infrastruktur ${activeReport.kategori} di ${activeReport.location.address}`,
      shareUrl
    );
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleUpvoteClick = async () => {
    if (upvoted) return;
    try {
      const newCount = await upvoteReport(activeReport.id);
      setCurrentUpvotes(newCount);
      setUpvoted(true);
      if (onReportsUpdated) onReportsUpdated();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200 my-auto animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/90">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs sm:text-sm font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {activeReport.ticketNumber}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${stStyle.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${stStyle.dot}`}></span>
              <span>{activeReport.status}</span>
            </span>
            {isSuperAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black text-amber-800">
                <Crown className="h-3 w-3 text-amber-600" />
                Super Admin Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Super Admin Edit Action */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsSuperAdminEditOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-all"
                title="Super Admin: Edit judul, foto, deskripsi, keparahan, status, lokasi"
              >
                <Crown className="h-3.5 w-3.5 text-amber-100" />
                <span>Edit Laporan</span>
              </button>
            )}

            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
              title="Bagikan Tautan Laporan"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-600" />
              <span>{copied ? 'Tautan Disalin! ✓' : 'Bagikan'}</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Main Grid: Left Photo & Map | Right AI Insights & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Photo, Mini Map, Dukungan & Bagikan (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Photo Display */}
              <div className="relative rounded-3xl overflow-hidden bg-stone-950 shadow-md border border-stone-200 group">
                <img
                  src={activeReport.imageUrl}
                  alt={activeReport.kategori}
                  className="w-full h-64 object-cover group-hover:scale-102 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />

                {/* Floating Severity Tag */}
                <div className="absolute top-3 left-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-xs"
                    style={{ backgroundColor: sevStyle.colorHex }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{activeReport.tingkat_keparahan}</span>
                  </span>
                </div>

                {/* Lightbox / Zoom Prompt */}
                <button
                  type="button"
                  onClick={() => setIsPhotoZoomed(true)}
                  className="absolute bottom-3 right-3 rounded-full bg-black/70 backdrop-blur-xs p-2 text-white hover:bg-black transition-colors"
                  title="Perbesar Foto"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>

              {/* Interactive Mini Map */}
              <div className="rounded-3xl border border-stone-200 bg-white p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span>Titik Lokasi Kejadian</span>
                  </span>
                  <span className="text-[11px] font-mono text-stone-500 font-normal">
                    {activeReport.location.lat.toFixed(4)}, {activeReport.location.lng.toFixed(4)}
                  </span>
                </div>

                <div
                  ref={miniMapRef}
                  className="h-32 w-full rounded-2xl overflow-hidden border border-stone-200 isolate z-0 relative"
                />

                <p className="text-xs text-stone-700 font-medium">
                  {activeReport.location.address}
                </p>
              </div>

              {/* Upvote & Support Action */}
              <div className="rounded-3xl bg-stone-50 border border-stone-200 p-4 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-stone-900">
                    Dukungan Warga
                  </h5>
                  <p className="text-[11px] text-stone-600">
                    {currentUpvotes} warga mendesak perbaikan lokasi ini
                  </p>
                </div>
                <button
                  onClick={handleUpvoteClick}
                  disabled={upvoted}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                    upvoted
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-95'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5 text-amber-400" />
                  <span>{upvoted ? 'Didukung' : 'Dukung'}</span>
                </button>
              </div>

              {/* Social Share & Viral Awareness Box */}
              <div className="rounded-3xl border border-stone-200 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Share2 className="h-4 w-4 text-amber-600" />
                    <span>Bagikan Temuan Ini</span>
                  </h5>
                  <span className="text-[10px] text-stone-500">
                    Bantu percepat respon dinas
                  </span>
                </div>

                {/* Social Share Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {/* WhatsApp */}
                  <a
                    href={getWhatsAppShareUrl(activeReport)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 text-xs font-bold transition-all shadow-xs hover:shadow-md"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={getTelegramShareUrl(activeReport)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white py-2 px-3 text-xs font-bold transition-all shadow-xs hover:shadow-md"
                  >
                    <Send className="h-4 w-4" />
                    <span>Telegram</span>
                  </a>

                  {/* Twitter / X */}
                  <a
                    href={getTwitterShareUrl(activeReport)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-stone-900 hover:bg-black text-white py-2 px-3 text-xs font-bold transition-all shadow-xs hover:shadow-md"
                  >
                    <span className="font-mono font-black text-xs">𝕏</span>
                    <span>Twitter / X</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={getFacebookShareUrl(activeReport)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 text-xs font-bold transition-all shadow-xs hover:shadow-md"
                  >
                    <span className="font-bold text-xs">f</span>
                    <span>Facebook</span>
                  </a>
                </div>

                {/* Copy Link Input Bar */}
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] text-stone-600 font-mono focus:outline-hidden"
                    />
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-xs shrink-0 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    }`}
                    title="Salin Tautan"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: AI Analysis, Notes, & Official Status Timeline (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Category & AI Vision Summary */}
              <div className="rounded-3xl border border-stone-200/80 bg-linear-to-br from-amber-50/40 via-white to-stone-50 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1 text-xs font-bold text-white shadow-xs">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Klasifikasi AI Gemini</span>
                  </span>
                  <span className="text-xs font-bold text-stone-700">
                    Kategori: {activeReport.kategori}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-stone-900">
                    Ringkasan Kerusakan Otomatis
                  </h4>
                  <p className="text-xs text-stone-700 leading-relaxed bg-white p-3.5 rounded-2xl border border-stone-200/70">
                    {activeReport.deskripsi_otomatis}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Rekomendasi Prioritas &amp; Standar Respon (SLA)</span>
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed bg-white p-3.5 rounded-2xl border border-stone-200/70">
                    {activeReport.rekomendasi_prioritas}
                  </p>
                </div>
              </div>

              {/* Citizen Manual Note (if any) */}
              {activeReport.deskripsi_manual && (
                <div className="rounded-3xl border border-stone-200 bg-white p-4 space-y-1.5 shadow-2xs">
                  <h5 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-stone-500" />
                    <span>Catatan Lapangan dari Pelapor ({activeReport.reporterName || 'Warga'})</span>
                  </h5>
                  <p className="text-xs text-stone-600 italic bg-stone-50 p-3 rounded-2xl">
                    &ldquo;{activeReport.deskripsi_manual}&rdquo;
                  </p>
                </div>
              )}

              {/* Dinas Action Notes (if any) */}
              {activeReport.dinasNotes && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4 space-y-1.5 shadow-2xs">
                  <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-amber-700" />
                    <span>Catatan Penanganan Dinas PU</span>
                  </h5>
                  <p className="text-xs text-amber-900 bg-white/90 p-3 rounded-2xl border border-amber-200/50">
                    {activeReport.dinasNotes}
                  </p>
                </div>
              )}

              {/* Status Progression Tracker */}
              <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Pelacak Status Transparansi</span>
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Alur progres penanganan dari laporan warga hingga selesai perbaikan
                    </p>
                  </div>

                  {isAdmin && onOpenAdminUpdate && (
                    <button
                      onClick={() => onOpenAdminUpdate(activeReport)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-95 transition-all"
                    >
                      <Wrench className="h-3.5 w-3.5 text-amber-400" />
                      <span>Ubah Status</span>
                    </button>
                  )}
                </div>

                {/* Status Progression Visual Stepper */}
                <ReportStatusTracker report={activeReport} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 bg-stone-50 px-6 py-3.5 flex items-center justify-between text-xs text-stone-500">
          <span>Dibuat: {formatIndonesianDate(activeReport.createdAt)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 font-bold text-stone-700 hover:bg-stone-100 transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-stone-500" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-stone-900 px-5 py-2 font-bold text-white hover:bg-stone-800 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoomed Photo Modal */}
      {isPhotoZoomed && (
        <div
          onClick={() => setIsPhotoZoomed(false)}
          className="fixed inset-0 z-[10000] isolate flex items-center justify-center bg-black/90 p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={activeReport.imageUrl}
              alt="Foto Detail Perbesar"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setIsPhotoZoomed(false)}
              className="absolute top-4 right-4 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Super Admin Edit Modal */}
      {isSuperAdmin && (
        <SuperAdminEditModal
          report={activeReport}
          isOpen={isSuperAdminEditOpen}
          onClose={() => setIsSuperAdminEditOpen(false)}
          onSaved={(updated) => {
            setLocalReport(updated);
            if (onReportsUpdated) onReportsUpdated();
          }}
          onDeleted={() => {
            if (onReportsUpdated) onReportsUpdated();
            onClose();
          }}
        />
      )}
    </div>
  );
};
