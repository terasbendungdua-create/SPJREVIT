import * as XLSX from 'xlsx';
import { KertasKerjaItem, TransaksiSPJ, SchoolProfile, ActivityLog } from '../types';
import { formatDateIndo, getRealizationForKertasKerjaItem } from './storage';

export function exportBKUToExcel(
  transaksiList: TransaksiSPJ[],
  profile: SchoolProfile,
  periodeLabel = 'Semua Periode'
) {
  // Sort transactions chronologically
  const sorted = [...transaksiList].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
  );

  let runningSaldo = 0;
  const rows: (string | number)[][] = [
    ['PEMERINTAH KABUPATEN/KOTA ' + profile.kabupatenKota.toUpperCase()],
    ['DINAS PENDIDIKAN DAN KEBUDAYAAN'],
    [profile.namaSekolah.toUpperCase()],
    ['BUKU KAS UMUM (BKU) KEGIATAN REVITALISASI SEKOLAH'],
    [`Sumber Dana: ${profile.sumberDana} | Tahun Anggaran: ${profile.tahunAnggaran}`],
    [`Periode: ${periodeLabel}`],
    [],
    [
      'No',
      'Tanggal',
      'Nomor Bukti',
      'Uraian Transaksi / Kegiatan Belanja',
      'Metode',
      'Penerima / Penyedia',
      'Penerimaan (Debet) (Rp)',
      'Pengeluaran (Kredit) (Rp)',
      'Saldo Kas Total (Rp)',
      'PPN (Rp)',
      'PPh (Rp)',
      'Total Pajak (Rp)',
    ],
  ];

  sorted.forEach((trx, index) => {
    let debet = 0;
    let kredit = 0;

    if (trx.jenisTransaksi === 'PENERIMAAN') {
      debet = trx.nilaiBruto;
      runningSaldo += debet;
    } else if (trx.jenisTransaksi === 'PENGELUARAN') {
      kredit = trx.nilaiBruto;
      runningSaldo -= kredit;
    } else if (trx.jenisTransaksi === 'TARIK_TUNAI' || trx.jenisTransaksi === 'SETOR_BANK') {
      // Internal transfer between Bank and Cash doesn't alter total cash balance,
      // but recorded in BKU for transparency
      debet = trx.nilaiBruto;
      kredit = trx.nilaiBruto;
    }

    rows.push([
      index + 1,
      trx.tanggal,
      trx.nomorBukti,
      trx.uraian,
      trx.metodePembayaran,
      trx.penerima,
      debet,
      kredit,
      runningSaldo,
      trx.nilaiPpn || 0,
      trx.nilaiPph || 0,
      trx.totalPajak || 0,
    ]);
  });

  // Summary row
  const totalDebet = sorted.reduce(
    (acc, t) => (t.jenisTransaksi === 'PENERIMAAN' ? acc + t.nilaiBruto : acc),
    0
  );
  const totalKredit = sorted.reduce(
    (acc, t) => (t.jenisTransaksi === 'PENGELUARAN' ? acc + t.nilaiBruto : acc),
    0
  );
  const totalPpn = sorted.reduce((acc, t) => acc + (t.nilaiPpn || 0), 0);
  const totalPph = sorted.reduce((acc, t) => acc + (t.nilaiPph || 0), 0);

  rows.push([]);
  rows.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    totalDebet,
    totalKredit,
    runningSaldo,
    totalPpn,
    totalPph,
    totalPpn + totalPph,
  ]);

  rows.push([]);
  rows.push(['', '', '', `Mengetahui,`, '', '', '', `Dibuat oleh,`]);
  rows.push(['', '', '', `Kepala ${profile.namaSekolah}`, '', '', '', `Bendahara Revitalisasi`]);
  rows.push([]);
  rows.push([]);
  rows.push([
    '',
    '',
    '',
    profile.namaKepalaSekolah,
    '',
    '',
    '',
    profile.namaBendahara,
  ]);
  rows.push([
    '',
    '',
    '',
    `NIP. ${profile.nipKepalaSekolah}`,
    '',
    '',
    '',
    `NIP. ${profile.nipBendahara}`,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BKU Revitalisasi');

  const filename = `BKU_Revitalisasi_${profile.namaSekolah.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportBukuBankToExcel(
  transaksiList: TransaksiSPJ[],
  profile: SchoolProfile
) {
  const bankTrx = transaksiList.filter(
    (t) =>
      t.metodePembayaran === 'BANK' ||
      t.jenisTransaksi === 'PENERIMAAN' ||
      t.jenisTransaksi === 'TARIK_TUNAI' ||
      t.jenisTransaksi === 'SETOR_BANK'
  ).sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  let runningBank = 0;
  const rows: (string | number)[][] = [
    [profile.namaSekolah.toUpperCase()],
    ['BUKU PEMBANTU KAS BANK'],
    [`Rekening: ${profile.namaBank} - No. ${profile.nomorRekening}`],
    [],
    [
      'No',
      'Tanggal',
      'Nomor Bukti',
      'Uraian Transaksi Bank',
      'Pemasukan Bank (Rp)',
      'Pengeluaran Bank (Rp)',
      'Saldo Bank (Rp)',
      'Keterangan',
    ],
  ];

  bankTrx.forEach((trx, idx) => {
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

    rows.push([
      idx + 1,
      trx.tanggal,
      trx.nomorBukti,
      trx.uraian,
      masuk,
      keluar,
      runningBank,
      trx.penerima,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Pembantu Bank');
  XLSX.writeFile(workbook, `Buku_Bank_${profile.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
}

export function exportBukuTunaiToExcel(
  transaksiList: TransaksiSPJ[],
  profile: SchoolProfile
) {
  const tunaiTrx = transaksiList.filter(
    (t) =>
      t.metodePembayaran === 'TUNAI' ||
      t.jenisTransaksi === 'TARIK_TUNAI' ||
      t.jenisTransaksi === 'SETOR_BANK'
  ).sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  let runningTunai = 0;
  const rows: (string | number)[][] = [
    [profile.namaSekolah.toUpperCase()],
    ['BUKU PEMBANTU KAS TUNAI'],
    [`Program: ${profile.namaProgram} | Tahun: ${profile.tahunAnggaran}`],
    [],
    [
      'No',
      'Tanggal',
      'Nomor Bukti',
      'Uraian Pengeluaran / Penerimaan Kas Tunai',
      'Penerimaan Tunai (Rp)',
      'Pengeluaran Tunai (Rp)',
      'Saldo Kas Tunai (Rp)',
      'Penerima',
    ],
  ];

  tunaiTrx.forEach((trx, idx) => {
    let masuk = 0;
    let keluar = 0;

    if (trx.jenisTransaksi === 'TARIK_TUNAI') {
      masuk = trx.nilaiBruto;
      runningTunai += masuk;
    } else if (trx.jenisTransaksi === 'SETOR_BANK') {
      keluar = trx.nilaiBruto;
      runningTunai -= keluar;
    } else if (trx.jenisTransaksi === 'PENGELUARAN' && trx.metodePembayaran === 'TUNAI') {
      keluar = trx.nilaiBruto;
      runningTunai -= keluar;
    }

    rows.push([
      idx + 1,
      trx.tanggal,
      trx.nomorBukti,
      trx.uraian,
      masuk,
      keluar,
      runningTunai,
      trx.penerima,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Kas Tunai');
  XLSX.writeFile(workbook, `Buku_Kas_Tunai_${profile.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
}

export function exportKertasKerjaToExcel(
  kertasKerjaList: KertasKerjaItem[],
  transaksiList: TransaksiSPJ[],
  profile: SchoolProfile
) {
  const rows: (string | number)[][] = [
    [profile.namaSekolah.toUpperCase()],
    ['KERTAS KERJA RENCANA ANGGARAN BIAYA & REALISASI SPJ REVITALISASI'],
    [`Program: ${profile.namaProgram} | Tahun: ${profile.tahunAnggaran}`],
    [],
    [
      'No',
      'Kode Akun',
      'Uraian Pekerjaan / Belanja',
      'Kategori',
      'Satuan',
      'Target Volume',
      'Harga Satuan (Rp)',
      'Pagu Anggaran (Rp)',
      'Realisasi Volume',
      'Realisasi Anggaran (Rp)',
      'Sisa Anggaran (Rp)',
      '% Realisasi',
      'Status',
    ],
  ];

  let totalPagu = 0;
  let totalRealisasi = 0;

  kertasKerjaList.forEach((item, index) => {
    const { realisasiVolume, realisasiRp } = getRealizationForKertasKerjaItem(
      item.id,
      transaksiList
    );
    const realisasiVol = realisasiVolume;
    const sisaRp = item.totalAnggaran - realisasiRp;
    const pct = item.totalAnggaran > 0 ? (realisasiRp / item.totalAnggaran) * 100 : 0;

    totalPagu += item.totalAnggaran;
    totalRealisasi += realisasiRp;

    let status = 'Belum Mulai';
    if (pct >= 100) status = 'Selesai 100%';
    else if (pct > 0) status = 'Dalam Progres';

    rows.push([
      index + 1,
      item.kodeAkun,
      item.uraian,
      item.kategori,
      item.satuan,
      item.volumeTarget,
      item.hargaSatuan,
      item.totalAnggaran,
      realisasiVol,
      realisasiRp,
      sisaRp,
      `${pct.toFixed(1)}%`,
      status,
    ]);
  });

  rows.push([]);
  rows.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    '',
    totalPagu,
    '',
    totalRealisasi,
    totalPagu - totalRealisasi,
    totalPagu > 0 ? `${((totalRealisasi / totalPagu) * 100).toFixed(1)}%` : '0%',
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kertas Kerja & Realisasi');
  XLSX.writeFile(workbook, `Kertas_Kerja_SPJ_${profile.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
}

export function exportActivityLogToExcel(logs: ActivityLog[], profile: SchoolProfile) {
  const rows: (string | number)[][] = [
    [profile.namaSekolah.toUpperCase()],
    ['LOG AKTIVITAS SISTEM SPJ REVITALISASI SEKOLAH'],
    [],
    ['No', 'Waktu', 'Operator', 'Aksi', 'Modul', 'Deskripsi Perubahan', 'Nominal Terkait (Rp)'],
  ];

  logs.forEach((log, idx) => {
    rows.push([
      idx + 1,
      formatDateIndo(log.timestamp),
      log.operator,
      log.action,
      log.modul,
      log.deskripsi,
      log.nominal || 0,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Log Aktivitas');
  XLSX.writeFile(workbook, `Log_Aktivitas_SPJ_${Date.now()}.xlsx`);
}
