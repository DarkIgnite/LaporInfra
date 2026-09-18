import React from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  Wrench,
  FileText,
  ShieldCheck,
  Building2,
  UserCheck
} from 'lucide-react';
import { InfrastructureReport, ReportStatus } from '../types';
import { formatIndonesianDate } from '../utils/helpers';

interface ReportStatusTrackerProps {
  report: InfrastructureReport;
  className?: string;
}

export type StepState = 'completed' | 'current' | 'upcoming';

export interface TrackerStep {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  state: StepState;
  timestamp?: string;
  notes?: string;
  actor?: string;
}

export const ReportStatusTracker: React.FC<ReportStatusTrackerProps> = ({
  report,
  className = ''
}) => {
  // Determine the progression level (1 to 4)
  let currentStepIndex = 1;

  const isCompleted = report.status === 'Selesai';
  const isInProgress = report.status === 'Diproses';

  if (isCompleted) {
    currentStepIndex = 4;
  } else if (isInProgress) {
    currentStepIndex = 3;
  } else {
    // Status 'Baru':
    if (report.deskripsi_otomatis || report.tingkat_keparahan) {
      currentStepIndex = 2;
    } else {
      currentStepIndex = 1;
    }
  }

  // Find historical records for matching timestamps
  const history = report.statusHistory || [];
  const reportedHistory = history.find((h) => h.status === 'Baru') || {
    status: 'Baru' as ReportStatus,
    timestamp: report.createdAt,
    updatedBy: report.reporterName ? `Warga (${report.reporterName})` : 'Pelapor Mandiri'
  };

  const inProgressHistory = history.find((h) => h.status === 'Diproses');
  const completedHistory = history.find((h) => h.status === 'Selesai');

  // Build the 4 steps
  const steps: TrackerStep[] = [
    {
      id: 'dilaporkan',
      label: 'Dilaporkan',
      subtitle: 'Laporan warga masuk ke sistem',
      icon: FileText,
      state: 'completed',
      timestamp: reportedHistory.timestamp || report.createdAt,
      actor: report.reporterName ? `Pelapor: ${report.reporterName}` : 'Warga / Masyarakat',
      notes: report.deskripsi_manual ? `"${report.deskripsi_manual}"` : undefined
    },
    {
      id: 'diverifikasi',
      label: 'Diverifikasi',
      subtitle: 'Validasi AI Gemini & Tim Teknis',
      icon: Sparkles,
      state: currentStepIndex > 2 ? 'completed' : currentStepIndex === 2 ? 'current' : 'upcoming',
      timestamp: report.createdAt,
      actor: 'AI Gemini Vision & Sistem LaporInfra',
      notes: `Tingkat ${report.tingkat_keparahan} • ${report.kategori}`
    },
    {
      id: 'dalam_perbaikan',
      label: 'Dalam Perbaikan',
      subtitle: 'Penanganan fisik oleh Dinas PU',
      icon: Wrench,
      state: currentStepIndex > 3 ? 'completed' : currentStepIndex === 3 ? 'current' : 'upcoming',
      timestamp: inProgressHistory?.timestamp || (isInProgress ? report.updatedAt : undefined),
      actor: inProgressHistory?.updatedBy || 'Tim Unit Reaksi Cepat (URC) Dinas',
      notes: inProgressHistory?.notes || report.dinasNotes || (currentStepIndex === 3 ? 'Tim teknis sedang melakukan pengerjaan di lapangan.' : undefined)
    },
    {
      id: 'selesai',
      label: 'Selesai',
      subtitle: 'Perbaikan tuntas & terverifikasi',
      icon: CheckCircle2,
      state: currentStepIndex >= 4 ? 'completed' : 'upcoming',
      timestamp: completedHistory?.timestamp || (isCompleted ? report.updatedAt : undefined),
      actor: completedHistory?.updatedBy || 'Dinas PU & Inspektorat Kota',
      notes: completedHistory?.notes || (isCompleted ? 'Infrastruktur telah selesai diperbaiki dan siap digunakan kembali oleh publik.' : undefined)
    }
  ];

  // Percentage for progress connector line
  const progressPercent =
    currentStepIndex === 4
      ? 100
      : currentStepIndex === 3
      ? 66.6
      : currentStepIndex === 2
      ? 33.3
      : 0;

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* Visual Stepper Bar */}
      <div className="relative py-2 px-1 sm:px-3">
        {/* Background Track Line */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-stone-200 -translate-y-1/2 z-0 rounded-full overflow-hidden">
          {/* Active Colored Fill Line */}
          <div
            className="h-full bg-linear-to-r from-stone-900 via-amber-500 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 4 Step Nodes */}
        <div className="relative z-10 flex items-start justify-between">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isStepCompleted = step.state === 'completed';
            const isStepCurrent = step.state === 'current';

            return (
              <div
                key={step.id}
                className="flex flex-col items-center text-center max-w-[76px] sm:max-w-[110px]"
              >
                {/* Node Circle */}
                <div className="relative mb-2">
                  {/* Current step animated pulse ring */}
                  {isStepCurrent && (
                    <span className="absolute -inset-1.5 rounded-full bg-amber-500/25 animate-ping" />
                  )}

                  <div
                    className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-xs ${
                      isStepCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20'
                        : isStepCurrent
                        ? 'bg-stone-900 border-stone-900 text-amber-400 ring-4 ring-amber-100'
                        : 'bg-white border-stone-300 text-stone-400'
                    }`}
                  >
                    {isStepCompleted ? (
                      <Check className="h-5 w-5 stroke-[2.5px] animate-in zoom-in-50" />
                    ) : (
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isStepCurrent ? 'animate-pulse' : ''}`} />
                    )}
                  </div>

                  {/* Step Number Tag */}
                  <span
                    className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black border ${
                      isStepCompleted
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isStepCurrent
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    {idx + 1}
                  </span>
                </div>

                {/* Step Label */}
                <span
                  className={`text-[11px] sm:text-xs font-bold leading-tight ${
                    isStepCompleted
                      ? 'text-stone-900'
                      : isStepCurrent
                      ? 'text-amber-800 font-extrabold'
                      : 'text-stone-400'
                  }`}
                >
                  {step.label}
                </span>

                {/* State Pill (Desktop) */}
                <span
                  className={`mt-1 hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold leading-none ${
                    isStepCompleted
                      ? 'bg-emerald-50 text-emerald-700'
                      : isStepCurrent
                      ? 'bg-amber-50 text-amber-800 animate-pulse'
                      : 'text-stone-400'
                  }`}
                >
                  {isStepCompleted ? 'Selesai' : isStepCurrent ? 'Diproses' : 'Menunggu'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Detail Cards / Progression Breakdown */}
      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>Rincian Tahapan &amp; Log Transparansi</span>
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : isInProgress
                ? 'bg-amber-100 text-amber-900'
                : 'bg-stone-200 text-stone-800'
            }`}
          >
            Tahap {currentStepIndex} dari 4: {steps[currentStepIndex - 1]?.label}
          </span>
        </div>

        <div className="space-y-2 divide-y divide-stone-200/60 text-xs">
          {steps.map((step) => {
            const isCompletedOrCurrent = step.state === 'completed' || step.state === 'current';
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`pt-2.5 first:pt-0 flex items-start gap-2.5 transition-opacity ${
                  isCompletedOrCurrent ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`mt-0.5 p-1 rounded-lg shrink-0 ${
                    step.state === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : step.state === 'current'
                      ? 'bg-stone-900 text-amber-400'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-stone-800">
                      {step.label}
                    </span>
                    {step.timestamp && (
                      <span className="text-[10px] text-stone-400 font-mono shrink-0">
                        {formatIndonesianDate(step.timestamp)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-500">
                    {step.actor && (
                      <span className="font-medium text-stone-700">{step.actor} • </span>
                    )}
                    {step.subtitle}
                  </p>

                  {step.notes && (
                    <p className="mt-1.5 text-[11px] text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/80 italic">
                      {step.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
