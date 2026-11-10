import React, { useState, useMemo } from 'react';
import { ActivityLog, SchoolProfile } from '../types';
import { formatIDR, formatDateIndo } from '../services/storage';
import { exportActivityLogToExcel } from '../services/excelExport';
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  Clock,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  profile: SchoolProfile;
  onClearLogs?: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  logs,
  profile,
}) => {
  const [search, setSearch] = useState('');
  const [filterModul, setFilterModul] = useState<string>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
        log.operator.toLowerCase().includes(search.toLowerCase());
      const matchModul = filterModul === 'ALL' || log.modul === filterModul;
      const matchAction = filterAction === 'ALL' || log.action === filterAction;
      return matchSearch && matchModul && matchAction;
    });
  }, [logs, search, filterModul, filterAction]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Audit Trail & Integritas Data</span>
              <span>·</span>
              <span>Pengawasan SPJ Sekolah</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Log Aktivitas Pengguna
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Merekam setiap penambahan, pengubahan, dan penghapusan data secara kronologis
              untuk keperluan pemeriksaan auditor, inspektorat, dan BPK.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => exportActivityLogToExcel(logs, profile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor Log Excel
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari deskripsi perubahan data atau operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterModul}
              onChange={(e) => setFilterModul(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Modul</option>
              <option value="KERTAS_KERJA">Kertas Kerja (RAB)</option>
              <option value="BKU">Buku Kas Umum (BKU)</option>
              <option value="BUKU_BANK">Buku Pembantu Bank</option>
              <option value="BUKU_TUNAI">Buku Kas Tunai</option>
              <option value="PENGATURAN">Pengaturan</option>
            </select>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="TAMBAH">Tambah Data</option>
              <option value="EDIT">Ubah / Edit Data</option>
              <option value="HAPUS">Hapus Data</option>
              <option value="HAPUS_MASSAL">Hapus Massal</option>
              <option value="RESET">Reset Data</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 whitespace-nowrap">Waktu Kejadian</th>
                <th className="py-3 px-3 whitespace-nowrap">Operator</th>
                <th className="py-3 px-3">Tindakan</th>
                <th className="py-3 px-3">Modul</th>
                <th className="py-3 px-3 min-w-[280px]">Deskripsi Riwayat Aktivitas</th>
                <th className="py-3 px-3 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada log aktivitas yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  let actionColor = 'text-slate-700';
                  if (log.action === 'TAMBAH') actionColor = 'text-blue-700 font-semibold';
                  if (log.action === 'EDIT') actionColor = 'text-amber-700 font-semibold';
                  if (log.action === 'HAPUS' || log.action === 'HAPUS_MASSAL')
                    actionColor = 'text-rose-700 font-semibold';
                  if (log.action === 'RESET') actionColor = 'text-purple-700 font-semibold';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/75">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                        {log.operator}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={actionColor}>{log.action.replace('_', ' ')}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {log.modul.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900">{log.deskripsi}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {log.nominal ? formatIDR(log.nominal) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
