/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HeroLanding } from './components/HeroLanding';
import { DamageMap } from './components/DamageMap';
import { PublicReportGrid } from './components/PublicReportGrid';
import { AdminDashboard } from './components/AdminDashboard';
import { AIAssistantView } from './components/AIAssistantView';
import { GeminiChatbot } from './components/GeminiChatbot';
import { CreateReportModal } from './components/CreateReportModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SDGInfoModal } from './components/SDGInfoModal';
import { InfrastructureReport, AdminUser } from './types';
import { fetchReports, subscribeToReports } from './services/api';
import { SEED_REPORTS } from './data/seedReports';
import { Building2, Award, Sparkles, MessageSquare, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, userProfile, signInWithGoogle, setUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'beranda' | 'radar' | 'peta' | 'laporan' | 'admin' | 'asisten'>('beranda');
  const [reports, setReports] = useState<InfrastructureReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Floating Chatbot State
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState<boolean>(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSDGModalOpen, setIsSDGModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Derive active admin officer from Google Auth profile
  const effectiveAdminUser: AdminUser | null =
    user && userProfile?.role === 'petugas'
      ? {
          id: user.uid,
          name: userProfile.displayName || user.displayName || 'Petugas Dinas PU',
          username: user.email?.split('@')[0] || 'petugas',
          role: 'Petugas Dinas',
          email: user.email || '',
          department: userProfile.department || 'Dinas Pekerjaan Umum & Tata Kota',
          avatarUrl: user.photoURL || undefined,
        }
      : null;

  // Load all reports from backend / local state
  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports();
      if (data && data.length > 0) {
        setReports(data);
      } else {
        setReports(SEED_REPORTS);
      }
    } catch (e) {
      console.warn('Failed to load remote reports, using seed fallback', e);
      setReports(SEED_REPORTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
    const unsubscribe = subscribeToReports((updatedList) => {
      if (updatedList && updatedList.length > 0) {
        setReports(updatedList);
        setIsLoading(false);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadReports]);

  // Handle URL hash routing if present
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('laporan-')) {
        const id = hash.replace('laporan-', '');
        setSelectedReportId(id);
      } else if (hash === 'radar') {
        setActiveTab('radar');
      } else if (hash === 'peta') {
        setActiveTab('peta');
      } else if (hash === 'laporan') {
        setActiveTab('laporan');
      } else if (hash === 'admin') {
        setActiveTab('admin');
      } else if (hash === 'asisten' || hash === 'chat') {
        setActiveTab('asisten');
      } else if (hash === 'beranda') {
        setActiveTab('beranda');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenReportModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  const handleReportCreated = (newReportId: string) => {
    loadReports();
    setSelectedReportId(newReportId);
  };

  const activeReport = reports.find((r) => r.id === selectedReportId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-stone-900 font-sans antialiased selection:bg-amber-600 selection:text-white">
      {/* Top Navigation Bar - Minimal & Streamlined */}
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => {
          if (tab === 'admin' && !effectiveAdminUser) {
            setIsLoginModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenReportModal={handleOpenReportModal}
        onOpenSDGModal={() => setIsSDGModalOpen(true)}
        onToggleChat={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
        isChatOpen={isFloatingChatOpen}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-20 md:pb-0">
        {activeTab === 'beranda' && (
          <LandingPage
            reports={reports}
            onOpenReportModal={handleOpenReportModal}
            onNavigateToRadar={() => setActiveTab('asisten')}
            onNavigateToList={() => setActiveTab('laporan')}
            onNavigateToMap={() => setActiveTab('peta')}
            onSelectReport={handleSelectReport}
            onOpenSDGModal={() => setIsSDGModalOpen(true)}
          />
        )}

        {activeTab === 'asisten' && (
          <AIAssistantView
            onOpenReportModal={handleOpenReportModal}
            onNavigateToMap={() => setActiveTab('peta')}
            onOpenSDGModal={() => setIsSDGModalOpen(true)}
          />
        )}

        {activeTab === 'radar' && (
          <HeroLanding
            reports={reports}
            onOpenReportModal={handleOpenReportModal}
            onNavigateToMap={() => setActiveTab('peta')}
            onNavigateToList={() => setActiveTab('laporan')}
            onSelectReport={handleSelectReport}
            onOpenSDGModal={() => setIsSDGModalOpen(true)}
          />
        )}

        {activeTab === 'peta' && (
          <DamageMap
            reports={reports}
            onSelectReport={handleSelectReport}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {activeTab === 'laporan' && (
          <div className="bg-[#fafaf9] min-h-screen py-4">
            <PublicReportGrid
              reports={reports}
              onSelectReport={handleSelectReport}
              onOpenReportModal={handleOpenReportModal}
              onReportsUpdated={loadReports}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          effectiveAdminUser ? (
            <div className="bg-[#fafaf9] min-h-screen py-4">
              <AdminDashboard
                reports={reports}
                adminUser={effectiveAdminUser}
                onSelectReport={handleSelectReport}
                onReportsUpdated={loadReports}
              />
            </div>
          ) : (
            <div className="py-20 text-center px-4 bg-[#fafaf9] min-h-[60vh] flex flex-col items-center justify-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 mb-4 border border-amber-200 shadow-xs">
                <Building2 className="h-8 w-8 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-black text-stone-900">
                Portal Petugas Dinas Pekerjaan Umum &amp; Tata Kota
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
                {user
                  ? `Akun Google Anda (${user.displayName || user.email}) saat ini berstatus Warga. Klik di bawah untuk mengaktifkan peran Petugas PU.`
                  : 'Masuk dengan Akun Google untuk mengakses dashboard verifikasi & unit reaksi cepat (URC) dinas PU.'}
              </p>
              {user ? (
                <button
                  onClick={async () => {
                    await setUserRole('petugas');
                    setActiveTab('admin');
                  }}
                  className="flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-600/25 active:scale-95 transition-all"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Aktifkan Peran Petugas PU &amp; Buka Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                      await setUserRole('petugas');
                      setActiveTab('admin');
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="flex items-center gap-2 rounded-full bg-stone-900 hover:bg-stone-800 px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-lg active:scale-95 transition-all"
                >
                  <Building2 className="h-4 w-4 text-amber-400" />
                  <span>Masuk dengan Google &amp; Aktifkan Peran Petugas</span>
                </button>
              )}
            </div>
          )
        )}
      </main>

      {/* Persistent Floating Chat Widget (When Not On Assistant Tab) */}
      {activeTab !== 'asisten' && (
        <>
          {/* Floating Trigger Button */}
          {!isFloatingChatOpen && (
            <button
              id="floating-chat-toggle-btn"
              onClick={() => setIsFloatingChatOpen(true)}
              className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all border border-stone-700/80 group"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs group-hover:rotate-12 transition-transform">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="hidden sm:inline">Tanya Asisten AI &amp; Peta</span>
              <span className="sm:hidden">Tanya AI</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </button>
          )}

          {/* Floating Chat Modal */}
          {isFloatingChatOpen && (
            <GeminiChatbot
              floating={true}
              isOpen={isFloatingChatOpen}
              onClose={() => setIsFloatingChatOpen(false)}
            />
          )}
        </>
      )}

      {/* Footer */}
      {activeTab !== 'peta' && (
        <footer className="border-t border-stone-200/80 bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-stone-500 mb-16 md:mb-0">
          <div className="mx-auto max-w-[1280px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white font-black text-[10px]">
                LI
              </div>
              <span className="font-bold text-stone-800">LaporInfra</span>
              <span className="hidden sm:inline text-stone-400">— Platform Pelaporan Kerusakan Infrastruktur Berbasis Foto &amp; AI Vision</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <button
                onClick={() => setIsSDGModalOpen(true)}
                className="font-bold text-amber-700 hover:text-amber-800 transition-colors flex items-center gap-1"
              >
                <Award className="h-3.5 w-3.5" />
                <span>SDG 9: Industri, Inovasi &amp; Infrastruktur</span>
              </button>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500">Google Maps Platform &amp; Gemini Multimodal</span>
            </div>
          </div>
        </footer>
      )}

      {/* MODALS */}
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onReportCreated={handleReportCreated}
      />

      <ReportDetailModal
        report={activeReport}
        isOpen={!!selectedReportId}
        onClose={() => {
          setSelectedReportId(null);
          if (window.location.hash.startsWith('#laporan-')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        onReportsUpdated={loadReports}
        isAdmin={!!effectiveAdminUser}
      />

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setActiveTab('admin')}
      />

      <SDGInfoModal
        isOpen={isSDGModalOpen}
        onClose={() => setIsSDGModalOpen(false)}
      />
    </div>
  );
}
