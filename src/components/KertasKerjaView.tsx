import React, { useState, useMemo } from 'react';
import { KertasKerjaItem, TransaksiSPJ, SchoolProfile } from '../types';
import { formatIDR, getRealizationForKertasKerjaItem } from '../services/storage';
import { exportKertasKerjaToExcel } from '../services/excelExport';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Search,
  Filter,
  Receipt,
  X,
  CheckSquare,
  Square,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Lock,
  Layers
} from 'lucide-react';

interface KertasKerjaViewProps {
  kertasKerja: KertasKerjaItem[];
  transaksi: TransaksiSPJ[];
  profile: SchoolProfile;
  onAddKertasKerja: (item: Omit<KertasKerjaItem, 'id' | 'createdAt'>) => void;
  onAddMultipleKertasKerja?: (
    items: Array<Omit<KertasKerjaItem, 'id' | 'createdAt'>>,
    insertAfterIndex?: number
  ) => void;
  onEditKertasKerja: (item: KertasKerjaItem) => void;
  onDeleteKertasKerja: (id: string) => void;
  onBulkDeleteKertasKerja: (ids: string[]) => void;
  onQuickAddBelanjaFromKK: (kertasKerjaId: string) => void;
}

interface RowItemInput {
  id: string;
  kodeAkun: string;
  uraian: string;
  satuan: string;
  volumeTarget: number;
  hargaSatuan: number;
}

