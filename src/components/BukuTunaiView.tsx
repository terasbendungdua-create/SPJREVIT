import React, { useState, useMemo } from 'react';
import { TransaksiSPJ, SchoolProfile } from '../types';
import { formatIDR } from '../services/storage';
import { exportBukuTunaiToExcel } from '../services/excelExport';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Wallet,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  Search,
  CheckSquare,
  Square,
  PlusCircle
} from 'lucide-react';

interface BukuTunaiViewProps {
  transaksi: TransaksiSPJ[];
  profile: SchoolProfile;
  onEditTransaksi: (trx: TransaksiSPJ) => void;
  onDeleteTransaksi: (id: string) => void;
  onBulkDeleteTransaksi: (ids: string[]) => void;
  onOpenAddModal: () => void;
  onOpenPrintModal: (type?: 'BKU' | 'BANK' | 'TUNAI' | 'REKAP') => void;
}

export const BukuTunaiView: React.FC<BukuTunaiViewProps> = ({
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

  // Filter transactions that affect physical Cash
  const tunaiTransaksi = useMemo(() => {
    return transaksi
      .filter((t) => {
        if (t.jenisTransaksi === 'TARIK_TUNAI') {
          return true; // Kas masuk dari penarikan bank
        }
        if (t.jenisTransaksi === 'SETOR_BANK') {
          return true; // Kas keluar disetor ke bank
        }
        if (t.jenisTransaksi === 'PENGELUARAN' && t.metodePembayaran === 'TUNAI') {
          return true; // Belanja tunai
        }
        if (t.jenisTransaksi === 'PENERIMAAN' && t.metodePembayaran === 'TUNAI') {
          return true;
        }
        return false;
      })
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [transaksi]);

  // Compute cash running balance
  const tunaiWithSaldo = useMemo(() => {
    let runningTunai = 0;
    return tunaiTransaksi.map((trx) => {
      let masuk = 0;
      let keluar = 0;

      if (trx.jenisTransaksi === 'TARIK_TUNAI') {
        masuk = trx.nilaiBruto;
        runningTunai += masuk;
      } else if (trx.jenisTransaksi === 'PENERIMAAN' && trx.metodePembayaran === 'TUNAI') {
        masuk = trx.nilaiBruto;
        runningTunai += masuk;
      } else if (trx.jenisTransaksi === 'SETOR_BANK') {
        keluar = trx.nilaiBruto;
        runningTunai -= keluar;
      } else if (trx.jenisTransaksi === 'PENGELUARAN' && trx.metodePembayaran === 'TUNAI') {
        keluar = trx.nilaiBruto;
        runningTunai -= keluar;
      }

      return {
        ...trx,
        masuk,
        keluar,
        saldoTunai: runningTunai,
      };
    });
  }, [tunaiTransaksi]);

  // Filter by search
  const filteredTunai = useMemo(() => {
    return tunaiWithSaldo.filter((t) => {
      return (
        t.uraian.toLowerCase().includes(search.toLowerCase()) ||
        t.nomorBukti.toLowerCase().includes(search.toLowerCase()) ||
        t.penerima.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [tunaiWithSaldo, search]);

  // Multi-select handlers
  const isAllSelected =
    filteredTunai.length > 0 && filteredTunai.every((t) => selectedIds.includes(t.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTunai.map((t) => t.id));
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

  const totalMasuk = filteredTunai.reduce((acc, t) => acc + t.masuk, 0);
  const totalKeluar = filteredTunai.reduce((acc, t) => acc + t.keluar, 0);
  const currentSaldoTunai = filteredTunai[filteredTunai.length - 1]?.saldoTunai || 0;

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Buku Pembantu Kas Fisik</span>
              <span>·</span>
              <span>Brankas Bendahara Sekolah</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Buku Pembantu Kas Tunai
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Mencatat seluruh arus uang tunai untuk pembayaran material, upah tukang harian,
              dan konsumsi secara langsung di lapangan.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => exportBukuTunaiToExcel(transaksi, profile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor Excel
            </button>
            <button
              onClick={() => onOpenPrintModal('TUNAI')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              Cetak Buku Tunai
            </button>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Tambah Transaksi Tunai
            </button>
          </div>
        </div>

        {/* Search & Saldo indicator */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari transaksi kas tunai..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs font-medium text-slate-600 font-mono">
            Posisi Kas Tunai:{' '}
            <strong className="text-emerald-700 text-sm">{formatIDR(currentSaldoTunai)}</strong>
          </div>
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold">{selectedIds.length} transaksi kas dipilih</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">
              Penghapusan cepat dan efisien
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

      {/* Cash Table */}
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
                <th className="py-3 px-3 min-w-[260px]">Uraian Penerimaan / Pengeluaran Tunai</th>
                <th className="py-3 px-3">Penerima / Toko</th>
                <th className="py-3 px-3 text-right">Penerimaan Kas (Rp)</th>
                <th className="py-3 px-3 text-right">Pengeluaran Kas (Rp)</th>
                <th className="py-3 px-3 text-right font-semibold">Saldo Tunai (Rp)</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTunai.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Belum ada transaksi pada Buku Pembantu Kas Tunai.
                  </td>
                </tr>
              ) : (
                filteredTunai.map((trx, idx) => {
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
                          <div className="text-[11px] text-emerald-700">
                            Penerimaan dari penarikan rekening bank
                          </div>
                        )}
                        {trx.kuantitas > 0 && trx.jenisTransaksi === 'PENGELUARAN' && (
                          <div className="text-[11px] text-slate-500">
                            {trx.kuantitas} {trx.satuan} @ {formatIDR(trx.hargaSatuan)}
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
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900 whitespace-nowrap">
                        {formatIDR(trx.saldoTunai)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTransaksi(trx)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit Transaksi Kas Tunai"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTrxToDelete(trx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus Transaksi Kas Tunai"
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
            {filteredTunai.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={6} className="py-3 px-3 text-right">
                    TOTAL MUTASI KAS TUNAI:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">
                    {formatIDR(totalMasuk)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-700">
                    {formatIDR(totalKeluar)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-900 font-bold">
                    {formatIDR(currentSaldoTunai)}
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
        title="Hapus Transaksi Kas Tunai"
        message="Apakah Anda yakin ingin menghapus data pengeluaran/penerimaan kas tunai berikut?"
        itemDescription={
          trxToDelete
            ? `[${trxToDelete.nomorBukti}] ${trxToDelete.uraian} - Nominal: ${formatIDR(trxToDelete.nilaiBruto)}`
            : undefined
        }
        warningNote="Penghapusan akan otomatis memperbarui saldo kas tunai, BKU, dan realisasi anggaran."
        confirmText="Hapus Transaksi"
        onConfirm={executeDeleteSingle}
        onCancel={() => setTrxToDelete(null)}
      />

      {/* In-app Bulk Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteModalOpen}
        title="Hapus Sekaligus Transaksi Kas Tunai"
        message={`Apakah Anda yakin ingin menghapus sekaligus ${selectedIds.length} transaksi kas tunai yang dipilih?`}
        warningNote="Tindakan ini akan menghapus seluruh data kas tunai yang dicentang secara permanen."
        confirmText={`Hapus ${selectedIds.length} Transaksi`}
        onConfirm={executeBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />
    </div>
  );
};
