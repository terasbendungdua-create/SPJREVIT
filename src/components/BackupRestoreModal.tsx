import React, { useState, useRef } from 'react';
import { SchoolProfile, KertasKerjaItem, TransaksiSPJ, ActivityLog } from '../types';
import {
  createBackupData,
  downloadBackupFile,
  restoreBackupData,
  formatIDR,
  AppBackupData,
} from '../services/storage';
import {
  X,
  Database,
  Download,
  Upload,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  FolderArchive,
  Info,
  Layers,
  Receipt,
  Building,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SchoolProfile;
  kertasKerja: KertasKerjaItem[];
  transaksi: TransaksiSPJ[];
  logs: ActivityLog[];
  onDataRestored: (
    newProfile: SchoolProfile,
    newKK: KertasKerjaItem[],
    newTrx: TransaksiSPJ[],
    newLogs: ActivityLog[],
    message: string
  ) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  profile,
  kertasKerja,
  transaksi,
  logs,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'BACKUP' | 'RESTORE'>('BACKUP');
  const [restoreMode, setRestoreMode] = useState<'REPLACE' | 'MERGE'>('REPLACE');
  const [copied, setCopied] = useState(false);

  // Restore state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<AppBackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Generate current backup object
  const currentBackup = createBackupData(profile, kertasKerja, transaksi, logs);

  const handleDownload = () => {
    downloadBackupFile(currentBackup);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentBackup, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setUploadedFile(file);
    setParseError(null);
    setRestoreSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        if (!json || typeof json !== 'object') {
          throw new Error('Berkas tidak berformat JSON yang valid.');
        }

        if (!Array.isArray(json.kertasKerja) && !Array.isArray(json.transaksi)) {
          throw new Error(
            'Berkas bukan cadangan SI-SPJ yang valid (Data Kertas Kerja & Transaksi tidak ditemukan).'
          );
        }

        setParsedBackup(json as AppBackupData);
      } catch (err: unknown) {
        setParsedBackup(null);
        setParseError(
          err instanceof Error
            ? err.message
            : 'Gagal membaca berkas. Pastikan memilih berkas .json yang tepat.'
        );
      }
    };

    reader.onerror = () => {
      setParseError('Terjadi kesalahan saat membaca berkas dari perangkat.');
    };

    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!parsedBackup) return;
    setIsProcessing(true);

    setTimeout(() => {
      const result = restoreBackupData(
        parsedBackup,
        restoreMode,
        profile,
        kertasKerja,
        transaksi,
        logs
      );

      setIsProcessing(false);

      if (result.success) {
        setRestoreSuccessMsg(result.message);
        onDataRestored(
          result.profile,
          result.kertasKerja,
          result.transaksi,
          result.logs,
          result.message
        );
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setParseError(result.message);
      }
    }, 400);
  };

  const handleResetRestoreForm = () => {
    setUploadedFile(null);
    setParsedBackup(null);
    setParseError(null);
    setRestoreSuccessMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Cadangkan & Pulihkan Data (Backup / Restore)
              </h2>
              <p className="text-[11px] text-slate-300">
                Pengamanan berkas database SPJ Revitalisasi Sekolah berbasis berkas JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('BACKUP')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'BACKUP'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-t-md'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Cadangkan Data (Backup)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESTORE')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'RESTORE'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-t-md'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Pulihkan Data (Restore)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {activeTab === 'BACKUP' ? (
            /* TAB BACKUP */
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Simpan Salinan Cadangan Anda Secara Berkala:</strong>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Berkas cadangan (.json) mencakup seluruh Rencana Anggaran Biaya (Kertas Kerja), pembukuan
                    BKU, Buku Bank, Buku Tunai, nomor bukti kuitansi, profil sekolah, dan log riwayat audit.
                    Dapat dipindahkan ke komputer lain atau dipulihkan sewaktu-waktu.
                  </p>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Ringkasan Data yang Akan Dicadangkan:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Profil Lembaga</span>
                    <strong className="text-xs text-slate-800 truncate block mt-0.5">
                      {profile.namaSekolah}
                    </strong>
                    <span className="text-[10px] text-blue-600 font-mono">TA {profile.tahunAnggaran}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Kertas Kerja (RAB)</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5 font-mono">
                      {kertasKerja.length} Paket
                    </strong>
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                      {formatIDR(currentBackup.summary.totalPagu)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Transaksi SPJ (BKU)</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5 font-mono">
                      {transaksi.length} Transaksi
                    </strong>
                    <span className="text-[10px] text-slate-600">Tunai & Bank</span>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Log Riwayat Audit</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5 font-mono">
                      {logs.length} Catatan
                    </strong>
                    <span className="text-[10px] text-slate-600">Terpantau</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Teks JSON Tersalin!' : 'Salin JSON ke Papan Klip'}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Unduh Berkas Cadangan (.JSON)
                </button>
              </div>
            </div>
          ) : (
            /* TAB RESTORE */
            <div className="space-y-4">
              {restoreSuccessMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-900">Pemulihan Berhasil!</h4>
                  <p className="text-xs text-emerald-800">{restoreSuccessMsg}</p>
                </div>
              ) : (
                <>
                  {/* File Upload Zone */}
                  {!parsedBackup ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/30"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <FolderArchive className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">
                        Klik untuk memilih berkas backup JSON, atau seret berkas ke sini
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Format berkas yang didukung: berkas cadangan resmi (*.json)
                      </p>
                    </div>
                  ) : (
                    /* File Loaded Preview */
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileCheck2 className="w-5 h-5 text-emerald-600" />
                          <div>
                            <span className="text-xs font-bold text-emerald-950 block">
                              {uploadedFile?.name || 'Berkas Cadangan Terbaca'}
                            </span>
                            <span className="text-[10px] text-emerald-700">
                              Versi Cadangan: {parsedBackup.version || '1.0'} · Ekspor: {new Date(parsedBackup.exportedAt || '').toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleResetRestoreForm}
                          className="text-xs text-slate-500 hover:text-rose-600 underline cursor-pointer"
                        >
                          Ganti Berkas
                        </button>
                      </div>

                      {/* Detail Preview */}
                      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2 text-xs">
                        <span className="font-bold text-slate-800 block">
                          Pratinjau Data di Dalam Berkas:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">Nama Sekolah</span>
                            <strong className="text-slate-800">{parsedBackup.profile?.namaSekolah || '-'}</strong>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">Tahun Anggaran</span>
                            <strong className="text-slate-800">{parsedBackup.profile?.tahunAnggaran || '-'}</strong>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">Item Kertas Kerja</span>
                            <strong className="text-slate-800">{parsedBackup.kertasKerja?.length || 0} Item</strong>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">Transaksi SPJ (BKU)</span>
                            <strong className="text-slate-800">{parsedBackup.transaksi?.length || 0} Transaksi</strong>
                          </div>
                        </div>
                      </div>

                      {/* Restore Mode Selection */}
                      <div className="space-y-2 pt-1">
                        <label className="text-xs font-bold text-slate-800 block">
                          Pilih Mode Pemulihan Data:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              restoreMode === 'REPLACE'
                                ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="restoreMode"
                              value="REPLACE"
                              checked={restoreMode === 'REPLACE'}
                              onChange={() => setRestoreMode('REPLACE')}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-1.5 font-bold text-blue-950">
                              <span>Timpa Total (Rekomendasi)</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Menghapus data saat ini dan menggantinya persis seperti isi berkas cadangan.
                            </p>
                          </label>

                          <label
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              restoreMode === 'MERGE'
                                ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="restoreMode"
                              value="MERGE"
                              checked={restoreMode === 'MERGE'}
                              onChange={() => setRestoreMode('MERGE')}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span>Gabungkan Data (Merge)</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Menambahkan item baru dari berkas cadangan tanpa menghapus data yang sudah ada saat ini.
                            </p>
                          </label>
                        </div>
                      </div>

                      {/* Warning box */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Perhatian:</strong>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            {restoreMode === 'REPLACE'
                              ? 'Proses timpa total akan mengganti data lokal saat ini. Pastikan berkas yang Anda pilih sudah benar.'
                              : 'Proses penggabungan akan mempertahankan data lama dan menyisipkan data cadangan.'}
                          </p>
                        </div>
                      </div>

                      {/* Execute Restore Button */}
                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleResetRestoreForm}
                          className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handleExecuteRestore}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:bg-slate-400"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Memulihkan Data...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Pulihkan Data Sekarang
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {parseError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Gagal Membaca Berkas:</strong>
                        <p className="text-[11px] text-rose-700 mt-0.5">{parseError}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>SI-SPJ Revitalisasi Sekolah v1.2.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
