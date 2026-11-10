import React, { useState, useMemo } from 'react';
import { TransaksiSPJ, SchoolProfile } from '../types';
import { formatIDR } from '../services/storage';
import { exportBukuBankToExcel } from '../services/excelExport';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  CreditCard,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  Search,
  CheckSquare,
  Square,
  PlusCircle
} from 'lucide-react';

interface BukuBankViewProps {
  transaksi: TransaksiSPJ[];
  profile: SchoolProfile;
  onEditTransaksi: (trx: TransaksiSPJ) => void;
  onDeleteTransaksi: (id: string) => void;
  onBulkDeleteTransaksi: (ids: string[]) => void;
  onOpenAddModal: () => void;
  onOpenPrintModal: (type?: 'BKU' | 'BANK' | 'TUNAI' | 'REKAP') => void;
}

export const BukuBankView: React.FC<BukuBankViewProps> = ({
  transaksi,
  profile,
  onEditTransaksi,
  onDeleteTransaksi,
  onBulkDeleteTransaksi,
  onOpenAddModal,
  onOpenPrintModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // In-app Delete Confirmation State
  const [trxToDelete, setTrxToDelete] = useState<TransaksiSPJ | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Filter transactions that affect Bank
  const bankTransaksi = useMemo(() => {
    return transaksi
      .filter((t) => {
        if (t.jenisTransaksi === 'PENERIMAAN' || t.jenisTransaksi === 'SETOR_BANK') {
          return true;
        }
        if (t.jenisTransaksi === 'TARIK_TUNAI') {
          return true;
        }
        if (t.jenisTransaksi === 'PENGELUARAN' && t.metodePembayaran === 'BANK') {
          return true;
        }
        return false;
      })
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [transaksi]);

  // Compute bank running balance
  const bankWithSaldo = useMemo(() => {
    let runningBank = 0;
    return bankTransaksi.map((trx) => {
      let masuk = 0;
      let keluar = 0;

      if (trx.jenisTransaksi === 'PENERIMAAN' || trx.jenisTransaksi === 'SETOR_BANK') {
        masuk = trx.nilaiBruto;
        runningBank += masuk;
      } else if (trx.jenisTransaksi === 'TARIK_TUNAI') {
        keluar = trx.nilaiBruto;
        runningBank -= keluar;
      } else if (trx.jenisTransaksi === 'PENGELUARAN' && trx.metodePembayaran === 'BANK') {
        keluar = trx.nilaiBruto;
        runningBank -= keluar;
      }

      return {
        ...trx,
        masuk,
        keluar,
        saldoBank: runningBank,
      };
    });
  }, [bankTransaksi]);

  // Filter by search
  const filteredBank = useMemo(() => {
    return bankWithSaldo.filter((t) => {
      return (
        t.uraian.toLowerCase().includes(search.toLowerCase()) ||
        t.nomorBukti.toLowerCase().includes(search.toLowerCase()) ||
        t.penerima.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [bankWithSaldo, search]);

  // Multi-select handlers
  const isAllSelected =
    filteredBank.length > 0 && filteredBank.every((t) => selectedIds.includes(t.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBank.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const executeDeleteSingle = () => {
    if (trxToDelete) {
      onDeleteTransaksi(trxToDelete.id);
      setSelectedIds((prev) => prev.filter((id) => id !== trxToDelete.id));
      setTrxToDelete(null);
    }
  };

  const executeBulkDelete = () => {
    if (selectedIds.length > 0) {
      onBulkDeleteTransaksi(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const totalMasuk = filteredBank.reduce((acc, t) => acc + t.masuk, 0);
  const totalKeluar = filteredBank.reduce((acc, t) => acc + t.keluar, 0);
  const currentSaldoBank = filteredBank[filteredBank.length - 1]?.saldoBank || 0;

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Buku Pembantu Rekening</span>
              <span>·</span>
              <span>{profile.namaBank}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Buku Pembantu Bank
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Rekening: <strong className="font-mono text-slate-800">{profile.nomorRekening}</strong> · a.n.{' '}
              <strong className="text-slate-800">{profile.namaRekening}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => exportBukuBankToExcel(transaksi, profile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor Excel
            </button>
            <button
              onClick={() => onOpenPrintModal('BANK')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              Cetak Buku Bank
            </button>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Tambah Transaksi Bank
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari transaksi bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs font-medium text-slate-600 font-mono">
            Posisi Saldo Bank:{' '}
            <strong className="text-blue-700 text-sm">{formatIDR(currentSaldoBank)}</strong>
          </div>
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold">{selectedIds.length} transaksi bank dipilih</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">
              Opsi hapus massal untuk pengelolaan data operasional
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Sekaligus ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Bank Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-3 px-3 text-center w-10">
                  <button
                    onClick={handleSelectAll}
                    className="cursor-pointer text-slate-600 hover:text-slate-900"
                    title={isAllSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2 text-center w-10">No</th>
                <th className="py-3 px-3 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-3 whitespace-nowrap">Nomor Bukti</th>
                <th className="py-3 px-3 min-w-[260px]">Uraian Transaksi Bank</th>
                <th className="py-3 px-3">Penyedia / Keterangan</th>
                <th className="py-3 px-3 text-right">Pemasukan Bank (Rp)</th>
                <th className="py-3 px-3 text-right">Pengeluaran Bank (Rp)</th>
                <th className="py-3 px-3 text-right font-semibold">Saldo Bank (Rp)</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBank.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Belum ada transaksi pada Buku Pembantu Bank.
                  </td>
                </tr>
              ) : (
                filteredBank.map((trx, idx) => {
                  const isSelected = selectedIds.includes(trx.id);
                  return (
                    <tr
                      key={trx.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(trx.id)}
                          className="cursor-pointer text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {trx.tanggal}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {trx.nomorBukti}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900">{trx.uraian}</div>
                        {trx.jenisTransaksi === 'TARIK_TUNAI' && (
                          <div className="text-[11px] text-amber-700">
                            Penarikan tunai untuk kas bendahara
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{trx.penerima}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium whitespace-nowrap">
                        {trx.masuk > 0 ? formatIDR(trx.masuk) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-medium whitespace-nowrap">
                        {trx.keluar > 0 ? formatIDR(trx.keluar) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900 whitespace-nowrap">
                        {formatIDR(trx.saldoBank)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTransaksi(trx)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit Transaksi Bank"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTrxToDelete(trx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus Transaksi Bank"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredBank.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={6} className="py-3 px-3 text-right">
                    TOTAL MUTASI BANK:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">
                    {formatIDR(totalMasuk)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-700">
                    {formatIDR(totalKeluar)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-900 font-bold">
                    {formatIDR(currentSaldoBank)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* In-app Single Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={trxToDelete !== null}
        title="Hapus Transaksi Buku Bank"
        message="Apakah Anda yakin ingin menghapus catatan mutasi bank berikut?"
        itemDescription={
          trxToDelete
            ? `[${trxToDelete.nomorBukti}] ${trxToDelete.uraian} - Nominal: ${formatIDR(trxToDelete.nilaiBruto)}`
            : undefined
        }
        warningNote="Penghapusan akan otomatis memperbarui saldo rekening bank, BKU, dan realisasi anggaran."
        confirmText="Hapus Transaksi"
        onConfirm={executeDeleteSingle}
        onCancel={() => setTrxToDelete(null)}
      />

      {/* In-app Bulk Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteModalOpen}
        title="Hapus Sekaligus Transaksi Bank"
        message={`Apakah Anda yakin ingin menghapus sekaligus ${selectedIds.length} transaksi bank yang dipilih?`}
        warningNote="Tindakan ini akan menghapus seluruh mutasi bank yang dicentang secara permanen."
        confirmText={`Hapus ${selectedIds.length} Transaksi`}
        onConfirm={executeBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />
    </div>
  );
};
