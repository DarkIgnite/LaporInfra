import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Crosshair,
  Plus,
  Minus,
  MapPin,
  Sparkles
} from 'lucide-react';
import { InfrastructureReport } from '../types';
import { getSeverityStyle } from '../utils/helpers';
import { UserLocationData } from '../utils/locationService';

interface GoogleInfrastructureMapProps {
  reports: InfrastructureReport[];
  selectedReport: InfrastructureReport | null;
  onSelectReport: (report: InfrastructureReport) => void;
  userLocation: UserLocationData | { lat: number; lng: number; address?: string; isGps?: boolean } | null;
  isLocating?: boolean;
  onLocateMe?: () => void;
  heightClass?: string;
  radarRadiusMeters?: number; // e.g. 1500 for 1.5km
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  interactivePicker?: boolean;
}

export const GoogleInfrastructureMap: React.FC<GoogleInfrastructureMapProps> = ({
  reports,
  selectedReport,
  onSelectReport,
  userLocation,
  isLocating = false,
  onLocateMe,
  heightClass = 'h-full',
  radarRadiusMeters = 1500,
  onMapClick
}) => {
  const defaultCenter = useMemo(() => {
    if (userLocation && typeof userLocation.lat === 'number') {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    if (reports.length > 0 && reports[0].location?.lat && reports[0].location?.lng) {
      return { lat: reports[0].location.lat, lng: reports[0].location.lng };
    }
    return { lat: -6.2088, lng: 106.8456 }; // Jakarta default
  }, [userLocation, reports]);

  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Clean OpenStreetMap standard tiles (fast, high clarity, no watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      leafletMapRef.current = map;
      leafletMarkersRef.current = L.layerGroup().addTo(map);
    }
  }, [defaultCenter, onMapClick]);

  // Update User Location Marker and Radar
  useEffect(() => {
    if (!leafletMapRef.current || !userLocation) return;
    const map = leafletMapRef.current;
    const { lat, lng } = userLocation;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userCircleRef.current) map.removeLayer(userCircleRef.current);

    // Radar circle if radius > 0
    if (radarRadiusMeters > 0) {
      const circle = L.circle([lat, lng], {
        radius: radarRadiusMeters,
        color: '#d97706',
        fillColor: '#f59e0b',
        fillOpacity: 0.14,
        weight: 1.5,
        dashArray: '5, 6'
      }).addTo(map);
      userCircleRef.current = circle;
    }

    // High-contrast pulsing amber GPS locator dot
    const userHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.25); animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.4);"></div>
        <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: #d97706; border: 2.5px solid #ffffff; box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.25);"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'google-user-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
    userMarkerRef.current = marker;

    // Fly to location if it changed significantly or first load
    const prev = lastLocationRef.current;
    if (!prev || Math.abs(prev.lat - lat) > 0.0001 || Math.abs(prev.lng - lng) > 0.0001) {
      map.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });
      lastLocationRef.current = { lat, lng };
    }
  }, [userLocation, radarRadiusMeters]);

  // Update incident markers
  useEffect(() => {
    if (!leafletMapRef.current || !leafletMarkersRef.current) return;
    const map = leafletMapRef.current;
    const markersGroup = leafletMarkersRef.current;
    markersGroup.clearLayers();

    reports.forEach((report) => {
      if (typeof report.location?.lat !== 'number' || typeof report.location?.lng !== 'number') return;
      const { lat, lng } = report.location;
      const isSelected = selectedReport?.id === report.id;
      const sev = getSeverityStyle(report.tingkat_keparahan);

      const markerHtml = `
        <div class="cursor-pointer transition-all duration-200 ${
          isSelected ? 'scale-110 z-50' : 'hover:scale-105'
        }" style="transform: translate(-50%, -100%);">
          <div class="bg-white rounded-xl shadow-md border ${
            isSelected
              ? 'border-amber-500 ring-3 ring-amber-400/30'
              : 'border-slate-200 hover:border-slate-300'
          } p-1.5 flex items-center gap-1.5 min-w-[125px] max-w-[175px]">
            <img
              src="${report.imageUrl}"
              alt="${report.kategori}"
              class="w-7 h-7 rounded-lg object-cover shrink-0"
              crossOrigin="anonymous"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full ${sev.dot} shrink-0"></span>
                <span class="text-[10px] font-bold text-slate-800 truncate">${report.title || report.kategori}</span>
              </div>
              <div class="text-[9px] text-slate-500 font-medium truncate">${report.location.address?.split(',')[0] || 'Lokasi'}</div>
            </div>
          </div>
          <div class="w-2 h-2 bg-white rotate-45 mx-auto -mt-1 border-r border-b ${
            isSelected ? 'border-amber-500' : 'border-slate-200'
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'google-incident-marker',
        iconSize: [140, 48],
        iconAnchor: [70, 48]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.on('click', () => {
        onSelectReport(report);
        map.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
      });

      markersGroup.addLayer(marker);
    });
  }, [reports, selectedReport, onSelectReport]);

  // Pan map when a report is selected
  useEffect(() => {
    if (!leafletMapRef.current || !selectedReport) return;
    const { lat, lng } = selectedReport.location;
    if (typeof lat === 'number' && typeof lng === 'number') {
      leafletMapRef.current.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
    }
  }, [selectedReport]);

  const handleZoomIn = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomOut();
  };

  const handleLocateClick = () => {
    if (onLocateMe) {
      onLocateMe();
    }
    if (leafletMapRef.current && userLocation && typeof userLocation.lat === 'number') {
      leafletMapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, {
        animate: true,
        duration: 1.2
      });
    }
  };

  return (
    <div className={`relative isolate z-0 w-full ${heightClass} bg-slate-50 overflow-hidden select-none font-sans`}>
      <div ref={leafletContainerRef} className="w-full h-full" />

      {/* Floating Map Controls on Top-Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-center gap-2">
        {/* Locate Me Button with Active State */}
        <button
          id="gmap-locate-btn"
          onClick={handleLocateClick}
          title="Pusatkan ke Lokasi Saya (GPS)"
          className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border transition-all active:scale-95 ${
            isLocating
              ? 'border-amber-500 text-amber-600 bg-amber-50/90 ring-2 ring-amber-400/30'
              : 'border-slate-200/80 text-slate-700 hover:bg-amber-50/50 hover:text-amber-600'
          }`}
        >
          <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-spin text-amber-600' : ''}`} />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-xl bg-white shadow-sm border border-slate-200/80 overflow-hidden">
          <button
            id="gmap-zoom-in"
            onClick={handleZoomIn}
            title="Perbesar Peta"
            className="flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            id="gmap-zoom-out"
            onClick={handleZoomOut}
            title="Perkecil Peta"
            className="flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating Live Location Indicator Badge on Bottom-Left */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="max-w-[200px] truncate text-[11px] font-medium text-slate-600">
            {userLocation.address || 'Pusat Area Pantauan'}
          </span>
        </div>
      )}
    </div>
  );
};
