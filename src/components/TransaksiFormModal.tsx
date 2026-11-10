import React, { useState, useEffect, useMemo } from 'react';
import {
  KertasKerjaItem,
  TransaksiSPJ,
  PaymentMethod,
  TaxCategory,
} from '../types';
import { calculateTaxes, TAX_PRESETS } from '../services/taxCalculator';
import { formatIDR, getRealizationForKertasKerjaItem } from '../services/storage';
import {
  X,
  Receipt,
  Calculator,
  AlertCircle,
  Plus,
  MinusCircle,
  Lock,
  Tag,
  Building,
  CheckCircle2
} from 'lucide-react';

interface TransaksiFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  kertasKerjaList: KertasKerjaItem[];
  transaksiList: TransaksiSPJ[];
  editingTrx?: TransaksiSPJ | null;
  defaultKertasKerjaId?: string;
  onSave: (trx: Omit<TransaksiSPJ, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (trx: TransaksiSPJ) => void;
}

interface SPJItemRow {
  id: string;
  kertasKerjaId: string;
  uraian: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  nilaiBruto: number;
}

export const TransaksiFormModal: React.FC<TransaksiFormModalProps> = ({
  isOpen,
  onClose,
  kertasKerjaList,
  transaksiList,
  editingTrx,
  defaultKertasKerjaId,
  onSave,
  onUpdate,
}) => {
  const [jenisTransaksi, setJenisTransaksi] = useState<TransaksiSPJ['jenisTransaksi']>('PENGELUARAN');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [nomorBukti, setNomorBukti] = useState('');

  // Kategori Belanja acuan dari Kertas Kerja
  const [kategoriBelanja, setKategoriBelanja] = useState<
    'MATERIAL' | 'UPAH_TUKANG' | 'HONORARIUM' | 'ADMINISTRASI'
  >('MATERIAL');

  // Daftar baris barang / belanja sejajar
  const [itemRows, setItemRows] = useState<SPJItemRow[]>([
    {
      id: 'item-1',
      kertasKerjaId: '',
      uraian: '',
      kuantitas: 1,
      satuan: 'Unit',
      hargaSatuan: 0,
      nilaiBruto: 0,
    },
  ]);

  // Nominal langsung jika bukan jenis PENGELUARAN (misal Penerimaan Kas / Tarik Tunai)
  const [nominalNonBelanja, setNominalNonBelanja] = useState<number>(0);
  const [uraianNonBelanja, setUraianNonBelanja] = useState<string>('');

  // Pajak
  const [kategoriPajak, setKategoriPajak] = useState<TaxCategory>('MATERIAL_BARANG');
  const [tarifPpnPersen, setTarifPpnPersen] = useState<number>(11);
  const [jenisPph, setJenisPph] = useState<string>('PPh 22');
  const [tarifPphPersen, setTarifPphPersen] = useState<number>(1.5);

  const [metodePembayaran, setMetodePembayaran] = useState<PaymentMethod>('TUNAI');
  const [penerima, setPenerima] = useState('');
  const [alamatPenerima, setAlamatPenerima] = useState('');
  const [npwpPenerima, setNpwpPenerima] = useState('');
  const [catatan, setCatatan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Kertas Kerja yang sesuai dengan Kategori Belanja yang dipilih
  const filteredKertasKerja = useMemo(() => {
    return kertasKerjaList.filter((kk) => kk.kategori === kategoriBelanja);
  }, [kertasKerjaList, kategoriBelanja]);

  // Realisasi per item Kertas Kerja
  const kkRealizationMap = useMemo(() => {
    const map = new Map<
      string,
      {
        realisasiVol: number;
        realisasiRp: number;
        sisaVol: number;
        sisaRp: number;
        persentase: number;
        is100Percent: boolean;
      }
    >();

    kertasKerjaList.forEach((kk) => {
      const { realisasiVolume, realisasiRp } = getRealizationForKertasKerjaItem(
        kk.id,
        transaksiList,
        editingTrx?.id
      );
      const sisaVol = Math.max(0, kk.volumeTarget - realisasiVolume);
      const sisaRp = Math.max(0, kk.totalAnggaran - realisasiRp);
      const persentase =
        kk.totalAnggaran > 0 ? (realisasiRp / kk.totalAnggaran) * 100 : 0;
      const is100Percent =
        persentase >= 100 || (kk.volumeTarget > 0 && realisasiVolume >= kk.volumeTarget);

      map.set(kk.id, {
        realisasiVol: realisasiVolume,
        realisasiRp,
        sisaVol,
        sisaRp,
        persentase: Math.round(persentase * 10) / 10,
        is100Percent,
      });
    });

    return map;
  }, [kertasKerjaList, transaksiList, editingTrx]);

  // Total Nilai Kotor (Bruto) dari seluruh baris
  const totalNilaiBruto = useMemo(() => {
    if (jenisTransaksi !== 'PENGELUARAN') {
      return nominalNonBelanja;
    }
    return itemRows.reduce((acc, row) => acc + (row.nilaiBruto || 0), 0);
  }, [jenisTransaksi, nominalNonBelanja, itemRows]);

  // Perhitungan Pajak Otomatis
  const taxCalculations = useMemo(() => {
    if (jenisTransaksi === 'PENGELUARAN') {
      return calculateTaxes(
        totalNilaiBruto,
        kategoriPajak,
        tarifPpnPersen,
        tarifPphPersen
      );
    }
    return {
      ppnRate: 0,
      pphRate: 0,
      pphType: 'Non-PPh',
      nilaiPpn: 0,
      nilaiPph: 0,
      totalPajak: 0,
      nilaiNetto: totalNilaiBruto,
    };
  }, [totalNilaiBruto, kategoriPajak, tarifPpnPersen, tarifPphPersen, jenisTransaksi]);

  // Auto-switch tax category when Kategori Belanja changes
  const handleKategoriBelanjaChange = (
    cat: 'MATERIAL' | 'UPAH_TUKANG' | 'HONORARIUM' | 'ADMINISTRASI'
  ) => {
    setKategoriBelanja(cat);
    setFormError(null);

    let taxPresetKey: TaxCategory = 'MATERIAL_BARANG';
    if (cat === 'UPAH_TUKANG') taxPresetKey = 'JASA_KONSTRUKSI_TUKANG';
    else if (cat === 'HONORARIUM') taxPresetKey = 'HONORARIUM';
    else taxPresetKey = 'MATERIAL_BARANG';

    setKategoriPajak(taxPresetKey);
    const preset = TAX_PRESETS[taxPresetKey];
    if (preset) {
      setTarifPpnPersen(preset.defaultPpnRate);
      setTarifPphPersen(preset.defaultPphRate);
      setJenisPph(preset.pphType.split(' ')[0] || 'PPh');
    }

    // Reset item rows to pick from the new category
    const matchingItems = kertasKerjaList.filter((kk) => kk.kategori === cat);
    if (matchingItems.length > 0) {
      const first = matchingItems[0];
      const info = kkRealizationMap.get(first.id);
      const is100 = info?.is100Percent || false;
      setItemRows([
        {
          id: `item-${Date.now()}`,
          kertasKerjaId: first.id,
          uraian: first.uraian,
          kuantitas: is100 ? 0 : 1,
          satuan: first.satuan,
          hargaSatuan: first.hargaSatuan,
          nilaiBruto: is100 ? 0 : first.hargaSatuan,
        },
      ]);
    } else {
      setItemRows([
        {
          id: `item-${Date.now()}`,
          kertasKerjaId: '',
          uraian: '',
          kuantitas: 1,
          satuan: 'Unit',
          hargaSatuan: 0,
          nilaiBruto: 0,
        },
      ]);
    }
  };

  // Ubah pilihan Kertas Kerja pada baris tertentu
  const handleSelectKKForRow = (rowIndex: number, kkId: string) => {
    const selected = kertasKerjaList.find((k) => k.id === kkId);
    if (!selected) {
      setItemRows((prev) =>
        prev.map((r, i) =>
          i === rowIndex
            ? {
                ...r,
                kertasKerjaId: '',
                uraian: '',
                satuan: 'Unit',
                hargaSatuan: 0,
                nilaiBruto: 0,
              }
            : r
        )
      );
      return;
    }

    const info = kkRealizationMap.get(selected.id);
    const is100 = info?.is100Percent || false;
    const defaultQty = is100 ? 0 : 1;
    const bruto = defaultQty * selected.hargaSatuan;

    setItemRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              kertasKerjaId: selected.id,
              uraian: selected.uraian,
              satuan: selected.satuan,
              hargaSatuan: selected.hargaSatuan,
              kuantitas: defaultQty,
              nilaiBruto: bruto,
            }
          : r
      )
    );
  };

  // Update kuantitas atau harga satuan pada baris
  const handleUpdateRowValue = (
    rowIndex: number,
    field: 'kuantitas' | 'hargaSatuan' | 'satuan' | 'uraian',
    val: string | number
  ) => {
    const currentRow = itemRows[rowIndex];

    if (field === 'kuantitas') {
      let numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
      const info = currentRow ? kkRealizationMap.get(currentRow.kertasKerjaId) : null;
      const maxAllowed = info ? info.sisaVol : undefined;

      if (maxAllowed !== undefined && numVal > maxAllowed) {
        setFormError(
          `⚠️ Peringatan: Kuantitas melebihi jumlah Maksimal (${maxAllowed} ${currentRow.satuan || ''}). Jumlah otomatis dibatasi maksimal ${maxAllowed} agar tidak melebihi sisa volume pagu!`
        );
        numVal = maxAllowed; // Tidak bisa diketik melebihi batas maksimal
        val = maxAllowed;
      } else {
        setFormError(null);
      }
    }

    setItemRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;
        const updated = { ...r, [field]: val };
        if (field === 'kuantitas' || field === 'hargaSatuan') {
          const q = field === 'kuantitas' ? Number(val) || 0 : r.kuantitas;
          const p = field === 'hargaSatuan' ? Number(val) || 0 : r.hargaSatuan;
          updated.nilaiBruto = Math.round(q * p);
        }
        return updated;
      })
    );
  };

  // Sisip baris baru tepat di samping baris saat ini (Tanda + di samping kolom Nilai Kotor)
  const handleInsertRow = (rowIndex: number) => {
    // Cari item default dari kategori yang sama
    const matchingItems = kertasKerjaList.filter((kk) => kk.kategori === kategoriBelanja);
    const defaultKK = matchingItems[0];
    const info = defaultKK ? kkRealizationMap.get(defaultKK.id) : null;
    const is100 = info?.is100Percent || false;

    const newRow: SPJItemRow = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      kertasKerjaId: defaultKK ? defaultKK.id : '',
      uraian: defaultKK ? defaultKK.uraian : '',
      kuantitas: is100 ? 0 : 1,
      satuan: defaultKK ? defaultKK.satuan : 'Unit',
      hargaSatuan: defaultKK ? defaultKK.hargaSatuan : 0,
      nilaiBruto: is100 ? 0 : defaultKK ? defaultKK.hargaSatuan : 0,
    };

    const updated = [
      ...itemRows.slice(0, rowIndex + 1),
      newRow,
      ...itemRows.slice(rowIndex + 1),
    ];
    setItemRows(updated);
  };

  // Hapus baris jika lebih dari 1
  const handleRemoveRow = (rowIndex: number) => {
    if (itemRows.length <= 1) return;
    setItemRows(itemRows.filter((_, idx) => idx !== rowIndex));
  };

  // Inisialisasi data modal
  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);

    if (editingTrx) {
      setJenisTransaksi(editingTrx.jenisTransaksi);
      setTanggal(editingTrx.tanggal);
      setNomorBukti(editingTrx.nomorBukti);
      setPenerima(editingTrx.penerima);
      setAlamatPenerima(editingTrx.alamatPenerima || '');
      setNpwpPenerima(editingTrx.npwpPenerima || '');
      setCatatan(editingTrx.catatan || '');
      setMetodePembayaran(editingTrx.metodePembayaran);
      setKategoriPajak(editingTrx.kategoriPajak || 'MATERIAL_BARANG');
      setTarifPpnPersen(editingTrx.tarifPpnPersen ?? 11);
      setJenisPph(editingTrx.jenisPph || 'PPh 22');
      setTarifPphPersen(editingTrx.tarifPphPersen ?? 1.5);

      if (editingTrx.kategoriBelanja) {
        setKategoriBelanja(editingTrx.kategoriBelanja);
      }

      if (editingTrx.items && editingTrx.items.length > 0) {
        setItemRows(
          editingTrx.items.map((it) => ({
            id: it.id,
            kertasKerjaId: it.kertasKerjaId || '',
            uraian: it.uraian,
            kuantitas: it.kuantitas,
            satuan: it.satuan,
            hargaSatuan: it.hargaSatuan,
            nilaiBruto: it.nilaiBruto,
          }))
        );
      } else if (editingTrx.jenisTransaksi === 'PENGELUARAN') {
        setItemRows([
          {
            id: `item-${Date.now()}`,
            kertasKerjaId: editingTrx.kertasKerjaId || '',
            uraian: editingTrx.uraian,
            kuantitas: editingTrx.kuantitas || 1,
            satuan: editingTrx.satuan || 'Unit',
            hargaSatuan: editingTrx.hargaSatuan || 0,
            nilaiBruto: editingTrx.nilaiBruto || 0,
          },
        ]);
      } else {
        setNominalNonBelanja(editingTrx.nilaiBruto);
        setUraianNonBelanja(editingTrx.uraian);
      }
    } else {
      // Input Baru
      const currentYear = new Date().getFullYear();
      const nextNum = transaksiList.length + 1;
      setTanggal(new Date().toISOString().split('T')[0]);
      setJenisTransaksi('PENGELUARAN');
      setNomorBukti(`KW-${String(nextNum).padStart(3, '0')}/REVIT/${currentYear}`);
      setPenerima('');
      setAlamatPenerima('');
      setNpwpPenerima('');
      setCatatan('');
      setMetodePembayaran('TUNAI');
      setNominalNonBelanja(0);
      setUraianNonBelanja('');

      // Cek default Kertas Kerja
      let initialCat: 'MATERIAL' | 'UPAH_TUKANG' | 'HONORARIUM' | 'ADMINISTRASI' =
        'MATERIAL';
      let targetKK: KertasKerjaItem | undefined;

      if (defaultKertasKerjaId) {
        targetKK = kertasKerjaList.find((k) => k.id === defaultKertasKerjaId);
        if (targetKK) {
          initialCat = targetKK.kategori;
        }
      } else {
        targetKK = kertasKerjaList.find((k) => k.kategori === 'MATERIAL');
      }

      setKategoriBelanja(initialCat);

      if (targetKK) {
        const info = kkRealizationMap.get(targetKK.id);
        const is100 = info?.is100Percent || false;
        setItemRows([
          {
            id: `item-${Date.now()}`,
            kertasKerjaId: targetKK.id,
            uraian: targetKK.uraian,
            kuantitas: is100 ? 0 : 1,
            satuan: targetKK.satuan,
            hargaSatuan: targetKK.hargaSatuan,
            nilaiBruto: is100 ? 0 : targetKK.hargaSatuan,
          },
        ]);
      } else {
        setItemRows([
          {
            id: `item-${Date.now()}`,
            kertasKerjaId: '',
            uraian: '',
            kuantitas: 1,
            satuan: 'Unit',
            hargaSatuan: 0,
            nilaiBruto: 0,
          },
        ]);
      }
    }
  }, [isOpen, editingTrx, defaultKertasKerjaId]);

  if (!isOpen) return null;

  // Cek apakah ada baris yang melanggar aturan: Realisasi 100% atau Kuantitas melebihi batas Maks
  const hasInvalidQtyRow =
    jenisTransaksi === 'PENGELUARAN' &&
    itemRows.some((row) => {
      const info = kkRealizationMap.get(row.kertasKerjaId);
      if (!info) return false;
      if (info.is100Percent && row.kuantitas > 0) return true;
      if (row.kuantitas > info.sisaVol) return true;
      return false;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (jenisTransaksi === 'PENGELUARAN') {
      if (itemRows.length === 0) {
        setFormError('Tambahkan minimal 1 baris barang / pekerjaan.');
        return;
      }

      // Validasi setiap baris
      for (let i = 0; i < itemRows.length; i++) {
        const row = itemRows[i];
        if (!row.kertasKerjaId && !row.uraian.trim()) {
          setFormError(`Baris ${i + 1}: Mohon pilih atau isi uraian barang/pekerjaan.`);
          return;
        }

        const info = kkRealizationMap.get(row.kertasKerjaId);
        if (info && info.is100Percent) {
          setFormError(
            `Baris ${i + 1} (${row.uraian}): Realisasi sudah mencapai 100%. Kuantitas barang yang akan dibeli tidak dapat ditambah lagi.`
          );
          return;
        }

        if (row.kuantitas <= 0) {
          setFormError(`Baris ${i + 1}: Kuantitas barang harus lebih besar dari 0.`);
          return;
        }

        if (info && row.kuantitas > info.sisaVol) {
          setFormError(
            `Baris ${i + 1} (${row.uraian}): Kuantitas melebihi sisa volume yang tersedia (Sisa: ${info.sisaVol} ${row.satuan}). Maksimal: ${info.sisaVol}.`
          );
          return;
        }

        if (row.hargaSatuan <= 0) {
          setFormError(`Baris ${i + 1}: Harga satuan harus lebih besar dari Rp 0.`);
          return;
        }
      }
    } else {
      if (!uraianNonBelanja.trim()) {
        setFormError('Mohon isi uraian transaksi.');
        return;
      }
      if (nominalNonBelanja <= 0) {
        setFormError('Nominal transaksi harus lebih besar dari Rp 0.');
        return;
      }
    }

    if (!penerima.trim()) {
      setFormError('Mohon isi nama penerima / penyedia / pihak terkait.');
      return;
    }

    // Bangun Uraian gabungan jika belanja
    let combinedUraian = '';
    if (jenisTransaksi === 'PENGELUARAN') {
      if (itemRows.length === 1) {
        combinedUraian = `Pembayaran ${itemRows[0].uraian} (${itemRows[0].kuantitas} ${itemRows[0].satuan})`;
      } else {
        const itemNames = itemRows.map((r) => r.uraian).join(', ');
        combinedUraian = `Pembayaran Belanja: ${itemNames}`;
      }
    } else {
      combinedUraian = uraianNonBelanja;
    }

    const payload: Omit<TransaksiSPJ, 'id' | 'createdAt' | 'updatedAt'> = {
      tanggal,
      nomorBukti: nomorBukti.trim() || `KW-${Date.now()}`,
      uraian: combinedUraian,
      jenisTransaksi,
      kategoriBelanja: jenisTransaksi === 'PENGELUARAN' ? kategoriBelanja : undefined,
      kertasKerjaId:
        jenisTransaksi === 'PENGELUARAN' ? itemRows[0]?.kertasKerjaId : undefined,
      kuantitas: jenisTransaksi === 'PENGELUARAN' ? itemRows[0]?.kuantitas || 1 : 1,
      satuan: jenisTransaksi === 'PENGELUARAN' ? itemRows[0]?.satuan || 'Paket' : 'Transaksi',
      hargaSatuan:
        jenisTransaksi === 'PENGELUARAN' ? itemRows[0]?.hargaSatuan || 0 : totalNilaiBruto,
      nilaiBruto: totalNilaiBruto,
      items:
        jenisTransaksi === 'PENGELUARAN'
          ? itemRows.map((r) => ({
              id: r.id,
              kertasKerjaId: r.kertasKerjaId,
              uraian: r.uraian,
              kuantitas: r.kuantitas,
              satuan: r.satuan,
              hargaSatuan: r.hargaSatuan,
              nilaiBruto: r.nilaiBruto,
            }))
          : undefined,
      kategoriPajak: jenisTransaksi === 'PENGELUARAN' ? kategoriPajak : 'BEBAS_PAJAK',
      tarifPpnPersen: jenisTransaksi === 'PENGELUARAN' ? tarifPpnPersen : 0,
      nilaiPpn: taxCalculations.nilaiPpn,
      jenisPph: jenisTransaksi === 'PENGELUARAN' ? jenisPph : 'Non-PPh',
      tarifPphPersen: jenisTransaksi === 'PENGELUARAN' ? tarifPphPersen : 0,
      nilaiPph: taxCalculations.nilaiPph,
      totalPajak: taxCalculations.totalPajak,
      nilaiNetto: taxCalculations.nilaiNetto,
      metodePembayaran,
      penerima: penerima.trim(),
      alamatPenerima,
      npwpPenerima,
      catatan,
    };

    if (editingTrx) {
      onUpdate({
        ...editingTrx,
        ...payload,
      });
    } else {
      onSave(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl border border-slate-200 my-4 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-100 flex items-center justify-center text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingTrx ? 'Edit Transaksi SPJ / Kas' : 'Input Transaksi SPJ Belanja & Kas'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Terhubung real-time dengan Kertas Kerja RAB & Perhitungan Pajak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{formError}</div>
            </div>
          )}

          {/* Baris 1: Jenis Transaksi, Tanggal, Nomor Bukti */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Jenis Transaksi
              </label>
              <select
                value={jenisTransaksi}
                onChange={(e) =>
                  setJenisTransaksi(
                    e.target.value as TransaksiSPJ['jenisTransaksi']
                  )
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                <option value="PENGELUARAN">Belanja SPJ (Pengeluaran)</option>
                <option value="PENERIMAAN">Penerimaan Kas (Pencairan Bantuan)</option>
                <option value="TARIK_TUNAI">Penarikan Tunai dari Bank ke Kas</option>
                <option value="SETOR_BANK">Setoran Kas ke Rekening Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nomor Bukti / Kuitansi
              </label>
              <input
                type="text"
                required
                value={nomorBukti}
                onChange={(e) => setNomorBukti(e.target.value)}
                placeholder="KW-001/REVIT/2026"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Baris 2: Kategori Belanja Acuan Kertas Kerja (Khusus Belanja SPJ) */}
          {jenisTransaksi === 'PENGELUARAN' && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-blue-900 font-bold flex items-center gap-1.5 text-xs">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  Kategori Belanja Acuan Kertas Kerja:
                </label>
                <span className="text-[11px] text-blue-700">
                  {filteredKertasKerja.length} item pekerjaan tersedia di kategori ini
                </span>
              </div>

              <select
                value={kategoriBelanja}
                onChange={(e) =>
                  handleKategoriBelanjaChange(
                    e.target.value as
                      | 'MATERIAL'
                      | 'UPAH_TUKANG'
                      | 'HONORARIUM'
                      | 'ADMINISTRASI'
                  )
                }
                className="w-full px-3 py-1.5 border border-blue-300 rounded bg-white text-slate-800 font-semibold text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="MATERIAL">Bahan Material Konstruksi</option>
                <option value="UPAH_TUKANG">Upah Tukang & Tenaga Kerja Lapangan</option>
                <option value="HONORARIUM">Honorarium Tim Pelaksana & Pengelola</option>
                <option value="ADMINISTRASI">Administrasi SPJ, Dokumentasi & ATK</option>
              </select>
            </div>
          )}

          {/* Baris 3: TABEL SEJAJAR ITEM BELANJA & TANDA [+] DI SAMPING KOLOM KOTOR (BRUTO) */}
          {jenisTransaksi === 'PENGELUARAN' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Rincian Barang / Pekerjaan (Kolom Sejajar):
                </span>
                <span className="text-[11px] text-slate-500">
                  Klik tanda <strong>+</strong> di samping Nilai Kotor untuk menambah barang/pekerjaan.
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2 px-2 text-center w-8">No</th>
                      <th className="py-2 px-3 min-w-[240px]">
                        Uraian Belanja (Acuan Kertas Kerja) <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2 px-2 w-24 text-center">
                        Kuantitas <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2 px-2 w-20 text-center">Satuan</th>
                      <th className="py-2 px-2 w-28 text-right">
                        Harga Satuan (Rp) <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2 px-3 w-32 text-right">
                        Nilai Kotor (Bruto)
                      </th>
                      <th className="py-2 px-2 text-center w-14 bg-blue-50/70 text-blue-900 font-bold">
                        Tambah [+]
                      </th>
                      {itemRows.length > 1 && (
                        <th className="py-2 px-2 text-center w-8">Hapus</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemRows.map((row, idx) => {
                      const info = kkRealizationMap.get(row.kertasKerjaId);
                      const is100 = info?.is100Percent || false;

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            is100 ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="py-2 px-2 text-center text-slate-500 font-mono">
                            {idx + 1}
                          </td>

                          {/* Uraian Belanja mengambil data dari Kertas Kerja sesuai Kategori Belanja */}
                          <td className="py-2 px-3">
                            <select
                              value={row.kertasKerjaId}
                              onChange={(e) => handleSelectKKForRow(idx, e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 font-medium focus:ring-1 focus:ring-blue-500 truncate"
                            >
                              <option value="">-- Pilih dari Kertas Kerja --</option>
                              {filteredKertasKerja.map((kk) => {
                                const kkInfo = kkRealizationMap.get(kk.id);
                                const kkIs100 = kkInfo?.is100Percent;
                                return (
                                  <option
                                    key={kk.id}
                                    value={kk.id}
                                    className={kkIs100 ? 'text-slate-400 bg-slate-100' : ''}
                                  >
                                    {kkIs100 ? '⛔ [100% HABIS] ' : ''}
                                    [{kk.kodeAkun}] {kk.uraian}
                                    {kkInfo
                                      ? ` (Sisa: ${kkInfo.sisaVol} ${kk.satuan})`
                                      : ''}
                                  </option>
                                );
                              })}
                            </select>

                            {/* Uraian Spesifik / Keterangan Pembelian jika ingin dikustomisasi */}
                            <input
                              type="text"
                              value={row.uraian}
                              onChange={(e) =>
                                handleUpdateRowValue(idx, 'uraian', e.target.value)
                              }
                              placeholder="Keterangan belanja barang..."
                              className="w-full px-2 py-0.5 border border-slate-200 rounded text-[11px] mt-1 text-slate-700"
                            />

                            {/* Peringatan jika 100% */}
                            {is100 && (
                              <div className="text-[10px] text-rose-700 font-medium flex items-center gap-1 mt-0.5">
                                <Lock className="w-3 h-3 shrink-0" />
                                Realisasi sudah 100% (Pagu habis). Kuantitas tidak dapat ditambah.
                              </div>
                            )}
                          </td>

                          {/* Kuantitas / Volume - Dibatasi ketat tidak bisa melebihi Maks */}
                          <td className="py-2 px-2">
                            {(() => {
                              const isExceedingMax = Boolean(info && !is100 && row.kuantitas > info.sisaVol);
                              const isAtMax = Boolean(info && !is100 && row.kuantitas === info.sisaVol && info.sisaVol > 0);

                              return (
                                <div>
                                  <input
                                    type="number"
                                    min="0.01"
                                    max={info && !is100 ? info.sisaVol : undefined}
                                    step="any"
                                    required
                                    disabled={is100}
                                    value={is100 ? 0 : row.kuantitas === 0 ? '' : row.kuantitas}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (raw === '') {
                                        handleUpdateRowValue(idx, 'kuantitas', 0);
                                        return;
                                      }
                                      const entered = parseFloat(raw);
                                      if (isNaN(entered)) {
                                        handleUpdateRowValue(idx, 'kuantitas', 0);
                                        return;
                                      }

                                      const maxAllowed = info ? info.sisaVol : undefined;
                                      if (maxAllowed !== undefined && entered > maxAllowed) {
                                        setFormError(
                                          `⚠️ Peringatan: Kuantitas (${entered}) melebihi jumlah Maksimal (${maxAllowed} ${row.satuan || ''}). Nilai otomatis dibatasi maksimal ${maxAllowed}!`
                                        );
                                        // Tidak bisa diketik melebihi batas maksimal -> set ke maxAllowed
                                        handleUpdateRowValue(idx, 'kuantitas', maxAllowed);
                                      } else {
                                        if (entered < 0) {
                                          handleUpdateRowValue(idx, 'kuantitas', 0);
                                        } else {
                                          handleUpdateRowValue(idx, 'kuantitas', entered);
                                        }
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      // Jika menekan ArrowUp dan sudah di batas maksimal, cegah penambahan
                                      if (e.key === 'ArrowUp' && info && !is100) {
                                        if (row.kuantitas >= info.sisaVol) {
                                          e.preventDefault();
                                          setFormError(
                                            `⚠️ Peringatan: Kuantitas sudah mencapai batas maksimal (${info.sisaVol} ${row.satuan || ''}).`
                                          );
                                        }
                                      }
                                    }}
                                    placeholder={is100 ? '0' : '1'}
                                    className={`w-full px-2 py-1 border rounded font-mono text-right transition-colors ${
                                      is100
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300'
                                        : isExceedingMax
                                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold focus:ring-1 focus:ring-rose-500 animate-pulse'
                                        : isAtMax
                                        ? 'border-amber-400 bg-amber-50/50 text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500'
                                        : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
                                    }`}
                                  />

                                  {/* Info Maks & Peringatan Melebihi Maks */}
                                  {info && !is100 && (
                                    <div className="mt-0.5">
                                      {isExceedingMax ? (
                                        <div
                                          className="text-[10px] text-rose-600 font-bold text-right flex items-center justify-end gap-1 cursor-pointer"
                                          onClick={() => handleUpdateRowValue(idx, 'kuantitas', info.sisaVol)}
                                          title="Klik untuk kembalikan ke batas maksimal"
                                        >
                                          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                          <span>Melebihi Maks ({info.sisaVol})</span>
                                        </div>
                                      ) : isAtMax ? (
                                        <div className="text-[10px] text-amber-700 font-semibold text-right flex items-center justify-end gap-1">
                                          <span>Maks: {info.sisaVol}</span>
                                          <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1 py-0.2 rounded font-medium">
                                            Penuh
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-500 text-right flex items-center justify-end gap-1">
                                          <span>Maks:</span>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateRowValue(idx, 'kuantitas', info.sisaVol)}
                                            className="text-blue-600 font-semibold hover:underline cursor-pointer"
                                            title="Klik untuk mengisi kuantitas maksimal langsung"
                                          >
                                            {info.sisaVol}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {is100 && (
                                    <div className="text-[10px] text-rose-600 font-medium text-right mt-0.5">
                                      Maks: 0 (Habis)
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Satuan */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              required
                              value={row.satuan}
                              onChange={(e) =>
                                handleUpdateRowValue(idx, 'satuan', e.target.value)
                              }
                              placeholder="Zak/OH"
                              className="w-full px-1.5 py-1 border border-slate-300 rounded text-center text-xs"
                            />
                          </td>

                          {/* Harga Satuan */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              required
                              value={row.hargaSatuan || ''}
                              onChange={(e) =>
                                handleUpdateRowValue(
                                  idx,
                                  'hargaSatuan',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-right"
                            />
                          </td>

                          {/* Nilai Kotor (Bruto) */}
                          <td className="py-2 px-3 text-right font-mono font-bold text-blue-900 whitespace-nowrap">
                            {formatIDR(row.nilaiBruto)}
                          </td>

                          {/* TANDA + DI SAMPING KOLOM KOTOR (BRUTO) UNTUK MENAMBAHKAN BARANG / PEKERJAAN */}
                          <td className="py-2 px-2 text-center bg-blue-50/30">
                            <button
                              type="button"
                              onClick={() => handleInsertRow(idx)}
                              className="inline-flex items-center justify-center w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs transition-colors cursor-pointer"
                              title="Tambah / Sisip barang atau pekerjaan baru (+)"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </td>

                          {itemRows.length > 1 && (
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

              {/* Total Nilai Kotor Keseluruhan */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                <span className="text-slate-700 font-semibold text-xs">
                  Total Nilai Kotor (Bruto):
                </span>
                <span className="font-mono font-bold text-sm text-blue-900">
                  {formatIDR(totalNilaiBruto)}
                </span>
              </div>
            </div>
          ) : (
            /* Transaksi Non-Belanja: Penerimaan Kas atau Mutasi Bank */
            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Uraian Lengkap Transaksi
                </label>
                <input
                  type="text"
                  required
                  value={uraianNonBelanja}
                  onChange={(e) => setUraianNonBelanja(e.target.value)}
                  placeholder="Contoh: Penerimaan Penyaluran Dana Bantuan Tahap 1"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nominal Transaksi (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={nominalNonBelanja || ''}
                  onChange={(e) =>
                    setNominalNonBelanja(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Nominal rupiah..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-base font-semibold focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* PERHITUNGAN PAJAK OTOMATIS & MANUAL OVERRIDE */}
          {jenisTransaksi === 'PENGELUARAN' && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  Perhitungan Pajak SPJ (Otomatis & Persentase Manual)
                </span>
                <span className="text-[11px] text-slate-500">
                  Tarif persentase dapat diisi manual
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PPN */}
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700">Pajak PPN</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Tarif:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={tarifPpnPersen}
                        onChange={(e) =>
                          setTarifPpnPersen(parseFloat(e.target.value) || 0)
                        }
                        className="w-14 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-right"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="text-right font-mono font-semibold text-slate-900">
                    {formatIDR(taxCalculations.nilaiPpn)}
                  </div>
                </div>

                {/* PPh */}
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={jenisPph}
                        onChange={(e) => setJenisPph(e.target.value)}
                        className="w-20 px-1 py-0.5 border border-slate-300 rounded font-medium text-[11px]"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Tarif:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={tarifPphPersen}
                        onChange={(e) =>
                          setTarifPphPersen(parseFloat(e.target.value) || 0)
                        }
                        className="w-14 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-right"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="text-right font-mono font-semibold text-slate-900">
                    {formatIDR(taxCalculations.nilaiPph)}
                  </div>
                </div>
              </div>

              {/* Ringkasan Nilai Pajak & Netto */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div className="text-slate-600">
                  Total Potongan Pajak:{' '}
                  <strong className="text-rose-600 font-mono">
                    {formatIDR(taxCalculations.totalPajak)}
                  </strong>
                </div>
                <div className="text-right text-slate-700">
                  Bersih Dibayarkan (Netto):{' '}
                  <strong className="text-emerald-700 font-mono font-bold text-sm">
                    {formatIDR(taxCalculations.nilaiNetto)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Metode Pembayaran & Identitas Penerima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Metode Pembayaran Kas
              </label>
              <select
                value={metodePembayaran}
                onChange={(e) =>
                  setMetodePembayaran(e.target.value as PaymentMethod)
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-800"
              >
                <option value="TUNAI">TUNAI (Buku Pembantu Kas Tunai)</option>
                <option value="BANK">BANK / Transfer (Buku Pembantu Bank)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nama Penerima / Toko / Penyedia <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={penerima}
                onChange={(e) => setPenerima(e.target.value)}
                placeholder="TB. Berkah / Mandor Lapangan / Pihak Ketiga"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                NPWP Penerima (Opsional)
              </label>
              <input
                type="text"
                value={npwpPenerima}
                onChange={(e) => setNpwpPenerima(e.target.value)}
                placeholder="00.000.000.0-000.000"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Alamat / Keterangan Tambahan
              </label>
              <input
                type="text"
                value={alamatPenerima}
                onChange={(e) => setAlamatPenerima(e.target.value)}
                placeholder="Alamat toko atau catatan khusus bukti fisik"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="text-slate-600 text-xs">
              Nilai Bersih SPJ:{' '}
              <strong className="text-emerald-700 font-mono text-sm">
                {formatIDR(taxCalculations.nilaiNetto)}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={hasInvalidQtyRow}
                className={`px-4 py-2 text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer ${
                  hasInvalidQtyRow
                    ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {hasInvalidQtyRow
                  ? 'Terkunci (Melebihi Maks / 100%)'
                  : editingTrx
                  ? 'Perbarui Transaksi SPJ'
                  : 'Simpan Transaksi SPJ'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
