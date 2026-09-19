/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Bot,
  User,
  MapPin,
  Compass,
  HardHat,
  Zap,
  RotateCcw,
  ExternalLink,
  Loader2,
  ChevronDown,
  Info,
  Building2,
  AlertCircle,
  Copy,
  Check,
  FileQuestion,
  Clock,
  HelpCircle,
  Navigation,
} from 'lucide-react';
import { ChatMessage, ChatRoleMode, GroundingChunk } from '../types';
import { sendGeminiChatMessage } from '../services/api';

interface GeminiChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
  floating?: boolean;
  initialRole?: ChatRoleMode;
}

const ROLE_PRESETS: Record<
  ChatRoleMode,
  {
    title: string;
    shortTitle: string;
    model: string;
    modelDisplay: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeBg: string;
    badgeText: string;
    suggestedPrompts: string[];
  }
> = {
  general: {
    title: 'Asisten Warga & Konsultasi Pelaporan',
    shortTitle: 'Asisten Warga',
    model: 'gemini-2.5-flash',
    modelDisplay: 'Gemini 2.5 Flash',
    description: 'Panduan umum pelaporan, tips keselamatan, dan edukasi fasilitas publik.',
    icon: Bot,
    accentColor: 'amber',
    badgeBg: 'bg-amber-100 border-amber-200',
    badgeText: 'text-amber-800',
    suggestedPrompts: [
      'Berapa lama penanganan jalan berlubang?',
      'Cara melaporkan kerusakan yang benar',
      'Status laporan yang sudah dikirim',
      'Kantor Dinas PU terdekat',
    ],
  },
  complex: {
    title: 'Insinyur Sipil & Analis Struktur PU',
    shortTitle: 'Insinyur Sipil',
    model: 'gemini-3.1-pro-preview',
    modelDisplay: 'Gemini 3.1 Pro',
    description: 'Analisis teknis konstruksi, standar Bina Marga, RAB/AHSP, dan perkerasan.',
    icon: HardHat,
    accentColor: 'indigo',
    badgeBg: 'bg-indigo-100 border-indigo-200',
    badgeText: 'text-indigo-800',
    suggestedPrompts: [
      'Berapa standar tebal aspal Hotmix AC-WC & AC-BC untuk jalan kelas III?',
      'Hitung estimasi RAB penambalan lubang jalan aspal 2m x 3m sedalam 10cm.',
      'Analisis penyebab retak buaya (alligator crack) dan solusi perbaikannya.',
      'Metode pengujian lendutan jembatan dan kriteria batas defleksi L/800.',
    ],
  },
  fast: {
    title: 'Triage Kilat & FAQ Respon Cepat',
    shortTitle: 'Respon Cepat',
    model: 'gemini-3.1-flash-lite',
    modelDisplay: 'Gemini 3.1 Flash Lite',
    description: 'Jawaban super cepat & ringkas untuk situasi darurat dan tanya jawab kilat.',
    icon: Zap,
    accentColor: 'emerald',
    badgeBg: 'bg-emerald-100 border-emerald-200',
    badgeText: 'text-emerald-800',
    suggestedPrompts: [
      'Nomor kontak darurat perbaikan jalan & lampu padam di Jakarta?',
      'Kriteria kerusakan jalan darurat Level 1 (<24 jam)?',
      'Apakah laporan jalan di LaporInfra langsung sampai ke dinas?',
    ],
  },
  maps: {
    title: 'Radar Lokasi Fasilitas PU (Maps Grounded)',
    shortTitle: 'Radar Peta PU',
    model: 'gemini-2.5-flash',
    modelDisplay: 'Gemini 2.5 Flash + Maps',
    description: 'Pencarian kantor Dinas PU, posko URC, dan fasilitas darurat berbasis Google Maps.',
    icon: MapPin,
    accentColor: 'sky',
    badgeBg: 'bg-sky-100 border-sky-200',
    badgeText: 'text-sky-800',
    suggestedPrompts: [
      'Cari kantor Dinas Bina Marga / Pekerjaan Umum terdekat di Jakarta Selatan.',
      'Di mana posko Unit Reaksi Cepat (URC) perbaikan jalan di Bandung?',
      'Cari depo material aspal dan distributor beton ready-mix di Surabaya.',
      'Cari kantor polisi lalu lintas dan RS rujukan kecelakaan di sekitar lokasi saya.',
    ],
  },
};

