/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GeminiChatbot } from './GeminiChatbot';
import {
  Sparkles,
  Database,
  MapPin,
  Camera,
} from 'lucide-react';

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
  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Top info bar — subtle context strip, like Gemini's */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 sm:px-6 py-2.5 shrink-0">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Asisten LaporInfra</span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
              <Database className="h-3 w-3 text-amber-600" />
              Terhubung dengan data kerusakan infrastruktur
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 border border-amber-300 rounded-full px-3 py-1 hover:bg-amber-50 transition-colors"
            >
              <Camera className="h-3 w-3" />
              <span className="hidden sm:inline">Buat Laporan</span>
            </button>
            <button
              onClick={onNavigateToMap}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-100 transition-colors"
            >
              <MapPin className="h-3 w-3" />
              <span className="hidden sm:inline">Peta Radar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat area — takes up all remaining height */}
      <div className="flex-1 min-h-0">
        <GeminiChatbot
          floating={false}
          initialRole="general"
          isOpen={true}
        />
      </div>
    </div>
  );
};
