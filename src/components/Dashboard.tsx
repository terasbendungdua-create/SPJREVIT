import React, { useMemo } from 'react';
import {
  DashboardStats,
  KertasKerjaItem,
  TransaksiSPJ,
  SchoolProfile,
} from '../types';
import { formatIDR, formatDateIndo } from '../services/storage';
import {
  Coins,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  Layers,
  Receipt,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
  profile: SchoolProfile;
  kertasKerja: KertasKerjaItem[];
  transaksi: TransaksiSPJ[];
  onNavigateTab: (tab: string) => void;
  onOpenAddTrx: () => void;
  onOpenKertasKerjaAdd: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  profile,
  kertasKerja,
  transaksi,
  onNavigateTab,
  onOpenAddTrx,
  onOpenKertasKerjaAdd,
}) => {
  // Category breakdown calculation
  const categoryStats = useMemo(() => {
    const cats: Record<string, { label: string; pagu: number; realisasi: number }> = {
      MATERIAL: { label: 'Bahan Material Konstruksi', pagu: 0, realisasi: 0 },
      UPAH_TUKANG: { label: 'Upah Tukang & Pekerja', pagu: 0, realisasi: 0 },
      ALAT_SEWA: { label: 'Sewa Alat & Perancah', pagu: 0, realisasi: 0 },
      KONSUMSI: { label: 'Konsumsi Tim & Pekerja', pagu: 0, realisasi: 0 },
      ADMINISTRASI: { label: 'Administrasi & SPJ', pagu: 0, realisasi: 0 },
    };

    kertasKerja.forEach((item) => {
      if (cats[item.kategori]) {
        cats[item.kategori].pagu += item.totalAnggaran;
      }
    });

    transaksi
      .filter((t) => t.jenisTransaksi === 'PENGELUARAN')
      .forEach((t) => {
        if (t.items && t.items.length > 0) {
          t.items.forEach((sub) => {
            const item = kertasKerja.find((k) => k.id === sub.kertasKerjaId);
            if (item && cats[item.kategori]) {
              cats[item.kategori].realisasi += sub.nilaiBruto;
            }
          });
        } else if (t.kertasKerjaId) {
          const item = kertasKerja.find((k) => k.id === t.kertasKerjaId);
          if (item && cats[item.kategori]) {
            cats[item.kategori].realisasi += t.nilaiBruto;
          }
        }
      });

    return Object.entries(cats).map(([key, data]) => {
      const percentage = data.pagu > 0 ? (data.realisasi / data.pagu) * 100 : 0;
      return {
        key,
        ...data,
        percentage: Math.min(100, Math.round(percentage * 10) / 10),
        sisa: data.pagu - data.realisasi,
      };
    });
  }, [kertasKerja, transaksi]);

  // Daily balance monitoring calculation
  const dailyBalances = useMemo(() => {
    // Group transactions by date
    const dateMap = new Map<
      string,
      {
        tanggal: string;
        penerimaan: number;
        pengeluaran: number;
        trxCount: number;
        catatanList: string[];
      }
    >();

    const sortedTrx = [...transaksi].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    sortedTrx.forEach((trx) => {
      const dateKey = trx.tanggal;
      const existing = dateMap.get(dateKey) || {
        tanggal: dateKey,
        penerimaan: 0,
        pengeluaran: 0,
        trxCount: 0,
        catatanList: [],
      };

      if (trx.jenisTransaksi === 'PENERIMAAN') {
        existing.penerimaan += trx.nilaiBruto;
      } else if (trx.jenisTransaksi === 'PENGELUARAN') {
        existing.pengeluaran += trx.nilaiBruto;
      }
      existing.trxCount += 1;
      existing.catatanList.push(trx.uraian);
      dateMap.set(dateKey, existing);
    });

    let running = 0;
    const result: Array<{
      tanggal: string;
      penerimaan: number;
      pengeluaran: number;
      saldoAkhirHari: number;
      trxCount: number;
      catatanList: string[];
    }> = [];

    Array.from(dateMap.values()).forEach((day) => {
      running = running + day.penerimaan - day.pengeluaran;
      result.push({
        ...day,
        saldoAkhirHari: running,
      });
    });

    // reverse for timeline display (latest first)
    return result.reverse().slice(0, 7);
  }, [transaksi]);

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return [...transaksi]
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      .slice(0, 5);
  }, [transaksi]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{profile.namaSekolah}</span>
              <span>·</span>
              <span>NPSN: {profile.npsn}</span>
              <span>·</span>
              <span>SK: {profile.nomorSK}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Dasbor Pemantauan Dana Revitalisasi Sekolah
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Pantau arus kas harian, realisasi fisik dan belanja dari kertas kerja RAB,
              serta pemungutan dan penyetoran pajak SPJ secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenKertasKerjaAdd}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              + Tambah Kertas Kerja
            </button>
            <button
              onClick={onOpenAddTrx}
              className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              + Buat Belanja SPJ
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Kas Total */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Total Saldo Kas (BKU)</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatIDR(stats.saldoTotalKas)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Bank + Tunai</span>
            <span className="font-medium text-emerald-600">Arus Kas Aktif</span>
          </div>
        </div>

        {/* Card 2: Saldo Bank */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Saldo Rekening Bank</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-900 tracking-tight">
            {formatIDR(stats.saldoBank)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 truncate">
            <span className="truncate">{profile.namaBank}</span>
            <button
              onClick={() => onNavigateTab('buku-bank')}
              className="text-blue-600 hover:underline shrink-0 text-xs cursor-pointer ml-1"
            >
              Buku Bank →
            </button>
          </div>
        </div>

        {/* Card 3: Saldo Kas Tunai */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Saldo Kas Tunai (Brankas)</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-900 tracking-tight">
            {formatIDR(stats.saldoTunai)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Kas fisik di Bendahara</span>
            <button
              onClick={() => onNavigateTab('buku-tunai')}
              className="text-emerald-600 hover:underline shrink-0 text-xs cursor-pointer"
            >
              Buku Tunai →
            </button>
          </div>
        </div>

        {/* Card 4: Realisasi vs Pagu */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Progres Realisasi Anggaran</span>
            <span className="font-mono font-semibold text-slate-900">
              {stats.persentaseRealisasi}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatIDR(stats.totalRealisasiBelanja)}
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.persentaseRealisasi, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
              <span>Pagu: {formatIDR(stats.totalPaguAnggaran)}</span>
              <span>Sisa: {formatIDR(stats.sisaAnggaran)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Pemantauan Saldo Harian & Realisasi per Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Balance Monitor (Pemantauan Saldo Harian) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Pemantauan Saldo Harian Kas Revitalisasi
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Histori mutasi dan posisi saldo kas kumulatif harian (7 hari aktivitas terakhir)
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('bku')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Lihat Seluruh BKU →
            </button>
          </div>

          {dailyBalances.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Belum ada riwayat mutasi transaksi harian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-medium">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3 text-right">Penerimaan</th>
                    <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                    <th className="py-2.5 px-3 text-right">Saldo Kas Akhir</th>
                    <th className="py-2.5 px-3 text-center">Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyBalances.map((day) => (
                    <tr key={day.tanggal} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        {formatDateIndo(day.tanggal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 whitespace-nowrap">
                        {day.penerimaan > 0 ? `+${formatIDR(day.penerimaan)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 whitespace-nowrap">
                        {day.pengeluaran > 0 ? `-${formatIDR(day.pengeluaran)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatIDR(day.saldoAkhirHari)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        <span className="text-[11px] text-slate-600">
                          {day.trxCount} transaksi
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick tax summary note */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Receipt className="w-4 h-4 text-slate-500" />
              <span>
                Total Pajak Terpotong: <strong>{formatIDR(stats.totalPajakDipungut)}</strong>
                {' '}(PPN: {formatIDR(stats.totalPajakPpn)}, PPh: {formatIDR(stats.totalPajakPph)})
              </span>
            </div>
            <span className="text-emerald-700 font-medium">Tertib Perpajakan SPJ</span>
          </div>
        </div>

        {/* Realisasi Anggaran per Kategori */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Realisasi per Kategori Kertas Kerja
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan belanja terhadap pagu RAB yang ditetapkan
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('kertas-kerja')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Kertas Kerja →
            </button>
          </div>

          <div className="space-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">{cat.label}</span>
                  <span className="font-mono text-slate-600">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      cat.percentage > 90
                        ? 'bg-amber-500'
                        : cat.percentage > 0
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Realisasi: {formatIDR(cat.realisasi)}</span>
                  <span>Pagu: {formatIDR(cat.pagu)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Total Item Kertas Kerja: <strong>{kertasKerja.length} paket</strong></span>
            <button
              onClick={() => onNavigateTab('rekap')}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Rekapitulasi Lengkap →
            </button>
          </div>
        </div>
      </div>

      {/* Third Row: Transaksi SPJ Terbaru & Shortcut Operasional */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Transaksi SPJ & Kas Terbaru
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                5 aktivitas pengeluaran atau penerimaan terakhir
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('bku')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Kelola di BKU →
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada transaksi tercatat.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="py-3 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/50 rounded px-1"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{trx.nomorBukti}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{formatDateIndo(trx.tanggal)}</span>
                      <span className="text-slate-400">·</span>
                      <span
                        className={`font-medium ${
                          trx.metodePembayaran === 'BANK' ? 'text-blue-700' : 'text-emerald-700'
                        }`}
                      >
                        {trx.metodePembayaran}
                      </span>
                    </div>
                    <p className="text-slate-700">{trx.uraian}</p>
                    <div className="text-[11px] text-slate-500">
                      Penerima: {trx.penerima}
                      {trx.totalPajak > 0 && (
                        <span> · Potongan Pajak: {formatIDR(trx.totalPajak)}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold text-sm ${
                        trx.jenisTransaksi === 'PENERIMAAN'
                          ? 'text-emerald-600'
                          : trx.jenisTransaksi === 'PENGELUARAN'
                          ? 'text-rose-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {trx.jenisTransaksi === 'PENERIMAAN'
                        ? `+${formatIDR(trx.nilaiBruto)}`
                        : trx.jenisTransaksi === 'PENGELUARAN'
                        ? `-${formatIDR(trx.nilaiBruto)}`
                        : formatIDR(trx.nilaiBruto)}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {trx.jenisTransaksi === 'PENERIMAAN'
                        ? 'Penerimaan Kas'
                        : trx.jenisTransaksi === 'PENGELUARAN'
                        ? 'Pengeluaran SPJ'
                        : 'Mutasi Bank-Tunai'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operational Flow Guide */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-2">
              Alur Standar SPJ Revitalisasi
            </h3>
            <ol className="space-y-3 text-xs text-slate-600 list-decimal list-inside">
              <li>
                <strong className="text-slate-900">Susun Kertas Kerja (RAB)</strong>: Input uraian paket pekerjaan, volume target, dan harga satuan acuan.
              </li>
              <li>
                <strong className="text-slate-900">Catat Penerimaan Dana</strong>: Input pencairan bantuan dana ke rekening bank sekolah.
              </li>
              <li>
                <strong className="text-slate-900">Input Belanja Terhubung</strong>: Belanja otomatis mengurangi sisa anggaran pada kertas kerja dan memotong pajak.
              </li>
              <li>
                <strong className="text-slate-900">Sinkronisasi Kas</strong>: Buku Bank, Buku Tunai, dan BKU otomatis terupdate secara presisi real-time.
              </li>
              <li>
                <strong className="text-slate-900">Cetak & Ekspor</strong>: Ekspor data ke Excel atau cetak laporan resmi ber-kop surat dan tanda tangan.
              </li>
            </ol>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={() => onNavigateTab('logs')}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Audit Trail: Cek Log Aktivitas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