export const KertasKerjaView: React.FC<KertasKerjaViewProps> = ({
  kertasKerja,
  transaksi,
  profile,
  onAddKertasKerja,
  onAddMultipleKertasKerja,
  onEditKertasKerja,
  onDeleteKertasKerja,
  onBulkDeleteKertasKerja,
  onQuickAddBelanjaFromKK,
}) => {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KertasKerjaItem | null>(null);
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal state for Delete Confirmations
  const [itemToDelete, setItemToDelete] = useState<KertasKerjaItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Form states for multi-row insert/add
  const [sharedKategori, setSharedKategori] = useState<KertasKerjaItem['kategori']>('MATERIAL');
  const [sharedKeterangan, setSharedKeterangan] = useState('');
  const [rowItems, setRowItems] = useState<RowItemInput[]>([
    {
      id: 'row-1',
      kodeAkun: `5.2.02.01.${String(kertasKerja.length + 1).padStart(3, '0')}`,
      uraian: '',
      satuan: 'Zak',
      volumeTarget: 1,
      hargaSatuan: 0,
    },
  ]);

  // Calculate real-time realization per Kertas Kerja item
  const itemWithRealization = useMemo(() => {
    return kertasKerja.map((item, originalIndex) => {
      const { realisasiVolume, realisasiRp, linkedCount } = getRealizationForKertasKerjaItem(
        item.id,
        transaksi
      );
      const sisaRp = item.totalAnggaran - realisasiRp;
      const sisaVolume = Math.max(0, item.volumeTarget - realisasiVolume);
      const persentase =
        item.totalAnggaran > 0 ? (realisasiRp / item.totalAnggaran) * 100 : 0;

      const is100Percent = persentase >= 100 || (item.volumeTarget > 0 && realisasiVolume >= item.volumeTarget);

      return {
        ...item,
        originalIndex,
        realisasiVolume,
        realisasiRp,
        sisaRp,
        sisaVolume,
        persentase: Math.round(persentase * 10) / 10,
        is100Percent,
        linkedCount,
      };
    });
  }, [kertasKerja, transaksi]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return itemWithRealization.filter((item) => {
      const matchSearch =
        item.uraian.toLowerCase().includes(search.toLowerCase()) ||
        item.kodeAkun.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        kategoriFilter === 'ALL' || item.kategori === kategoriFilter;
      return matchSearch && matchCat;
    });
  }, [itemWithRealization, search, kategoriFilter]);

  // Checkbox handlers
  const isAllSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setInsertAfterIndex(undefined);
    setFormError(null);
    setSharedKategori('MATERIAL');
    setSharedKeterangan('');
    setRowItems([
      {
        id: `row-${Date.now()}`,
        kodeAkun: `5.2.02.01.${String(kertasKerja.length + 1).padStart(3, '0')}`,
        uraian: '',
        satuan: 'Zak',
        volumeTarget: 1,
        hargaSatuan: 0,
      },
    ]);
    setIsModalOpen(true);
  };

  // Open modal to insert right after a specific item index
  const handleOpenInsertAfter = (afterIndex: number) => {
    setEditingItem(null);
    setInsertAfterIndex(afterIndex);
    setFormError(null);
    const prevItem = kertasKerja[afterIndex];
    if (prevItem) {
      setSharedKategori(prevItem.kategori);
      setSharedKeterangan(prevItem.keterangan || '');
    }
    setRowItems([
      {
        id: `row-${Date.now()}`,
        kodeAkun: `5.2.02.01.${String(afterIndex + 2).padStart(3, '0')}`,
        uraian: '',
        satuan: prevItem?.satuan || 'Zak',
        volumeTarget: 1,
        hargaSatuan: 0,
      },
    ]);
    setIsModalOpen(true);
  };

  // Open modal for edit single item
  const handleOpenEdit = (item: KertasKerjaItem) => {
    setEditingItem(item);
    setInsertAfterIndex(undefined);
    setFormError(null);
    setSharedKategori(item.kategori);
    setSharedKeterangan(item.keterangan || '');
    setRowItems([
      {
        id: item.id,
        kodeAkun: item.kodeAkun,
        uraian: item.uraian,
        satuan: item.satuan,
        volumeTarget: item.volumeTarget,
        hargaSatuan: item.hargaSatuan,
      },
    ]);
    setIsModalOpen(true);
  };

  // Sisip baris baru tepat di bawah indeks tertentu (Fitur Sisip Baris Uraian)
  const handleInsertRow = (index: number) => {
    const nextCodeNum = kertasKerja.length + rowItems.length + 1;
    const newRow: RowItemInput = {
      id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      kodeAkun: `5.2.02.01.${String(nextCodeNum).padStart(3, '0')}`,
      uraian: '',
      satuan: rowItems[index]?.satuan || 'Zak',
      volumeTarget: 1,
      hargaSatuan: 0,
    };
    const updated = [
      ...rowItems.slice(0, index + 1),
      newRow,
      ...rowItems.slice(index + 1),
    ];
    setRowItems(updated);
  };

  // Hapus baris tertentu jika lebih dari 1 baris
  const handleRemoveRow = (index: number) => {
    if (rowItems.length <= 1) return;
    const updated = rowItems.filter((_, idx) => idx !== index);
    setRowItems(updated);
  };

  // Update nilai kolom pada baris tertentu
  const handleUpdateRowField = <K extends keyof RowItemInput>(
    index: number,
    field: K,
    value: RowItemInput[K]
  ) => {
    setRowItems((prev) =>
      prev.map((r, idx) => (idx === index ? { ...r, [field]: value } : r))
    );
  };

  // Submit Handler
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    for (let i = 0; i < rowItems.length; i++) {
      const row = rowItems[i];
      if (!row.uraian.trim()) {
        setFormError(`Baris ${i + 1}: Uraian pekerjaan / belanja belum diisi.`);
        return;
      }
      if (row.volumeTarget <= 0) {
        setFormError(`Baris ${i + 1}: Volume target harus lebih besar dari 0.`);
        return;
      }
      if (row.hargaSatuan <= 0) {
        setFormError(`Baris ${i + 1}: Harga satuan harus lebih besar dari 0.`);
        return;
      }
    }

    if (editingItem && rowItems.length === 1) {
      const single = rowItems[0];
      onEditKertasKerja({
        ...editingItem,
        kodeAkun: single.kodeAkun,
        uraian: single.uraian,
        kategori: sharedKategori,
        satuan: single.satuan,
        volumeTarget: single.volumeTarget,
        hargaSatuan: single.hargaSatuan,
        totalAnggaran: single.volumeTarget * single.hargaSatuan,
        keterangan: sharedKeterangan,
      });
    } else {
      const formattedItems: Array<Omit<KertasKerjaItem, 'id' | 'createdAt'>> = rowItems.map(
        (r) => ({
          kodeAkun: r.kodeAkun,
          uraian: r.uraian,
          kategori: sharedKategori,
          satuan: r.satuan,
          volumeTarget: r.volumeTarget,
          hargaSatuan: r.hargaSatuan,
          totalAnggaran: r.volumeTarget * r.hargaSatuan,
          keterangan: sharedKeterangan,
        })
      );

      if (onAddMultipleKertasKerja) {
        onAddMultipleKertasKerja(formattedItems, insertAfterIndex);
      } else {
        formattedItems.forEach((item) => onAddKertasKerja(item));
      }
    }

    setIsModalOpen(false);
  };

  // Single Delete Execution
  const executeDeleteSingle = () => {
    if (itemToDelete) {
      onDeleteKertasKerja(itemToDelete.id);
      setSelectedIds((prev) => prev.filter((id) => id !== itemToDelete.id));
      setItemToDelete(null);
    }
  };

  // Bulk Delete Execution
  const executeBulkDelete = () => {
    if (selectedIds.length > 0) {
      onBulkDeleteKertasKerja(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Total summary for modal
  const totalModalPagu = rowItems.reduce(
    (acc, r) => acc + (r.volumeTarget || 0) * (r.hargaSatuan || 0),
    0
  );

  // Summary figures
  const totalPaguFiltered = filteredItems.reduce((acc, i) => acc + i.totalAnggaran, 0);
  const totalRealisasiFiltered = filteredItems.reduce((acc, i) => acc + i.realisasiRp, 0);
  const totalSisaFiltered = totalPaguFiltered - totalRealisasiFiltered;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Rencana Anggaran Biaya (RAB)</span>
              <span>·</span>
              <span>Acuan Transaksi SPJ</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Kertas Kerja Revitalisasi Sekolah
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Setiap pembelanjaan SPJ terhubung langsung ke item kertas kerja ini untuk
              menjamin realisasi anggaran presisi dan terkendali secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => exportKertasKerjaToExcel(kertasKerja, transaksi, profile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor Excel
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah / Sisip Item Kertas Kerja
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari uraian atau kode akun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="MATERIAL">Bahan Material</option>
              <option value="UPAH_TUKANG">Upah Tukang & Pekerja</option>
              <option value="HONORARIUM">Honorarium Tim Pelaksana</option>
              <option value="ADMINISTRASI">Administrasi & SPJ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold">{selectedIds.length} item dipilih</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">
              Opsi penghapusan sekaligus untuk efisiensi data
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

      {/* Main Table */}
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
                <th className="py-3 px-2 w-10 text-center">No</th>
                <th className="py-3 px-3">Kode Akun</th>
                <th className="py-3 px-3 min-w-[200px]">Uraian Pekerjaan / Belanja</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-center">Volume Target</th>
                <th className="py-3 px-3 text-right">Harga Satuan</th>
                <th className="py-3 px-3 text-right">Pagu Anggaran</th>
                <th className="py-3 px-3 text-right">Realisasi (Rp)</th>
                <th className="py-3 px-3 text-right">Sisa Anggaran</th>
                <th className="py-3 px-3 text-center min-w-[100px]">% Realisasi</th>
                <th className="py-3 px-3 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Tidak ada item kertas kerja yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(item.id)}
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
                        {item.kodeAkun}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900">{item.uraian}</div>
                        {item.keterangan && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.keterangan}</div>
                        )}
                        {item.linkedCount > 0 && (
                          <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                            {item.linkedCount} transaksi SPJ terhubung
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {item.kategori.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-slate-700">
                        {item.volumeTarget} {item.satuan}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-slate-700">
                        {formatIDR(item.hargaSatuan)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {formatIDR(item.totalAnggaran)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-blue-800 whitespace-nowrap">
                        {formatIDR(item.realisasiRp)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-medium whitespace-nowrap ${
                          item.sisaRp < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'
                        }`}
                      >
                        {formatIDR(item.sisaRp)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  item.persentase >= 100
                                    ? 'bg-emerald-600'
                                    : item.persentase > 0
                                    ? 'bg-blue-600'
                                    : 'bg-slate-300'
                                }`}
                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`font-mono text-[11px] font-semibold ${
                                item.is100Percent ? 'text-emerald-700' : 'text-slate-700'
                              }`}
                            >
                              {item.persentase}%
                            </span>
                          </div>
                          {item.is100Percent && (
                            <span className="text-[10px] text-emerald-800 font-medium">
                              Selesai 100%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick SPJ purchase button - LOCKED if realization is 100% */}
                          {item.is100Percent ? (
                            <span
                              className="p-1.5 text-slate-400 bg-slate-100 rounded cursor-not-allowed inline-flex items-center"
                              title="Realisasi sudah 100% - Pagu barang/bahan telah habis, tidak dapat menambah kuantitas lagi."
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            </span>
                          ) : (
                            <button
                              onClick={() => onQuickAddBelanjaFromKK(item.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Buat Belanja SPJ dari item ini"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Tombol Sisip Baris Tepat di Bawah Item Ini */}
                          <button
                            onClick={() => handleOpenInsertAfter(item.originalIndex)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Sisip uraian pekerjaan / bahan di bawah baris ini"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit Kertas Kerja"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus Kertas Kerja"
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
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={7} className="py-3 px-3 text-right">
                    TOTAL KERTAS KERJA:
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatIDR(totalPaguFiltered)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-800">
                    {formatIDR(totalRealisasiFiltered)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800">
                    {formatIDR(totalSisaFiltered)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {totalPaguFiltered > 0
                      ? `${((totalRealisasiFiltered / totalPaguFiltered) * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH & SISIP ITEM KERTAS KERJA DENGAN KOLOM SEJAJAR & TOMBOL + SISIP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl border border-slate-200 my-6 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/75 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingItem
                    ? 'Edit Item Kertas Kerja'
                    : insertAfterIndex !== undefined
                    ? `Sisip Uraian Pekerjaan / Bahan (Setelah Baris ke-${insertAfterIndex + 1})`
                    : 'Tambah & Sisip Uraian Pekerjaan / Bahan (Kertas Kerja RAB)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Shared Category and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Kategori Belanja
                  </label>
                  <select
                    value={sharedKategori}
                    onChange={(e) =>
                      setSharedKategori(
                        e.target.value as KertasKerjaItem['kategori']
                      )
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="MATERIAL">Bahan Material Konstruksi</option>
                    <option value="UPAH_TUKANG">Upah Tukang & Tenaga Kerja</option>
                    <option value="HONORARIUM">Honorarium Tim Pelaksana & Pengelola</option>
                    <option value="ADMINISTRASI">Administrasi SPJ & ATK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Keterangan / Spesifikasi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={sharedKeterangan}
                    onChange={(e) => setSharedKeterangan(e.target.value)}
                    placeholder="Contoh: SNI / Merk / Lokasi Pekerjaan Ruang Kelas"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* KOLOM SEJAJAR: Uraian Pekerjaan / Belanja, Satuan, Volume Target, Harga Satuan, dan Tombol [+] Sisip */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Daftar Baris Uraian (Kolom Sejajar dengan Fitur Sisip Baris [+]):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Klik tanda <strong>+</strong> di samping Harga Satuan untuk menyisipkan baris pekerjaan baru.
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                        <th className="py-2.5 px-2 text-center w-8">No</th>
                        <th className="py-2.5 px-2 w-28">Kode Akun</th>
                        <th className="py-2.5 px-3 min-w-[220px]">
                          Uraian Pekerjaan / Belanja <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 w-20 text-center">
                          Satuan <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 w-24 text-center">
                          Volume Target <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 w-32 text-right">
                          Harga Satuan (Rp) <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 text-center w-16 bg-blue-50/50 text-blue-900 font-bold">
                          Sisip [+]
                        </th>
                        <th className="py-2.5 px-3 text-right w-28">Subtotal (Rp)</th>
                        {rowItems.length > 1 && !editingItem && (
                          <th className="py-2.5 px-2 text-center w-10">Hapus</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rowItems.map((row, idx) => {
                        const subtotal = (row.volumeTarget || 0) * (row.hargaSatuan || 0);
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-2 text-center text-slate-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                required
                                value={row.kodeAkun}
                                onChange={(e) =>
                                  handleUpdateRowField(idx, 'kodeAkun', e.target.value)
                                }
                                placeholder="5.2.02..."
                                className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                required
                                value={row.uraian}
                                onChange={(e) =>
                                  handleUpdateRowField(idx, 'uraian', e.target.value)
                                }
                                placeholder="Contoh: Semen Portland 50 kg / Kusen Jendela"
                                className="w-full px-2.5 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                required
                                value={row.satuan}
                                onChange={(e) =>
                                  handleUpdateRowField(idx, 'satuan', e.target.value)
                                }
                                placeholder="Zak/m3/OH"
                                className="w-full px-2 py-1 border border-slate-300 rounded text-center text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={row.volumeTarget || ''}
                                onChange={(e) =>
                                  handleUpdateRowField(
                                    idx,
                                    'volumeTarget',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-right"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="1"
                                step="any"
                                required
                                value={row.hargaSatuan || ''}
                                onChange={(e) =>
                                  handleUpdateRowField(
                                    idx,
                                    'hargaSatuan',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-right font-medium"
                              />
                            </td>
                            {/* FITUR SISIP: Tanda + tepat di samping kolom harga satuan */}
                            <td className="py-2 px-2 text-center bg-blue-50/30">
                              <button
                                type="button"
                                onClick={() => handleInsertRow(idx)}
                                className="inline-flex items-center justify-center w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs transition-colors cursor-pointer"
                                title="Sisip baris uraian pekerjaan / bahan tepat di bawah ini (+)"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-blue-900 whitespace-nowrap">
                              {formatIDR(subtotal)}
                            </td>
                            {rowItems.length > 1 && !editingItem && (
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Hapus baris ini"
                                >
                                  <MinusCircle className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Pagu Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 font-semibold">Total Pagu Diinput:</span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({rowItems.length} uraian pekerjaan/bahan)
                  </span>
                </div>
                <span className="font-mono font-bold text-base text-blue-700">
                  {formatIDR(totalModalPagu)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition-colors cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : `Simpan ${rowItems.length} Item ke Kertas Kerja`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-app Single Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={itemToDelete !== null}
        title="Hapus Item Kertas Kerja"
        message="Apakah Anda yakin ingin menghapus item kertas kerja berikut dari Rencana Anggaran Biaya (RAB)?"
        itemDescription={
          itemToDelete
            ? `[${itemToDelete.kodeAkun}] ${itemToDelete.uraian} - Pagu: ${formatIDR(itemToDelete.totalAnggaran)}`
            : undefined
        }
        warningNote={
          itemToDelete &&
          transaksi.some((t) => t.kertasKerjaId === itemToDelete.id)
            ? 'PERHATIAN: Terdapat transaksi SPJ yang sedang terhubung ke item ini. Penghapusan akan memutuskan relasi data SPJ.'
            : undefined
        }
        confirmText="Hapus Item"
        onConfirm={executeDeleteSingle}
        onCancel={() => setItemToDelete(null)}
      />

      {/* In-app Bulk Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteModalOpen}
        title="Hapus Sekaligus Item Kertas Kerja"
        message={`Apakah Anda yakin ingin menghapus sekaligus ${selectedIds.length} item kertas kerja terpilih?`}
        warningNote="Tindakan ini akan menghapus seluruh item yang dicentang secara permanen dan memperbarui realisasi data."
        confirmText={`Hapus ${selectedIds.length} Item`}
        onConfirm={executeBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />
    </div>
  );
};
