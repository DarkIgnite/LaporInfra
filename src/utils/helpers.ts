import { DamageCategory, SeverityLevel, ReportStatus, InfrastructureReport } from '../types';

export function formatIndonesianDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (e) {
    return dateStr;
  }
}

export function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    if (diffDay === 1) return 'Kemarin';
    if (diffDay < 7) return `${diffDay} hari yang lalu`;
    return formatIndonesianDate(dateStr);
  } catch (e) {
    return dateStr;
  }
}

export function getSeverityStyle(severity: SeverityLevel) {
  switch (severity) {
    case 'Berat':
      return {
        badge: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
        dot: 'bg-rose-600',
        colorHex: '#e11d48',
        border: 'border-rose-500',
        accentBg: 'bg-rose-50',
        glow: 'shadow-rose-100',
        label: 'Tingkat Berat',
        sla: 'Respon < 24 Jam'
      };
    case 'Sedang':
      return {
        badge: 'bg-amber-500/10 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
        dot: 'bg-amber-500',
        colorHex: '#d97706',
        border: 'border-amber-500',
        accentBg: 'bg-amber-50',
        glow: 'shadow-amber-100',
        label: 'Tingkat Sedang',
        sla: 'Respon 1-3 Hari'
      };
    case 'Ringan':
    default:
      return {
        badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
        dot: 'bg-emerald-600',
        colorHex: '#059669',
        border: 'border-emerald-500',
        accentBg: 'bg-emerald-50',
        glow: 'shadow-emerald-100',
        label: 'Tingkat Ringan',
        sla: 'Respon 3-7 Hari'
      };
  }
}

export function getStatusStyle(status: ReportStatus) {
  switch (status) {
    case 'Baru':
      return {
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-600',
        iconName: 'AlertCircle',
        label: 'Menunggu Penanganan'
      };
    case 'Diproses':
      return {
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-600',
        iconName: 'Wrench',
        label: 'Sedang Diperbaiki'
      };
    case 'Selesai':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-600',
        iconName: 'CheckCircle2',
        label: 'Selesai Ditangani'
      };
  }
}

export function getCategoryIconName(category: DamageCategory | string): string {
  switch (category) {
    case 'Jalan Berlubang':
      return 'Car';
    case 'Jembatan Retak':
      return 'Milestone';
    case 'Trotoar Rusak':
      return 'Footprints';
    case 'Lampu Jalan Mati':
      return 'Lightbulb';
    case 'Saluran Air Tersumbat':
      return 'Droplets';
    default:
      return 'Construction';
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string; district: string }> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'id,en',
        'User-Agent': 'LaporInfra-App/1.0'
      }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road = addr.road || addr.pedestrian || addr.suburb || 'Jl. Lokasi Kejadian';
      const city = addr.city || addr.town || addr.municipality || addr.county || 'Kota';
      const district = addr.suburb || addr.neighbourhood || addr.village || 'Kecamatan';
      const full = data.display_name?.split(',').slice(0, 3).join(',') || `${road}, ${city}`;
      return { address: full, city, district };
    }
  } catch (e) {
    console.warn('Reverse geocoding error:', e);
  }

  // Fallback estimation
  return {
    address: `Koordinat ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    city: 'Indonesia',
    district: 'Area Pelaporan'
  };
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '-';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function getReportShareUrl(reportId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/#laporan-${reportId}`;
  }
  return `https://laporinfra.id/#laporan-${reportId}`;
}

export function getReportShareText(report: InfrastructureReport): string {
  const address = report.location.address || 'Lokasi Kejadian';
  const desc = report.deskripsi_otomatis || report.deskripsi_manual || 'Laporan kerusakan infrastruktur publik';
  return `🚨 *LaporInfra: Kerusakan ${report.kategori}*\n` +
    `📍 *Lokasi:* ${address}\n` +
    `⚠️ *Tingkat:* ${report.tingkat_keparahan} | 🏷️ *Tiket:* ${report.ticketNumber}\n` +
    `🔍 *Deskripsi:* ${desc}\n\n` +
    `Dukung dan pantau transparansi perbaikannya di:`;
}

export function getWhatsAppShareUrl(report: InfrastructureReport): string {
  const shareUrl = getReportShareUrl(report.id);
  const text = `${getReportShareText(report)} ${shareUrl}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function getTwitterShareUrl(report: InfrastructureReport): string {
  const shareUrl = getReportShareUrl(report.id);
  const address = report.location.city ? `${report.location.city}` : report.location.address;
  const tweetText = `🚨 Laporan Kerusakan ${report.kategori} (${report.tingkat_keparahan}) di ${address}. Pantau transparansi perbaikannya di @LaporInfra:`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
}

export function getTelegramShareUrl(report: InfrastructureReport): string {
  const shareUrl = getReportShareUrl(report.id);
  const text = getReportShareText(report);
  return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
}

export function getFacebookShareUrl(report: InfrastructureReport): string {
  const shareUrl = getReportShareUrl(report.id);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
}

export async function shareReport(title: string, text: string, url: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      console.warn('Share cancelled or failed', e);
    }
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}
