import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCheck,
  AlertCircle,
  Calendar,
  User,
  Building2,
  Tag,
  FileUp,
  Trash2
} from 'lucide-react';
import { MedicalReport, MedicalReportCategory } from '../types';
import { BACKEND_URL } from '../config/urls';

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  caregiverId: string;
  onUploadSuccess: (report: MedicalReport) => void;
}

export const UploadReportModal: React.FC<UploadReportModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  caregiverId,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalReportCategory>('lab_test');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [hospitalClinic, setHospitalClinic] = useState('');
  const [notes, setNotes] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setError(null);
    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB safety limit. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      // Auto-populate clean title from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Guess category from filename
    const lower = file.name.toLowerCase();
    if (lower.includes('mri') || lower.includes('ct') || lower.includes('scan') || lower.includes('xray')) {
      setCategory('imaging_scan');
    } else if (lower.includes('rx') || lower.includes('prescrip') || lower.includes('med')) {
      setCategory('prescription');
    } else if (lower.includes('blood') || lower.includes('lab') || lower.includes('test') || lower.includes('cbc')) {
      setCategory('lab_test');
    } else if (lower.includes('doctor') || lower.includes('consult') || lower.includes('note')) {
      setCategory('doctor_note');
    } else if (lower.includes('discharge') || lower.includes('summary')) {
      setCategory('discharge_summary');
    }

    // Convert file to base64 for reliable transmission
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileBase64(e.target?.result as string || '');
    };
    reader.onerror = () => {
      setError('Failed to read file from disk. Please try selecting again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a report file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for this report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        category,
        reportDate,
        doctorName: doctorName.trim() || undefined,
        hospitalClinic: hospitalClinic.trim() || undefined,
        notes: notes.trim() || undefined,
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'application/pdf',
        fileBase64,
      };

      const res = await fetch(
        `${BACKEND_URL}/api/caregiver/${encodeURIComponent(caregiverId)}/patient/${encodeURIComponent(patientId)}/reports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.report) {
        onUploadSuccess(data.report);
      }
      onClose();
    } catch (err: any) {
      console.error('Error uploading report:', err);
      setError(err.message || 'Failed to upload medical report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#0E1322] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E26E65] to-[#E96096] flex items-center justify-center text-white shrink-0 shadow-md">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Store Medical Report
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Securing record for <span className="text-[#E86D7C] font-bold">{patientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Document / Image File <span className="text-rose-500">*</span>
            </label>

            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#E86D7C] bg-pink-50/50 scale-[0.99]'
                    : 'border-stone-300 hover:border-pink-400 hover:bg-stone-50/80 bg-stone-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-pink-100 text-[#E86D7C] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-black text-[#111625]">
                  Click or drag medical report here
                </h4>
                <p className="text-xs text-stone-500 mt-1 font-medium">
                  Supports PDF documents, MRI/CT scans, paper photos (PNG, JPG), prescriptions (up to 25MB)
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-pink-100 text-[#E86D7C] flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111625] truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Document'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileBase64('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Report Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Report Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Brain MRI T1/T2 Axial Scan or Complete Blood Count (CBC)"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold text-[#111625] focus:outline-none focus:ring-2 focus:ring-[#E86D7C] bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MedicalReportCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold text-[#111625] focus:outline-none focus:ring-2 focus:ring-[#E86D7C] bg-white cursor-pointer shadow-2xs"
              >
                <option value="lab_test">🧪 Lab & Blood Tests</option>
                <option value="imaging_scan">🧠 MRI / CT / Scan Imaging</option>
                <option value="prescription">💊 Prescription & Medications</option>
                <option value="doctor_note">👨‍⚕️ Clinical Doctor Notes</option>
                <option value="discharge_summary">📋 Discharge / Hospital Summary</option>
                <option value="other">📁 Other Medical Record</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Test / Visit Date</span>
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold text-[#111625] focus:outline-none focus:ring-2 focus:ring-[#E86D7C] bg-white cursor-pointer shadow-2xs"
              />
            </div>
          </div>

          {/* Doctor & Hospital Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>Doctor / Specialist (Optional)</span>
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Aris Thorne (Neurology)"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-[#111625] focus:outline-none focus:ring-2 focus:ring-[#E86D7C] bg-white shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                <span>Hospital / Diagnostic Lab (Optional)</span>
              </label>
              <input
                type="text"
                value={hospitalClinic}
                onChange={(e) => setHospitalClinic(e.target.value)}
                placeholder="e.g. Apex Neurology Centre"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-[#111625] focus:outline-none focus:ring-2 focus:ring-[#E86D7C] bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Notes / Clinical Highlights */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Clinical Notes & Important Instructions (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Follow-up appointment in 3 months; monitor sodium levels weekly."
              className="w-full px-4 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium text-[#111625] focus:outline-none focus:ring-2 focus:ring-[#E86D7C] bg-white shadow-2xs resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E26E65] to-[#E96096] text-white font-extrabold text-xs shadow-md shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Safely Storing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Save to Patient Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
