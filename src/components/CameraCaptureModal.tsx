import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  X,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Send,
  Zap,
  Crosshair,
  Sliders,
  Check
} from 'lucide-react';
import { DEMO_PRESET_IMAGES } from '../data/seedReports';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (
    base64Image: string,
    optionalPresetLocation?: { lat: number; lng: number; address: string }
  ) => void;
  initialMode?: 'camera' | 'upload' | 'preset';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onImageSelected,
  initialMode = 'camera',
}) => {
  const [mode, setMode] = useState<'camera' | 'upload' | 'preset'>(initialMode);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or restart camera stream
  const startCamera = async (facing: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    setIsCameraActive(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera web tidak didukung oleh peramban ini.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      // Fallback try without ideal constraints if high-res failed
      try {
        const streamFallback = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = streamFallback;
        if (videoRef.current) {
          videoRef.current.srcObject = streamFallback;
          await videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (fallbackErr: any) {
        setCameraError(
          'Tidak dapat mengakses kamera perangkat atau izin kamera ditolak. Silakan berikan izin akses atau pilih opsi "Unggah Galeri".'
        );
        setIsCameraActive(false);
        setMode('upload');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Lifecycle control
  useEffect(() => {
    if (isOpen && mode === 'camera' && !capturedSnapshot) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode, capturedSnapshot]);

  // Reset captured state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCapturedSnapshot(null);
      setCameraError(null);
    } else {
      stopCamera();
      setCapturedSnapshot(null);
    }
  }, [isOpen, initialMode]);

  // Capture Photo Handler
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    setFlashActive(true);

    // Trigger visual camera flash
    setTimeout(() => {
      setFlashActive(false);
    }, 150);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        // Freeze frame for user review
        setCapturedSnapshot(dataUrl);
        stopCamera();
      }
    } catch (e) {
      console.error('Photo capture error:', e);
    } finally {
      setIsCapturing(false);
    }
  };

  // Confirm and Send to AI Vision
  const handleConfirmCapturedPhoto = () => {
    if (!capturedSnapshot) return;
    stopCamera();
    onImageSelected(capturedSnapshot);
  };

  // Retake Photo Handler
  const handleRetakePhoto = () => {
    setCapturedSnapshot(null);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        stopCamera();
        onImageSelected(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset Selection Handler
  const handleSelectPreset = async (preset: (typeof DEMO_PRESET_IMAGES)[0]) => {
    stopCamera();
    try {
      const response = await fetch(preset.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onImageSelected(base64data, {
          lat: preset.lat,
          lng: preset.lng,
          address: preset.address,
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      onImageSelected(preset.url, {
        lat: preset.lat,
        lng: preset.lng,
        address: preset.address,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] isolate flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 bg-stone-50/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Kamera Real-time Infrastruktur
              </h3>
              <p className="text-[11px] text-stone-500">
                Bidik kerusakan jalan / trotoar &bull; Gemini Multimodal AI
              </p>
            </div>
          </div>
          <button
            id="close-camera-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 p-1.5 gap-1 text-xs font-bold">
          <button
            id="tab-mode-camera"
            onClick={() => {
              setCapturedSnapshot(null);
              setMode('camera');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl transition-all ${
              mode === 'camera'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="h-3.5 w-3.5 text-amber-600" />
            <span>Kamera Langsung</span>
          </button>

          <button
            id="tab-mode-upload"
            onClick={() => {
              setCapturedSnapshot(null);
              setMode('upload');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl transition-all ${
              mode === 'upload'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-amber-600" />
            <span>Unggah Berkas</span>
          </button>

          <button
            id="tab-mode-preset"
            onClick={() => {
              setCapturedSnapshot(null);
              setMode('preset');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl transition-all ${
              mode === 'preset'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Sampel Demo</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5">
          {mode === 'camera' && (
            <div className="space-y-4">
              {/* Camera / Viewfinder Box */}
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-stone-950 flex items-center justify-center shadow-inner">
                {/* Shutter White Flash Animation */}
                {flashActive && (
                  <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150" />
                )}

                {/* Review Mode (Captured Snapshot Preview) */}
                {capturedSnapshot ? (
                  <div className="relative h-full w-full">
                    <img
                      src={capturedSnapshot}
                      alt="Foto Terambil"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Foto Berhasil Ditangkap</span>
                    </div>
                  </div>
                ) : cameraError ? (
                  <div className="p-6 text-center text-white">
                    <AlertCircle className="mx-auto h-10 w-10 text-amber-400 mb-2" />
                    <p className="text-sm font-medium text-stone-200">{cameraError}</p>
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="mt-4 rounded-full bg-stone-800 px-4 py-2 text-xs font-bold text-white hover:bg-stone-700 transition-colors"
                    >
                      Coba Lagi Akses Kamera
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Live Video Stream */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full object-cover ${
                        facingMode === 'user' ? '-scale-x-100' : ''
                      }`}
                    />

                    {/* Live Stream Indicator Badge */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/10">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE FEED</span>
                    </div>

                    {/* Camera Infrastructure HUD Target Frame Overlay */}
                    <div className="absolute inset-4 sm:inset-6 pointer-events-none flex flex-col justify-between p-2 z-10">
                      {/* Corner Target Markers */}
                      <div className="flex justify-between items-start">
                        <div className="w-5 h-5 border-t-2 border-l-2 border-amber-400 rounded-tl-md"></div>
                        <div className="w-5 h-5 border-t-2 border-r-2 border-amber-400 rounded-tr-md"></div>
                      </div>

                      {/* Center Crosshair Target */}
                      <div className="self-center flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full border border-amber-400/40 bg-amber-500/10">
                          <Crosshair className="h-6 w-6 text-amber-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-semibold text-white/90 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                          Posisikan kerusakan di tengah
                        </span>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="w-5 h-5 border-b-2 border-l-2 border-amber-400 rounded-bl-md"></div>
                        <div className="w-5 h-5 border-b-2 border-r-2 border-amber-400 rounded-br-md"></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons: Live Shutter or Confirmation Mode */}
              {capturedSnapshot ? (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    id="retake-photo-btn"
                    type="button"
                    onClick={handleRetakePhoto}
                    className="flex-1 flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white py-3 text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-98 transition-all"
                  >
                    <RotateCcw className="h-4 w-4 text-stone-500" />
                    <span>Ambil Ulang Foto</span>
                  </button>

                  <button
                    id="confirm-send-ai-btn"
                    type="button"
                    onClick={handleConfirmCapturedPhoto}
                    className="flex-1 flex items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-xs font-bold text-white shadow-lg hover:bg-stone-800 active:scale-98 transition-all"
                  >
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span>Pindai dengan AI Gemini</span>
                  </button>
                </div>
              ) : (
                !cameraError && (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    {/* Switch Front/Rear Camera */}
                    <button
                      id="flip-camera-btn"
                      type="button"
                      onClick={() =>
                        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                      }
                      title="Balik Kamera (Depan / Belakang)"
                      className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-bold text-stone-700 hover:bg-stone-100 active:scale-95 transition-all"
                    >
                      <RefreshCw className="h-4 w-4 text-stone-600" />
                      <span className="hidden sm:inline">Balik Kamera</span>
                    </button>

                    {/* Main Capture Shutter Button */}
                    <button
                      id="snap-photo-btn"
                      type="button"
                      onClick={handleCapturePhoto}
                      disabled={isCapturing || !isCameraActive}
                      className="flex-1 flex items-center justify-center gap-2.5 rounded-full bg-stone-900 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-stone-800 active:scale-98 transition-all disabled:opacity-50"
                    >
                      <div className="h-4 w-4 rounded-full bg-amber-400 ring-4 ring-amber-400/30 animate-pulse"></div>
                      <span>Jepret Foto Kerusakan</span>
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-3xl p-8 text-center bg-stone-50/60 hover:bg-amber-50/40 hover:border-amber-400 transition-all cursor-pointer group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="h-7 w-7" />
                </div>
                <h4 className="text-sm font-bold text-stone-800">
                  Pilih file foto dari galeri / perangkat
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Format JPG, PNG, WEBP. AI Gemini akan langsung membaca detail visual gambar.
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-stone-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs group-hover:bg-stone-800 transition-colors"
                >
                  Buka Galeri Foto
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {mode === 'preset' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-stone-700 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Pilih salah satu contoh foto kerusakan nyata di bawah ini untuk pengujian instan:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {DEMO_PRESET_IMAGES.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-stone-200 bg-white hover:border-amber-500 hover:bg-amber-50/40 hover:shadow-2xs transition-all cursor-pointer group text-left"
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="h-14 w-14 rounded-2xl object-cover shrink-0 group-hover:scale-105 transition-transform border border-stone-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700 mb-0.5">
                        {preset.category}
                      </span>
                      <h5 className="text-xs font-bold text-stone-900 truncate">
                        {preset.name}
                      </h5>
                      <p className="text-[11px] text-stone-500 truncate">
                        {preset.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