// Icons for empty-state chips (one per prompt index)
const CHIP_ICONS = [Clock, FileQuestion, HelpCircle, Navigation];

export function GeminiChatbot({
  isOpen = true,
  onClose,
  floating = false,
  initialRole = 'general',
}: GeminiChatbotProps) {
  const [roleMode, setRoleMode] = useState<ChatRoleMode>(initialRole);
  const [enableMaps, setEnableMaps] = useState<boolean>(initialRole === 'maps');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);

  // For embedded (non-floating) mode: start with NO messages so empty state shows
  const getInitialMessages = (role: ChatRoleMode): ChatMessage[] => {
    if (!floating) return []; // clean empty state for embedded mode
    return [
      {
        id: 'welcome-1',
        role: 'model',
        text: `👋 **Halo! Saya Asisten AI LaporInfra.**\n\nMode aktif saat ini: **${ROLE_PRESETS[role].title}** (Ditenagai oleh *${ROLE_PRESETS[role].modelDisplay}*).\n\nAda yang bisa saya bantu terkait pemeriksaan kerusakan jalan, konsultasi teknis infrastruktur, atau pencarian fasilitas PU terdekat?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleMode: role,
        modelUsed: ROLE_PRESETS[role].model,
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages(initialRole));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Sync role switch
  const handleRoleChange = (newRole: ChatRoleMode) => {
    setRoleMode(newRole);
    setEnableMaps(newRole === 'maps');
    setIsRoleDropdownOpen(false);

    // Append switch notice
    setMessages((prev) => [
      ...prev,
      {
        id: `role-switch-${Date.now()}`,
        role: 'model',
        text: `🔄 *Mode AI dialihkan ke **${ROLE_PRESETS[newRole].title}** (${ROLE_PRESETS[newRole].modelDisplay}).*\n\n${ROLE_PRESETS[newRole].description}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleMode: newRole,
        modelUsed: ROLE_PRESETS[newRole].model,
      },
    ]);
  };

  // Get user geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung geolokasi');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        };
        setUserLocation(coords);
        setLocationName(`${coords.lat}, ${coords.lng}`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        // Fallback to Jakarta coordinates for demo if denied
        setUserLocation({ lat: -6.2088, lng: 106.8456 });
        setLocationName('Jakarta (Default)');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputMessage).trim();
    if (!queryText || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history payload
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await sendGeminiChatMessage({
        messages: historyPayload,
        roleMode,
        location: userLocation,
        enableMapsGrounding: enableMaps || roleMode === 'maps',
      });

      const newModelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleMode,
        modelUsed: res.modelUsed || ROLE_PRESETS[roleMode].model,
        groundingChunks: res.groundingChunks || [],
      };

      setMessages((prev) => [...prev, newModelMsg]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'model',
          text: `⚠️ Maaf, terjadi kesalahan saat menghubungi model AI (${error?.message || 'Error'}). Silakan coba lagi.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearHistory = () => {
    setMessages(getInitialMessages(roleMode));
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentPreset = ROLE_PRESETS[roleMode];
  const PresetIcon = currentPreset.icon;
  const hasMessages = messages.length > 0;

  if (!isOpen) return null;

  // ─── FLOATING MODE (original dark-header style, unchanged) ───────────────
  if (floating) {
    return (
      <div
        id="gemini-chatbot-container"
        className="fixed bottom-20 right-4 sm:right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[82vh] z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col bg-white border border-stone-200/90 shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white px-4 py-3.5 border-b border-stone-700 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                    <span>LaporInfra AI Assistant</span>
                    <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30">
                      Live
                    </span>
                  </h3>
                </div>
                <p className="text-[11px] text-stone-400 leading-tight">
                  Konsultasi Kerusakan, Analisis PU &amp; Grounding Maps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Reset Percakapan"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 transition-colors text-xs flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Role Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-stone-800/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl text-left text-xs transition-all text-stone-200 shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <PresetIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-stone-100 truncate">{currentPreset.shortTitle}</span>
                <span className="text-[10px] text-stone-400 font-mono bg-stone-900/60 px-1.5 py-0.5 rounded border border-stone-700">
                  {currentPreset.modelDisplay}
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-stone-400 transition-transform ${
                  isRoleDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isRoleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-stone-900 border border-stone-700 rounded-xl shadow-xl z-30 overflow-hidden py-1 divide-y divide-stone-800"
                >
                  {(Object.keys(ROLE_PRESETS) as ChatRoleMode[]).map((mode) => {
                    const preset = ROLE_PRESETS[mode];
                    const ModeIcon = preset.icon;
                    const isSelected = roleMode === mode;

                    return (
                      <button
                        key={mode}
                        onClick={() => handleRoleChange(mode)}
                        className={`w-full px-3 py-2 text-left text-xs flex items-start gap-2.5 hover:bg-stone-800 transition-colors ${
                          isSelected ? 'bg-amber-500/10 text-amber-300' : 'text-stone-300'
                        }`}
                      >
                        <ModeIcon
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            isSelected ? 'text-amber-400' : 'text-stone-400'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{preset.shortTitle}</span>
                            <span className="text-[9px] font-mono text-stone-400 bg-stone-800 px-1 rounded">
                              {preset.modelDisplay}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 truncate mt-0.5">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-amber-500 text-white font-medium rounded-tr-xs'
                      : msg.isError
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-tl-xs'
                      : 'bg-white text-stone-800 border border-stone-200/90 rounded-tl-xs'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-1.5 mb-2 text-[10px] text-stone-400">
                      <span className="font-bold text-amber-700">
                        {msg.roleMode ? ROLE_PRESETS[msg.roleMode]?.shortTitle : 'LaporInfra AI'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] bg-stone-100 px-1.5 py-0.2 rounded text-stone-500">
                          {msg.modelUsed || 'Gemini'}
                        </span>
                        <button
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="hover:text-stone-700 transition-colors p-0.5"
                          title="Salin pesan"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`prose prose-stone prose-xs max-w-none break-words ${isUser ? 'text-white prose-invert' : ''}`}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => (
                          <strong className={isUser ? 'text-white font-bold' : 'text-stone-900 font-bold'}>
                            {children}
                          </strong>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-700 underline font-semibold hover:text-amber-900 inline-flex items-center gap-0.5"
                          >
                            {children}
                            <ExternalLink className="h-2.5 w-2.5 inline" />
                          </a>
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {!isUser && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-sky-700">
                        <MapPin className="h-3 w-3" />
                        <span>Data Lokasi Terverifikasi Google Maps Platform:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {msg.groundingChunks.map((chunk, idx) => {
                          const mapsData = chunk.maps;
                          const webData = chunk.web;

                          if (mapsData) {
                            return (
                              <a
                                key={idx}
                                href={
                                  mapsData.uri ||
                                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    mapsData.title || 'Fasilitas PU'
                                  )}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-start justify-between gap-2 p-2 rounded-xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200/80 transition-all text-[11px]"
                              >
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <Building2 className="h-3.5 w-3.5 text-sky-600 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-bold text-sky-950 block truncate group-hover:text-sky-800">
                                      {mapsData.title || 'Lokasi Fasilitas Google Maps'}
                                    </span>
                                    {mapsData.placeAnswerSources?.reviewSnippets?.[0]?.reviewText && (
                                      <p className="text-[10px] text-sky-800/80 line-clamp-1 italic mt-0.5">
                                        &ldquo;{mapsData.placeAnswerSources.reviewSnippets[0].reviewText}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <ExternalLink className="h-3 w-3 text-sky-600 shrink-0 group-hover:translate-x-0.5 transition-transform mt-0.5" />
                              </a>
                            );
                          }

                          if (webData && webData.uri) {
                            return (
                              <a
                                key={idx}
                                href={webData.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-700"
                              >
                                <span className="truncate">{webData.title || webData.uri}</span>
                                <ExternalLink className="h-3 w-3 text-stone-500 shrink-0" />
                              </a>
                            );
                          }

                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className={`text-[9px] mt-1.5 ${isUser ? 'text-amber-100 text-right' : 'text-stone-400'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-white shadow-xs mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5 items-start justify-start"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-xs p-3.5 bg-white border border-stone-200 text-xs text-stone-500 flex items-center gap-2 shadow-xs">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <span>
                  {roleMode === 'complex'
                    ? 'Insinyur AI sedang menganalisis standar struktural & RAB...'
                    : roleMode === 'maps'
                    ? 'Sedang mencari data lokasi di Google Maps...'
                    : 'Sedang menyusun respon cerdas...'}
                </span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 bg-stone-100/80 border-t border-stone-200/70 shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500 mb-1.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Saran Pertanyaan Cepat:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {currentPreset.suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-800 border border-stone-200 hover:border-amber-300 transition-colors shadow-2xs leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Maps Grounding & Geolocation Controls */}
        <div className="px-3.5 py-1.5 bg-white border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-stone-800">
            <input
              type="checkbox"
              checked={enableMaps}
              onChange={(e) => setEnableMaps(e.target.checked)}
              className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
            />
            <span className="font-medium text-[11px]">Google Maps Grounding</span>
          </label>

          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className="flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-800 transition-colors"
          >
            {isLocating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Compass className="h-3 w-3" />
            )}
            <span>{locationName ? locationName : 'Deteksi GPS'}</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-stone-200/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                roleMode === 'complex'
                  ? 'Tanyakan standar teknis, RAB, atau kalkulasi struktur...'
                  : roleMode === 'maps'
                  ? 'Cari kantor PU, posko URC, atau rute alternatif...'
                  : 'Ketik pertanyaan kerusakan infrastruktur di sini...'
              }
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── EMBEDDED MODE (ChatGPT-style clean white UI) ────────────────────────
  return (
    <div
      id="gemini-chatbot-container"
      className="flex flex-col bg-white w-full h-full"
    >
      {/* Messages / Empty State area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasMessages ? (
          /* ── Empty state (ChatGPT-style welcome) ── */
          <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/25 mb-5">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1.5">
              Tanya apa saja tentang infrastruktur kota
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-sm">
              Asisten AI ini terhubung dengan data laporan LaporInfra — siap membantu warga dan dinas.
            </p>

            {/* 2×2 prompt chip grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mb-8">
              {currentPreset.suggestedPrompts.slice(0, 4).map((prompt, idx) => {
                const ChipIcon = CHIP_ICONS[idx] || Sparkles;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="flex items-start gap-3 text-left p-3.5 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all group shadow-sm"
                  >
                    <ChipIcon className="h-4 w-4 text-gray-400 group-hover:text-amber-600 mt-0.5 shrink-0 transition-colors" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">
                      {prompt}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-400">
              AI ini terhubung dengan data laporan LaporInfra. Tanyakan tentang laporan, peta kerusakan, atau cara melapor.
            </p>
          </div>
        ) : (
          /* ── Message thread ── */
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Bot avatar */}
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-amber-500 text-white rounded-br-sm shadow-sm'
                        : msg.isError
                        ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-sm shadow-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {/* Bot message header (model badge + copy) */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 mb-2 text-[10px] text-gray-400">
                        <span className="font-semibold text-amber-600">
                          {msg.roleMode ? ROLE_PRESETS[msg.roleMode]?.shortTitle : 'LaporInfra AI'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500">
                            {msg.modelUsed || 'Gemini'}
                          </span>
                          <button
                            onClick={() => handleCopyText(msg.text, msg.id)}
                            className="hover:text-gray-600 transition-colors p-0.5"
                            title="Salin pesan"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Message body with Markdown */}
                    <div
                      className={`prose prose-sm max-w-none break-words ${
                        isUser ? 'text-white prose-invert' : 'prose-gray'
                      }`}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => (
                            <strong className={isUser ? 'text-white font-bold' : 'text-gray-900 font-bold'}>
                              {children}
                            </strong>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline font-semibold hover:text-blue-800 inline-flex items-center gap-0.5"
                            >
                              {children}
                              <ExternalLink className="h-2.5 w-2.5 inline" />
                            </a>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {/* Google Maps grounding citations */}
                    {!isUser && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-200 space-y-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-sky-700">
                          <MapPin className="h-3 w-3" />
                          <span>Data Lokasi Terverifikasi Google Maps Platform:</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {msg.groundingChunks.map((chunk, idx) => {
                            const mapsData = chunk.maps;
                            const webData = chunk.web;

                            if (mapsData) {
                              return (
                                <a
                                  key={idx}
                                  href={
                                    mapsData.uri ||
                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      mapsData.title || 'Fasilitas PU'
                                    )}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex items-start justify-between gap-2 p-2 rounded-xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200/80 transition-all text-[11px]"
                                >
                                  <div className="flex items-start gap-1.5 min-w-0">
                                    <Building2 className="h-3.5 w-3.5 text-sky-600 mt-0.5 shrink-0" />
                                    <div>
                                      <span className="font-bold text-sky-950 block truncate group-hover:text-sky-800">
                                        {mapsData.title || 'Lokasi Fasilitas Google Maps'}
                                      </span>
                                      {mapsData.placeAnswerSources?.reviewSnippets?.[0]?.reviewText && (
                                        <p className="text-[10px] text-sky-800/80 line-clamp-1 italic mt-0.5">
                                          &ldquo;{mapsData.placeAnswerSources.reviewSnippets[0].reviewText}&rdquo;
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <ExternalLink className="h-3 w-3 text-sky-600 shrink-0 group-hover:translate-x-0.5 transition-transform mt-0.5" />
                                </a>
                              );
                            }

                            if (webData && webData.uri) {
                              return (
                                <a
                                  key={idx}
                                  href={webData.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] text-gray-700"
                                >
                                  <span className="truncate">{webData.title || webData.uri}</span>
                                  <ExternalLink className="h-3 w-3 text-gray-500 shrink-0" />
                                </a>
                              );
                            }

                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-[10px] mt-1.5 ${isUser ? 'text-amber-100 text-right' : 'text-gray-400'}`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* User avatar */}
                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-white shadow-sm mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 items-start justify-start"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-gray-100 text-sm text-gray-500 flex items-center gap-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  <span>
                    {roleMode === 'complex'
                      ? 'Insinyur AI sedang menganalisis standar struktural & RAB...'
                      : roleMode === 'maps'
                      ? 'Sedang mencari data lokasi di Google Maps...'
                      : 'Sedang menyusun respon cerdas...'}
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom input area — pinned, clean white */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">
        <div className="mx-auto max-w-3xl space-y-2">

          {/* Controls row: role selector (minimal) + Maps toggle + GPS */}
          <div className="flex items-center justify-between text-xs text-gray-400 gap-2 px-1">
            {/* Compact role pill */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs text-gray-600"
              >
                <PresetIcon className="h-3 w-3 text-gray-400" />
                <span className="font-medium">{currentPreset.shortTitle}</span>
                <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isRoleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-full left-0 mb-1 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden py-1"
                  >
                    {(Object.keys(ROLE_PRESETS) as ChatRoleMode[]).map((mode) => {
                      const preset = ROLE_PRESETS[mode];
                      const ModeIcon = preset.icon;
                      const isSelected = roleMode === mode;

                      return (
                        <button
                          key={mode}
                          onClick={() => handleRoleChange(mode)}
                          className={`w-full px-3 py-2 text-left text-xs flex items-start gap-2.5 hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-amber-50 text-amber-800' : 'text-gray-700'
                          }`}
                        >
                          <ModeIcon
                            className={`h-4 w-4 mt-0.5 shrink-0 ${
                              isSelected ? 'text-amber-600' : 'text-gray-400'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{preset.shortTitle}</span>
                              <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1 rounded">
                                {preset.modelDisplay}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{preset.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600">
                <input
                  type="checkbox"
                  checked={enableMaps}
                  onChange={(e) => setEnableMaps(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                />
                <span>Maps Grounding</span>
              </label>

              <button
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Compass className="h-3 w-3" />}
                <span className="hidden sm:inline">{locationName ? locationName : 'Deteksi GPS'}</span>
              </button>

              <button
                onClick={handleClearHistory}
                title="Reset percakapan"
                className="flex items-center gap-1 hover:text-gray-600 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Input row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                roleMode === 'complex'
                  ? 'Tanyakan standar teknis, RAB, atau kalkulasi struktur...'
                  : roleMode === 'maps'
                  ? 'Cari kantor PU, posko URC, atau rute alternatif...'
                  : 'Tanyakan tentang laporan, peta kerusakan, atau cara melapor...'
              }
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white border border-transparent focus:border-amber-300 transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-amber-500/20"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[11px] text-gray-400 pt-0.5">
            AI ini terhubung dengan data kerusakan LaporInfra. Tanyakan tentang laporan, peta kerusakan, atau cara melapor.
          </p>
        </div>
      </div>
    </div>
  );
}
