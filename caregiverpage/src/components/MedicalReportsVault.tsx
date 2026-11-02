import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  Calendar,
  User,
  Building2,
  Shield,
  RefreshCw,
  Plus,
  AlertTriangle,
  FolderOpen,
  LayoutGrid,
  List
} from 'lucide-react';
import { MedicalReport } from '../types';
import { BACKEND_URL } from '../config/urls';
import { UploadReportModal } from './UploadReportModal';
import { ReportViewerModal } from './ReportViewerModal';

interface MedicalReportsVaultProps {
  patientId: string;
  patientName: string;
  caregiverId: string;
}

export const MedicalReportsVault: React.FC<MedicalReportsVaultProps> = ({
  patientId,
  patientName,
  caregiverId,
}) => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [viewingReport, setViewingReport] = useState<MedicalReport | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch reports from backend
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/caregiver/${encodeURIComponent(caregiverId)}/patient/${encodeURIComponent(patientId)}/reports`
      );
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load patient medical reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchReports();
    }
  }, [patientId, caregiverId]);

  // Handle delete
  const handleDeleteReport = async (reportId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/caregiver/${encodeURIComponent(caregiverId)}/patient/${encodeURIComponent(patientId)}/reports/${encodeURIComponent(reportId)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        setDeletingReportId(null);
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper formatting
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'lab_test':
        return { label: 'Lab & Blood Test', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: '🧪' };
      case 'imaging_scan':
        return { label: 'MRI / Scan Imaging', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: '🧠' };
      case 'prescription':
        return { label: 'Prescription & Meds', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: '💊' };
      case 'doctor_note':
        return { label: 'Doctor Clinical Note', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: '👨‍⚕️' };
      case 'discharge_summary':
        return { label: 'Discharge Summary', color: 'bg-rose-50 text-rose-800 border-rose-200', icon: '📋' };
      default:
        return { label: 'General Record', color: 'bg-stone-100 text-stone-800 border-stone-200', icon: '📁' };
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(query) ||
        r.fileName.toLowerCase().includes(query) ||
        (r.doctorName && r.doctorName.toLowerCase().includes(query)) ||
        (r.hospitalClinic && r.hospitalClinic.toLowerCase().includes(query)) ||
        (r.notes && r.notes.toLowerCase().includes(query))
      );
    });
  }, [reports, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: reports.length,
      lab_test: 0,
      imaging_scan: 0,
      prescription: 0,
      doctor_note: 0,
      discharge_summary: 0,
      other: 0,
    };
    reports.forEach(r => {
      if (counts[r.category] !== undefined) counts[r.category]++;
      else counts.other++;
    });
    return counts;
  }, [reports]);

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Summary Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#111625] via-[#1A2234] to-[#242D42] text-white p-6 sm:p-7 shadow-xl border border-slate-700/50 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#E86D7C]/15 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/10 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-[#E86D7C]" />
              <span>Encrypted Patient Health Repository</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Medical Reports Vault
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Permanently store, organize, inspect, and download <strong className="text-white">{patientName}</strong>'s blood tests, MRI scans, prescriptions, and physician records.
            </p>
          </div>

          {/* Quick Metrics & Upload CTA */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-2xl font-black text-white">
                {reports.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Documents
              </span>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#E26E65] to-[#E96096] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Upload Medical Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, doctor, lab, or notes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm font-semibold text-[#111625] focus:outline-none focus:ring-2 focus:ring-[#E86D7C] placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* View Mode Toggle & Refresh */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-stone-100 border border-stone-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#111625] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#111625] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
            title="Refresh Vault"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#E86D7C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Records', count: categoryCounts.all },
          { id: 'lab_test', label: '🧪 Lab & Blood Tests', count: categoryCounts.lab_test },
          { id: 'imaging_scan', label: '🧠 Scans & MRI', count: categoryCounts.imaging_scan },
          { id: 'prescription', label: '💊 Prescriptions', count: categoryCounts.prescription },
          { id: 'doctor_note', label: '👨‍⚕️ Doctor Notes', count: categoryCounts.doctor_note },
          { id: 'discharge_summary', label: '📋 Discharge Summaries', count: categoryCounts.discharge_summary },
          { id: 'other', label: '📁 Other Records', count: categoryCounts.other },
        ].map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 border ${
                isActive
                  ? 'bg-[#111625] text-white border-[#111625] shadow-xs'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-[#E86D7C] animate-spin mb-3" />
          <h4 className="text-sm font-bold text-stone-700">Loading Medical Vault...</h4>
          <p className="text-xs text-stone-400 mt-1">Retrieving stored reports and diagnostic records</p>
        </div>
      ) : reports.length === 0 ? (
        /* Empty State: No reports yet */
        <div className="clay-card p-10 sm:p-14 text-center max-w-xl mx-auto border-2 border-dashed border-stone-300">
          <div className="w-16 h-16 rounded-3xl bg-pink-100 text-[#E86D7C] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#111625] mb-2">
            No Medical Reports Uploaded Yet
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mb-6 max-w-md mx-auto leading-relaxed">
            Never misplace prescriptions, blood work, or brain scans again. Keep all of <span className="font-bold text-[#111625]">{patientName}</span>'s medical files safely backed up in one place.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#E26E65] to-[#E96096] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Upload First Medical Report</span>
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        /* No Search / Filter match */
        <div className="clay-card p-10 text-center max-w-md mx-auto">
          <Search className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-[#111625]">No Matching Reports Found</h4>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            Try adjusting your search terms or category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const cat = getCategoryDetails(report.category);
            const isPdf = report.fileType.includes('pdf') || report.fileName.toLowerCase().endsWith('.pdf');
            const isImage = report.fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|svg)$/i.test(report.fileName);

            return (
              <div
                key={report.id}
                className="clay-card p-5 flex flex-col justify-between hover:border-pink-300 transition-all hover:shadow-lg group"
              >
                <div>
                  {/* Top card strip */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
                        isPdf
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : isImage
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block truncate ${cat.color}`}>
                          {cat.icon} {cat.label}
                        </span>
                        <div className="text-[11px] text-stone-400 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{report.reportDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => setDeletingReportId(report.id)}
                      className="p-1.5 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-extrabold text-[#111625] leading-snug line-clamp-2 mb-2" title={report.title}>
                    {report.title}
                  </h4>

                  {/* Doctor & Hospital Tags */}
                  {(report.doctorName || report.hospitalClinic) && (
                    <div className="space-y-1 mb-3 text-xs text-stone-600">
                      {report.doctorName && (
                        <div className="flex items-center space-x-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate font-semibold">Dr. {report.doctorName.replace(/^dr\.?\s*/i, '')}</span>
                        </div>
                      )}
                      {report.hospitalClinic && (
                        <div className="flex items-center space-x-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate text-stone-500">{report.hospitalClinic}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes snippet */}
                  {report.notes && (
                    <p className="text-[11px] text-stone-500 italic line-clamp-2 bg-stone-50 p-2 rounded-xl mb-3 border border-stone-150">
                      “{report.notes}”
                    </p>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-stone-400 font-medium">
                    {formatFileSize(report.fileSize)}
                  </span>

                  <div className="flex items-center space-x-2">
                    {/* View Button */}
                    <button
                      onClick={() => setViewingReport(report)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#111625] text-stone-700 hover:text-white font-extrabold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Inspect and preview report"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    {/* Download Button */}
                    <a
                      href={report.downloadUrl}
                      download={report.fileName}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#E26E65] to-[#E96096] text-white font-extrabold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
                      title="Download file to device"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="clay-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Doctor / Facility</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredReports.map((report) => {
                  const cat = getCategoryDetails(report.category);
                  return (
                    <tr key={report.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#111625] max-w-xs">
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-[#E86D7C] shrink-0" />
                          <span className="truncate" title={report.title}>
                            {report.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block ${cat.color}`}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-medium">
                        {report.reportDate}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">
                        {report.doctorName ? `Dr. ${report.doctorName}` : report.hospitalClinic || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-500">
                        {formatFileSize(report.fileSize)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setViewingReport(report)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-[#111625] text-stone-700 hover:text-white transition-colors cursor-pointer"
                            title="View report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={report.downloadUrl}
                            download={report.fileName}
                            className="p-1.5 rounded-lg bg-pink-100 hover:bg-[#E86D7C] text-[#E86D7C] hover:text-white transition-colors cursor-pointer"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setDeletingReportId(report.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        patientId={patientId}
        patientName={patientName}
        caregiverId={caregiverId}
        onUploadSuccess={(newReport) => {
          setReports(prev => [newReport, ...prev]);
        }}
      />

      {/* Full Report Previewer Modal */}
      <ReportViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />

      {/* Delete Confirmation Alert Modal */}
      {deletingReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-[#111625]">Delete Medical Report?</h4>
            <p className="text-xs text-stone-500 mt-1 mb-5">
              This will permanently remove the record from the patient's medical vault and disk storage.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeletingReportId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReport(deletingReportId)}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
