import React, { useState, useMemo } from 'react';
import {
  SchoolProfile,
  TransaksiSPJ,
  KertasKerjaItem,
  DashboardStats,
} from '../types';
import { formatIDR, formatDateIndo, getRealizationForKertasKerjaItem } from '../services/storage';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SchoolProfile;
  transaksi: TransaksiSPJ[];
  kertasKerja: KertasKerjaItem[];
  stats: DashboardStats;
  initialReportType?: 'BKU' | 'BANK' | 'TUNAI' | 'REKAP' | 'KUITANSI';
  initialTrx?: TransaksiSPJ | null;
  initialMonth?: string;
}

// Terbilang helper in Indonesian
function terbilang(n: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  if (n < 12) return bilangan[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100)
    return (
      terbilang(Math.floor(n / 10)) +
      ' Puluh ' +
      (n % 10 !== 0 ? bilangan[n % 10] : '')
    );
  if (n < 200) return 'Seratus ' + terbilang(n - 100);
  if (n < 1000)
    return (
      terbilang(Math.floor(n / 100)) +
      ' Ratus ' +
      (n % 100 !== 0 ? terbilang(n % 100) : '')
    );
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
  if (n < 1000000)
    return (
      terbilang(Math.floor(n / 1000)) +
      ' Ribu ' +
      (n % 1000 !== 0 ? terbilang(n % 1000) : '')
    );
  if (n < 1000000000)
    return (
      terbilang(Math.floor(n / 1000000)) +
      ' Juta ' +
      (n % 1000000 !== 0 ? terbilang(n % 1000000) : '')
    );
  if (n < 1000000000000)
    return (
      terbilang(Math.floor(n / 1000000000)) +
      ' Milyar ' +
      (n % 1000000000 !== 0 ? terbilang(n % 1000000000) : '')
    );
  return String(n);
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  transaksi,
  kertasKerja,
  stats,
  initialReportType = 'BKU',
  initialTrx = null,
  initialMonth = 'ALL',
}) => {
  const [reportType, setReportType] = useState<
    'BKU' | 'BANK' | 'TUNAI' | 'REKAP' | 'KUITANSI'
  >(initialReportType);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || 'ALL');
  const [selectedTrxId, setSelectedTrxId] = useState<string>(
    initialTrx?.id || transaksi[0]?.id || ''
  );

  // Available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transaksi.forEach((t) => {
      if (t.tanggal) set.add(t.tanggal.substring(0, 7));
    });
    return Array.from(set).sort();
  }, [transaksi]);

  // Selected Transaction for receipt
  const currentReceiptTrx = useMemo(() => {
    return transaksi.find((t) => t.id === selectedTrxId) || transaksi[0];
  }, [transaksi, selectedTrxId]);

  // Sorted and filtered for BKU
  const bkuItems = useMemo(() => {
    const sorted = [...transaksi].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    let running = 0;
    const withSaldo = sorted.map((trx) => {
      let debet = 0;
      let kredit = 0;
      if (trx.jenisTransaksi === 'PENERIMAAN') {
        debet = trx.nilaiBruto;
        running += debet;
      } else if (trx.jenisTransaksi === 'PENGELUARAN') {
        kredit = trx.nilaiBruto;
        running -= kredit;
      } else if (trx.jenisTransaksi === 'TARIK_TUNAI' || trx.jenisTransaksi === 'SETOR_BANK') {
        debet = trx.nilaiBruto;
        kredit = trx.nilaiBruto;
      }
      return { ...trx, debet, kredit, runningSaldo: running };
    });

    if (selectedMonth === 'ALL') return withSaldo;
    return withSaldo.filter((t) => t.tanggal.substring(0, 7) === selectedMonth);
  }, [transaksi, selectedMonth]);

  // Filtered Bank
  const bankItems = useMemo(() => {
    const bankOnly = transaksi
      .filter(
        (t) =>
          t.metodePembayaran === 'BANK' ||
          t.jenisTransaksi === 'PENERIMAAN' ||
          t.jenisTransaksi === 'TARIK_TUNAI' ||
          t.jenisTransaksi === 'SETOR_BANK'
      )
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let running = 0;
    return bankOnly.map((t) => {
      let masuk = 0;
      let keluar = 0;
      if (t.jenisTransaksi === 'PENERIMAAN' || t.jenisTransaksi === 'SETOR_BANK') {
        masuk = t.nilaiBruto;
        running += masuk;
      } else if (t.jenisTransaksi === 'TARIK_TUNAI') {
        keluar = t.nilaiBruto;
        running -= keluar;
      } else if (t.jenisTransaksi === 'PENGELUARAN' && t.metodePembayaran === 'BANK') {
        keluar = t.nilaiBruto;
        running -= keluar;
      }
      return { ...t, masuk, keluar, saldoBank: running };
    });
  }, [transaksi]);

  // Filtered Tunai
  const tunaiItems = useMemo(() => {
    const tunaiOnly = transaksi
      .filter(
        (t) =>
          t.metodePembayaran === 'TUNAI' ||
          t.jenisTransaksi === 'TARIK_TUNAI' ||
          t.jenisTransaksi === 'SETOR_BANK'
      )
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let running = 0;
    return tunaiOnly.map((t) => {
      let masuk = 0;
      let keluar = 0;
      if (t.jenisTransaksi === 'TARIK_TUNAI') {
        masuk = t.nilaiBruto;
        running += masuk;
      } else if (t.jenisTransaksi === 'SETOR_BANK') {
        keluar = t.nilaiBruto;
        running -= keluar;
      } else if (t.jenisTransaksi === 'PENGELUARAN' && t.metodePembayaran === 'TUNAI') {
        keluar = t.nilaiBruto;
        running -= keluar;
      }
      return { ...t, masuk, keluar, saldoTunai: running };
    });
  }, [transaksi]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl border border-slate-300 my-4 flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar (hidden during browser print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-slate-900">Format Laporan Cetak:</span>
            <select
              value={reportType}
              onChange={(e) =>
                setReportType(
                  e.target.value as 'BKU' | 'BANK' | 'TUNAI' | 'REKAP' | 'KUITANSI'
                )
              }
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium text-slate-800"
            >
              <option value="BKU">Buku Kas Umum (BKU)</option>
              <option value="BANK">Buku Pembantu Bank</option>
              <option value="TUNAI">Buku Pembantu Kas Tunai</option>
              <option value="REKAP">Rekapitulasi Anggaran & Realisasi</option>
              <option value="KUITANSI">Kuitansi SPJ Belanja</option>
            </select>

            {reportType === 'BKU' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
              >
                <option value="ALL">Semua Bulan</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    Bulan {m}
                  </option>
                ))}
              </select>
            )}

            {reportType === 'KUITANSI' && (
              <select
                value={selectedTrxId}
                onChange={(e) => setSelectedTrxId(e.target.value)}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 max-w-xs truncate"
              >
                {transaksi
                  .filter((t) => t.jenisTransaksi === 'PENGELUARAN')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nomorBukti} - {t.uraian.substring(0, 30)}...
                    </option>
                  ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW SHEET */}
        <div className="p-8 overflow-y-auto font-serif text-slate-900 bg-white">
          {/* KOP SURAT RESMI */}
          <div className="text-center pb-3 border-b-4 border-double border-slate-900 mb-6">
            <h3 className="text-xs uppercase tracking-wider font-semibold">
              PEMERINTAH KABUPATEN/KOTA {profile.kabupatenKota.toUpperCase()}
            </h3>
            <h3 className="text-xs uppercase tracking-wider font-semibold">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h3>
            <h2 className="text-base font-bold uppercase tracking-wide mt-1">
              {profile.namaSekolah.toUpperCase()}
            </h2>
            <p className="text-[11px] font-sans text-slate-600 mt-0.5">
              NPSN: {profile.npsn} · {profile.alamat}, Kec. {profile.kecamatan}, {profile.kabupatenKota} - {profile.provinsi}
            </p>
          </div>

          {/* REPORT CONTENT: BKU */}
          {reportType === 'BKU' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="font-bold text-sm uppercase underline">
                  BUKU KAS UMUM (BKU) KEGIATAN REVITALISASI
                </h4>
                <p className="text-xs font-sans text-slate-600 mt-1">
                  Program: {profile.namaProgram} · Sumber Dana: {profile.sumberDana}
                </p>
                <p className="text-xs font-sans text-slate-600">
                  Tahun Anggaran: {profile.tahunAnggaran} {selectedMonth !== 'ALL' && `· Bulan: ${selectedMonth}`}
                </p>
              </div>

              <table className="w-full text-[11px] font-sans border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold">
                    <th className="border border-slate-900 p-1.5 w-8">No</th>
                    <th className="border border-slate-900 p-1.5 w-20">Tanggal</th>
                    <th className="border border-slate-900 p-1.5 w-24">No. Bukti</th>
                    <th className="border border-slate-900 p-1.5">Uraian Transaksi / Belanja</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Debet (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Kredit (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Saldo Kas (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {bkuItems.map((trx, idx) => (
                    <tr key={trx.id} className="border-b border-slate-300">
                      <td className="border border-slate-900 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-900 p-1.5 font-mono text-center">
                        {trx.tanggal}
                      </td>
                      <td className="border border-slate-900 p-1.5 font-mono text-center">
                        {trx.nomorBukti}
                      </td>
                      <td className="border border-slate-900 p-1.5">
                        {trx.uraian}
                        {trx.penerima && (
                          <div className="text-[10px] text-slate-600">
                            Penerima: {trx.penerima} ({trx.metodePembayaran})
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        {trx.debet > 0 ? formatIDR(trx.debet) : '-'}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        {trx.kredit > 0 ? formatIDR(trx.kredit) : '-'}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono font-semibold">
                        {formatIDR(trx.runningSaldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold">
                    <td colSpan={4} className="border border-slate-900 p-2 text-right">
                      TOTAL MUTASI & SALDO AKHIR:
                    </td>
                    <td className="border border-slate-900 p-2 text-right font-mono">
                      {formatIDR(bkuItems.reduce((acc, t) => acc + t.debet, 0))}
                    </td>
                    <td className="border border-slate-900 p-2 text-right font-mono">
                      {formatIDR(bkuItems.reduce((acc, t) => acc + t.kredit, 0))}
                    </td>
                    <td className="border border-slate-900 p-2 text-right font-mono">
                      {formatIDR(bkuItems[bkuItems.length - 1]?.runningSaldo || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* REPORT CONTENT: BUKU BANK */}
          {reportType === 'BANK' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="font-bold text-sm uppercase underline">
                  BUKU PEMBANTU KAS BANK
                </h4>
                <p className="text-xs font-sans text-slate-600 mt-1">
                  Bank: {profile.namaBank} · No. Rekening: {profile.nomorRekening} · a.n.{' '}
                  {profile.namaRekening}
                </p>
              </div>

              <table className="w-full text-[11px] font-sans border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold">
                    <th className="border border-slate-900 p-1.5 w-8">No</th>
                    <th className="border border-slate-900 p-1.5 w-20">Tanggal</th>
                    <th className="border border-slate-900 p-1.5 w-24">No. Bukti</th>
                    <th className="border border-slate-900 p-1.5">Uraian Transaksi Bank</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Pemasukan (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Pengeluaran (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Saldo Bank (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {bankItems.map((trx, idx) => (
                    <tr key={trx.id} className="border-b border-slate-300">
                      <td className="border border-slate-900 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-900 p-1.5 font-mono text-center">
                        {trx.tanggal}
                      </td>
                      <td className="border border-slate-900 p-1.5 font-mono text-center">
                        {trx.nomorBukti}
                      </td>
                      <td className="border border-slate-900 p-1.5">{trx.uraian}</td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        {trx.masuk > 0 ? formatIDR(trx.masuk) : '-'}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        {trx.keluar > 0 ? formatIDR(trx.keluar) : '-'}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono font-semibold">
                        {formatIDR(trx.saldoBank)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT CONTENT: BUKU KAS TUNAI */}
          {reportType === 'TUNAI' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="font-bold text-sm uppercase underline">
                  BUKU PEMBANTU KAS TUNAI
                </h4>
                <p className="text-xs font-sans text-slate-600 mt-1">
                  Program: {profile.namaProgram} · Pengelola Kas: Bendahara Revitalisasi
                </p>
              </div>

              <table className="w-full text-[11px] font-sans border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold">
                    <th className="border border-slate-900 p-1.5 w-8">No</th>
                    <th className="border border-slate-900 p-1.5 w-20">Tanggal</th>
                    <th className="border border-slate-900 p-1.5 w-24">No. Bukti</th>
                    <th className="border border-slate-900 p-1.5">Uraian Transaksi Kas Tunai</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Penerimaan (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Pengeluaran (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Saldo Tunai (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {tunaiItems.map((trx, idx) => (
                    <tr key={trx.id} className="border-b border-slate-300">
                      <td className="border border-slate-900 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-900 p-1.5 font-mono text-center">
                        {trx.tanggal}
                      </td>
                      <td className="border border-slate-900 p-1.5 font-mono text-center">
                        {trx.nomorBukti}
                      </td>
                      <td className="border border-slate-900 p-1.5">{trx.uraian}</td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        {trx.masuk > 0 ? formatIDR(trx.masuk) : '-'}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">
                        {trx.keluar > 0 ? formatIDR(trx.keluar) : '-'}
                      </td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono font-semibold">
                        {formatIDR(trx.saldoTunai)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT CONTENT: REKAPITULASI ANGGARAN PRESISI */}
          {reportType === 'REKAP' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="font-bold text-sm uppercase underline">
                  REKAPITULASI REALISASI ANGGARAN & KERTAS KERJA
                </h4>
                <p className="text-xs font-sans text-slate-600 mt-1">
                  Program: {profile.namaProgram} · Tahun Anggaran: {profile.tahunAnggaran}
                </p>
              </div>

              <table className="w-full text-[11px] font-sans border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold">
                    <th className="border border-slate-900 p-1.5 w-8">No</th>
                    <th className="border border-slate-900 p-1.5 w-24">Kode Akun</th>
                    <th className="border border-slate-900 p-1.5">Uraian Belanja / Kegiatan</th>
                    <th className="border border-slate-900 p-1.5 w-16 text-center">Satuan</th>
                    <th className="border border-slate-900 p-1.5 w-14 text-center">Target</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Pagu (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-14 text-center">Real. Vol</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Realisasi (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-24 text-right">Sisa (Rp)</th>
                    <th className="border border-slate-900 p-1.5 w-12 text-center">%</th>
                  </tr>
                </thead>
                <tbody>
                  {kertasKerja.map((item, idx) => {
                    const { realisasiVolume, realisasiRp } = getRealizationForKertasKerjaItem(
                      item.id,
                      transaksi
                    );
                    const realVol = realisasiVolume;
                    const realRp = realisasiRp;
                    const sisa = item.totalAnggaran - realRp;
                    const pct =
                      item.totalAnggaran > 0 ? (realRp / item.totalAnggaran) * 100 : 0;

                    return (
                      <tr key={item.id} className="border-b border-slate-300">
                        <td className="border border-slate-900 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-900 p-1.5 font-mono text-center">
                          {item.kodeAkun}
                        </td>
                        <td className="border border-slate-900 p-1.5 font-medium">{item.uraian}</td>
                        <td className="border border-slate-900 p-1.5 text-center">{item.satuan}</td>
                        <td className="border border-slate-900 p-1.5 text-center font-mono">
                          {item.volumeTarget}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-right font-mono">
                          {formatIDR(item.totalAnggaran)}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center font-mono">
                          {realVol}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-right font-mono">
                          {formatIDR(realRp)}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-right font-mono">
                          {formatIDR(sisa)}
                        </td>
                        <td className="border border-slate-900 p-1.5 text-center font-mono">
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold">
                    <td colSpan={5} className="border border-slate-900 p-2 text-right">
                      TOTAL KESELURUHAN:
                    </td>
                    <td className="border border-slate-900 p-2 text-right font-mono">
                      {formatIDR(stats.totalPaguAnggaran)}
                    </td>
                    <td></td>
                    <td className="border border-slate-900 p-2 text-right font-mono">
                      {formatIDR(stats.totalRealisasiBelanja)}
                    </td>
                    <td className="border border-slate-900 p-2 text-right font-mono">
                      {formatIDR(stats.sisaAnggaran)}
                    </td>
                    <td className="border border-slate-900 p-2 text-center font-mono">
                      {stats.persentaseRealisasi}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* REPORT CONTENT: KUITANSI RESMI */}
          {reportType === 'KUITANSI' && currentReceiptTrx && (
            <div className="border-2 border-slate-900 p-6 space-y-4 my-2">
              <div className="flex items-start justify-between border-b pb-3 border-slate-900">
                <div>
                  <h4 className="font-bold text-sm tracking-wide">KUITANSI / BUKTI PEMBAYARAN</h4>
                  <div className="text-xs font-mono mt-0.5">
                    No. Bukti: <strong>{currentReceiptTrx.nomorBukti}</strong>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div>Tahun Anggaran: {profile.tahunAnggaran}</div>
                  <div>Mata Anggaran: Belanja Revitalisasi</div>
                </div>
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="grid grid-cols-4 gap-2 py-1">
                  <div className="font-semibold text-slate-700">Sudah Terima Dari:</div>
                  <div className="col-span-3 font-semibold text-slate-900">
                    Bendahara Revitalisasi {profile.namaSekolah}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 py-1 bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">Jumlah Uang:</div>
                  <div className="col-span-3 font-serif italic text-slate-900 font-semibold">
                    # {terbilang(currentReceiptTrx.nilaiBruto)} Rupiah #
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 py-1">
                  <div className="font-semibold text-slate-700">Untuk Pembayaran:</div>
                  <div className="col-span-3 text-slate-900">
                    <div>{currentReceiptTrx.uraian}</div>
                    {currentReceiptTrx.items && currentReceiptTrx.items.length > 0 ? (
                      <div className="mt-1 space-y-0.5">
                        {currentReceiptTrx.items.map((it, i) => (
                          <div key={it.id || i} className="text-[11px] text-slate-600 font-mono">
                            • {it.uraian}: {it.kuantitas} {it.satuan} x {formatIDR(it.hargaSatuan)} = {formatIDR(it.nilaiBruto)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      currentReceiptTrx.kuantitas > 0 && (
                        <span className="block text-[11px] text-slate-600 mt-0.5">
                          (Rincian: {currentReceiptTrx.kuantitas} {currentReceiptTrx.satuan} x {formatIDR(currentReceiptTrx.hargaSatuan)})
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Tax Breakdown */}
                <div className="border border-slate-300 rounded p-3 my-2 text-[11px]">
                  <div className="font-semibold mb-1">Rincian Perhitungan Keuangan & Pajak:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>Nilai Transaksi (Bruto): <strong className="font-mono">{formatIDR(currentReceiptTrx.nilaiBruto)}</strong></div>
                    <div>Potongan Pajak PPN ({currentReceiptTrx.tarifPpnPersen}%): <strong className="font-mono">{formatIDR(currentReceiptTrx.nilaiPpn)}</strong></div>
                    <div>Potongan {currentReceiptTrx.jenisPph} ({currentReceiptTrx.tarifPphPersen}%): <strong className="font-mono">{formatIDR(currentReceiptTrx.nilaiPph)}</strong></div>
                    <div>Total Potongan Pajak: <strong className="font-mono">{formatIDR(currentReceiptTrx.totalPajak)}</strong></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 font-semibold flex justify-between">
                    <span>Jumlah Bersih Dibayarkan (Netto):</span>
                    <span className="font-mono text-sm text-blue-900">{formatIDR(currentReceiptTrx.nilaiNetto)}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                <div>
                  <p className="text-slate-600">Setuju Dibayar,</p>
                  <p className="font-semibold">Kepala Sekolah</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{profile.namaKepalaSekolah}</p>
                  <p className="text-[10px] text-slate-600">NIP. {profile.nipKepalaSekolah}</p>
                </div>
                <div>
                  <p className="text-slate-600">Lunas Dibayar,</p>
                  <p className="font-semibold">Bendahara Revitalisasi</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{profile.namaBendahara}</p>
                  <p className="text-[10px] text-slate-600">NIP. {profile.nipBendahara}</p>
                </div>
                <div>
                  <p className="text-slate-600">{profile.desaKelurahan}, {formatDateIndo(currentReceiptTrx.tanggal)}</p>
                  <p className="font-semibold">Penerima Uang,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">{currentReceiptTrx.penerima}</p>
                  <p className="text-[10px] text-slate-600">{currentReceiptTrx.npwpPenerima || 'Penyedia / Toko / Pekerja'}</p>
                </div>
              </div>
            </div>
          )}

          {/* STANDARD OFFICIAL SIGNATURE FOOTER FOR LEDGERS (BKU, Bank, Tunai, Rekap) */}
          {reportType !== 'KUITANSI' && (
            <div className="mt-8 pt-6 border-t border-slate-400 grid grid-cols-2 text-xs text-center font-sans">
              <div>
                <p className="text-slate-700">Mengetahui / Menyetujui,</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  Kepala {profile.namaSekolah}
                </p>
                <div className="h-20"></div>
                <p className="font-bold text-slate-900 underline">
                  {profile.namaKepalaSekolah}
                </p>
                <p className="text-[11px] text-slate-600">
                  NIP. {profile.nipKepalaSekolah}
                </p>
              </div>

              <div>
                <p className="text-slate-700">
                  {profile.kabupatenKota}, {formatDateIndo(new Date().toISOString().split('T')[0])}
                </p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  Bendahara Revitalisasi Sekolah
                </p>
                <div className="h-20"></div>
                <p className="font-bold text-slate-900 underline">
                  {profile.namaBendahara}
                </p>
                <p className="text-[11px] text-slate-600">
                  NIP. {profile.nipBendahara}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
