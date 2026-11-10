import React, { useMemo } from 'react';
import { KertasKerjaItem, TransaksiSPJ, SchoolProfile, DashboardStats } from '../types';
import { formatIDR, getRealizationForKertasKerjaItem } from '../services/storage';
import { exportKertasKerjaToExcel } from '../services/excelExport';
import {
  FileSpreadsheet,
  Printer,
  PieChart,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface RekapAnggaranViewProps {
  kertasKerja: KertasKerjaItem[];
  transaksi: TransaksiSPJ[];
  profile: SchoolProfile;
  stats: DashboardStats;
  onOpenPrintModal: (type?: 'BKU' | 'BANK' | 'TUNAI' | 'REKAP') => void;
}

export const RekapAnggaranView: React.FC<RekapAnggaranViewProps> = ({
  kertasKerja,
  transaksi,
  profile,
  stats,
  onOpenPrintModal,
}) => {
  // Group items by category with sub-totals
  const groupedData = useMemo(() => {
    const categories: Record<
      string,
      {
        label: string;
        items: Array<
          KertasKerjaItem & {
            realisasiVol: number;
            realisasiRp: number;
            sisaRp: number;
            persentase: number;
          }
        >;
        subtotalPagu: number;
        subtotalRealisasi: number;
      }
    > = {
      MATERIAL: {
        label: 'A. Belanja Bahan Material Konstruksi',
        items: [],
        subtotalPagu: 0,
        subtotalRealisasi: 0,
      },
      UPAH_TUKANG: {
        label: 'B. Belanja Upah Tukang & Tenaga Kerja',
        items: [],
        subtotalPagu: 0,
        subtotalRealisasi: 0,
      },
      ALAT_SEWA: {
        label: 'C. Belanja Sewa Peralatan Konstruksi',
        items: [],
        subtotalPagu: 0,
        subtotalRealisasi: 0,
      },
      KONSUMSI: {
        label: 'D. Belanja Konsumsi Kegiatan Lapangan',
        items: [],
        subtotalPagu: 0,
        subtotalRealisasi: 0,
      },
      ADMINISTRASI: {
        label: 'E. Belanja Administrasi, ATK & Dokumentasi SPJ',
        items: [],
        subtotalPagu: 0,
        subtotalRealisasi: 0,
      },
    };

    kertasKerja.forEach((item) => {
      const { realisasiVolume, realisasiRp } = getRealizationForKertasKerjaItem(
        item.id,
        transaksi
      );
      const realisasiVol = realisasiVolume;
      const sisaRp = item.totalAnggaran - realisasiRp;
      const persentase =
        item.totalAnggaran > 0 ? (realisasiRp / item.totalAnggaran) * 100 : 0;

      const groupKey = categories[item.kategori] ? item.kategori : 'MATERIAL';

      categories[groupKey].items.push({
        ...item,
        realisasiVol,
        realisasiRp,
        sisaRp,
        persentase: Math.round(persentase * 10) / 10,
      });

      categories[groupKey].subtotalPagu += item.totalAnggaran;
      categories[groupKey].subtotalRealisasi += realisasiRp;
    });

    return categories;
  }, [kertasKerja, transaksi]);

  const totalPagu = kertasKerja.reduce((acc, i) => acc + i.totalAnggaran, 0);
  const totalRealisasi = transaksi
    .filter((t) => t.jenisTransaksi === 'PENGELUARAN')
    .reduce((acc, t) => acc + t.nilaiBruto, 0);
  const totalSisa = totalPagu - totalRealisasi;
  const overallPercentage =
    totalPagu > 0 ? Math.round((totalRealisasi / totalPagu) * 1000) / 10 : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Laporan Akuntabilitas Presisi</span>
              <span>·</span>
              <span>Evaluasi Kertas Kerja vs Realisasi</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Rekapitulasi Anggaran & Realisasi Belanja
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tabel komparasi presisi antara target pagu pada Kertas Kerja RAB dengan realisasi
              pengeluaran transaksi SPJ lapangan.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => exportKertasKerjaToExcel(kertasKerja, transaksi, profile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor Excel
            </button>
            <button
              onClick={() => onOpenPrintModal('REKAP')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              Cetak Rekapitulasi Presisi
            </button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="text-slate-500 font-medium">Total Pagu Kertas Kerja</div>
            <div className="font-mono font-bold text-base text-slate-900 mt-1">
              {formatIDR(totalPagu)}
            </div>
          </div>
          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded">
            <div className="text-blue-700 font-medium">Total Realisasi Belanja</div>
            <div className="font-mono font-bold text-base text-blue-900 mt-1">
              {formatIDR(totalRealisasi)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded">
            <div className="text-emerald-700 font-medium">Sisa Pagu Anggaran</div>
            <div className="font-mono font-bold text-base text-emerald-900 mt-1">
              {formatIDR(totalSisa)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="text-slate-500 font-medium">% Capaian Realisasi</div>
            <div className="font-mono font-bold text-base text-slate-900 mt-1">
              {overallPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-3 px-2 text-center w-10">No</th>
                <th className="py-3 px-3">Kode Akun</th>
                <th className="py-3 px-3 min-w-[240px]">Uraian Paket Pekerjaan / Belanja</th>
                <th className="py-3 px-3 text-center">Satuan</th>
                <th className="py-3 px-3 text-center">Vol Target</th>
                <th className="py-3 px-3 text-right">Harga Satuan</th>
                <th className="py-3 px-3 text-right">Pagu Anggaran</th>
                <th className="py-3 px-3 text-center">Vol Realisasi</th>
                <th className="py-3 px-3 text-right">Realisasi (Rp)</th>
                <th className="py-3 px-3 text-right">Sisa Anggaran</th>
                <th className="py-3 px-3 text-center">% Realisasi</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedData).map(([key, group], groupIdx) => {
                if (group.items.length === 0) return null;
                const groupSisa = group.subtotalPagu - group.subtotalRealisasi;
                const groupPct =
                  group.subtotalPagu > 0
                    ? ((group.subtotalRealisasi / group.subtotalPagu) * 100).toFixed(1)
                    : '0';

                return (
                  <React.Fragment key={key}>
                    {/* Category Header Row */}
                    <tr className="bg-slate-100/75 font-semibold text-slate-900 border-t border-b border-slate-200">
                      <td colSpan={12} className="py-2.5 px-3">
                        <div className="flex items-center justify-between">
                          <span>{group.label}</span>
                          <span className="font-mono text-slate-600 font-normal">
                            Subtotal Pagu: {formatIDR(group.subtotalPagu)} · Realisasi: {formatIDR(group.subtotalRealisasi)}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Group Items */}
                    {group.items.map((item, itemIdx) => {
                      let statusBadge = (
                        <span className="text-slate-500">Belum Ada</span>
                      );
                      if (item.persentase >= 100) {
                        statusBadge = (
                          <span className="text-emerald-700 font-medium">Lengkap 100%</span>
                        );
                      } else if (item.persentase > 0) {
                        statusBadge = (
                          <span className="text-blue-700 font-medium">Progres ({item.persentase}%)</span>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/75">
                          <td className="py-2 px-2 text-center text-slate-500">
                            {groupIdx + 1}.{itemIdx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {item.kodeAkun}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-medium text-slate-900">{item.uraian}</span>
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600">
                            {item.satuan}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {item.volumeTarget}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {formatIDR(item.hargaSatuan)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                            {formatIDR(item.totalAnggaran)}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-blue-700">
                            {item.realisasiVol}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-blue-800 font-medium">
                            {formatIDR(item.realisasiRp)}
                          </td>
                          <td
                            className={`py-2 px-3 text-right font-mono ${
                              item.sisaRp < 0
                                ? 'text-rose-600 font-bold'
                                : 'text-emerald-700'
                            }`}
                          >
                            {formatIDR(item.sisaRp)}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {item.persentase}%
                          </td>
                          <td className="py-2 px-3 text-center text-[11px]">
                            {statusBadge}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Subtotal Row */}
                    <tr className="bg-slate-50 text-slate-700 font-medium text-[11px]">
                      <td colSpan={6} className="py-2 px-3 text-right italic">
                        Subtotal {group.label.split('.')[1] || group.label}:
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatIDR(group.subtotalPagu)}
                      </td>
                      <td></td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-blue-900">
                        {formatIDR(group.subtotalRealisasi)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-900">
                        {formatIDR(groupSisa)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-semibold">
                        {groupPct}%
                      </td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-400 bg-slate-900 text-white font-semibold">
                <td colSpan={6} className="py-3 px-3 text-right">
                  TOTAL REKAPITULASI KERTAS KERJA:
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatIDR(totalPagu)}
                </td>
                <td></td>
                <td className="py-3 px-3 text-right font-mono text-blue-300">
                  {formatIDR(totalRealisasi)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-300">
                  {formatIDR(totalSisa)}
                </td>
                <td className="py-3 px-3 text-center font-mono">
                  {overallPercentage}%
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
