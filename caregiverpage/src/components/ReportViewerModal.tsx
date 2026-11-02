import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Calendar,
  User,
  Building2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { MedicalReport } from '../types';

interface ReportViewerModalProps {
  report: MedicalReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  useEffect(() => {
    // Reset view controls on report change
    setZoomLevel(100);
    setRotation(0);
    setLoadError(false);
  }, [report?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !report) return null;

  const isPdf = report.fileType.includes('pdf') || report.fileName.toLowerCase().endsWith('.pdf');
  const isImage = report.fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(report.fileName);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'lab_test':
        return { label: 'Lab & Blood Test', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'imaging_scan':
        return { label: 'MRI / Scan Imaging', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'prescription':
        return { label: 'Prescription & Meds', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'doctor_note':
        return { label: 'Clinical Doctor Note', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'discharge_summary':
        return { label: 'Discharge Summary', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'Medical Document', color: 'bg-stone-50 text-stone-700 border-stone-200' };
    }
  };

  const badge = getCategoryBadge(report.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border border-stone-200 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[92vh] max-h-[900px]'
        }`}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#0E1322] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3.5 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E26E65] to-[#E96096] flex items-center justify-center text-white shrink-0 shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black truncate text-white" title={report.title}>
                  {report.title}
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${badge.color} shrink-0`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center space-x-3">
                <span>{report.fileName}</span>
                <span>•</span>
                <span>{formatFileSize(report.fileSize)}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 inline text-slate-400" />
                  <span>{report.reportDate}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Direct Download */}
            <a
              href={report.downloadUrl}
              download={report.fileName}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer border border-white/10 shadow-xs"
              title="Download original file to device"
            >
              <Download className="w-4 h-4 text-[#E86D7C]" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Open in new tab */}
            <a
              href={report.viewUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10"
              title="Open raw file in new browser window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer border border-white/10 ml-1"
              title="Close viewer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        {(report.doctorName || report.hospitalClinic || report.notes) && (
          <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-200 text-xs text-stone-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-4">
              {report.doctorName && (
                <div className="flex items-center space-x-1.5 text-stone-800 font-semibold">
                  <User className="w-3.5 h-3.5 text-[#E86D7C]" />
                  <span>Dr. {report.doctorName.replace(/^dr\.?\s*/i, '')}</span>
                </div>
              )}
              {report.hospitalClinic && (
                <div className="flex items-center space-x-1.5 text-stone-600 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>{report.hospitalClinic}</span>
                </div>
              )}
              {report.notes && (
                <div className="text-stone-500 italic max-w-xl truncate" title={report.notes}>
                  “{report.notes}”
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Patient Vault Record</span>
            </div>
          </div>
        )}

        {/* Controls Toolbar for Images / Documents */}
        {isImage && (
          <div className="px-6 py-2 bg-stone-100/80 border-b border-stone-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer shadow-2xs"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-bold text-stone-600 w-12 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer shadow-2xs"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(100);
                  setRotation(0);
                }}
                className="px-2 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 text-[11px] font-bold cursor-pointer"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5 text-stone-500" />
                <span>Rotate</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Viewer Body */}
        <div className="flex-1 min-h-0 bg-[#1E2538]/5 relative overflow-auto flex items-center justify-center p-2">
          {loadError ? (
            <div className="p-8 text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-stone-800">Preview Unavailable</h4>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                This document format could not be rendered directly in the embedded canvas.
              </p>
              <a
                href={report.downloadUrl}
                download={report.fileName}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#111625] text-white font-bold text-xs hover:bg-[#1A2234]"
              >
                <Download className="w-4 h-4 text-[#E86D7C]" />
                <span>Download Report ({formatFileSize(report.fileSize)})</span>
              </a>
            </div>
          ) : isPdf ? (
            /* PDF In-Modal Viewer */
            <iframe
              src={`${report.viewUrl}#toolbar=1&navpanes=1`}
              title={report.title}
              className="w-full h-full border-none rounded-b-2xl bg-white shadow-inner"
              onError={() => setLoadError(true)}
            />
          ) : isImage ? (
            /* High-Res Image / Scan Viewer with Zoom & Rotation */
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4 custom-scrollbar">
              <img
                src={report.viewUrl}
                alt={report.title}
                onError={() => setLoadError(true)}
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-stone-200 select-none"
              />
            </div>
          ) : (
            /* Other Document / Binary file fallback card */
            <div className="p-8 text-center max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-pink-50 text-[#E86D7C] flex items-center justify-center mx-auto mb-4 border border-pink-100 shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-[#111625]">{report.title}</h4>
              <p className="text-xs text-stone-500 mt-1 mb-5">
                {report.fileName} • {formatFileSize(report.fileSize)}
              </p>
              <a
                href={report.downloadUrl}
                download={report.fileName}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#111625] text-white font-extrabold text-xs hover:bg-[#1A2234] transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-[#E86D7C]" />
                <span>Download Document</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
