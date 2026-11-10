import { KertasKerjaItem, TransaksiSPJ, ActivityLog, SchoolProfile } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'spj_revitalisasi_profile',
  KERTAS_KERJA: 'spj_revitalisasi_kertas_kerja',
  TRANSAKSI: 'spj_revitalisasi_transaksi',
  LOGS: 'spj_revitalisasi_activity_logs',
};

export const DEFAULT_PROFILE: SchoolProfile = {
  namaSekolah: 'SDN 2 Bendung',
  npsn: '20245678',
  alamat: 'Jl. Raya Pendidikan No. 45, Desa Bendung',
  desaKelurahan: 'Bendung',
  kecamatan: 'Kasemen',
  kabupatenKota: 'Kota Serang',
  provinsi: 'Banten',
  tahunAnggaran: 2026,
  namaProgram: 'Revitalisasi Ruang Kelas & Prasarana Belajar Sekolah',
  sumberDana: 'Bantuan Pemerintah / DAK Fisik Bidang Pendidikan',
  nomorSK: 'SK.421/089/DISDIKBUD/2026',
  
  namaKepalaSekolah: 'Drs. H. Ahmad Fauzi, M.Pd.',
  nipKepalaSekolah: '19710314 199702 1 002',
  namaBendahara: 'Siti Nurhaliza, S.Pd.',
  nipBendahara: '19840822 201001 2 018',
  namaKetuaTimPelaksana: 'Budi Santoso, S.T.',
  nipKetuaTimPelaksana: '19790510 200801 1 012',
  
  namaBank: 'Bank BJB Cabang Khusus Serang',
  nomorRekening: '0012-3456-7890-1',
  namaRekening: 'TIM REVITALISASI SDN 2 BENDUNG',
};

export const INITIAL_KERTAS_KERJA: KertasKerjaItem[] = [
  {
    id: 'KK-001',
    kodeAkun: '5.2.03.01.001',
    uraian: 'Pembongkaran Atap, Rangka Kayu Lapuk & Pembersihan Puing',
    kategori: 'UPAH_TUKANG',
    satuan: 'OH',
    volumeTarget: 20,
    hargaSatuan: 130000,
    totalAnggaran: 2600000,
    keterangan: 'Pekerjaan persiapan pembongkaran ruang kelas 1-3',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'KK-002',
    kodeAkun: '5.2.02.01.002',
    uraian: 'Pengadaan Semen Portland 50 kg SNI (Gresik/Holcim)',
    kategori: 'MATERIAL',
    satuan: 'Zak',
    volumeTarget: 250,
    hargaSatuan: 74000,
    totalAnggaran: 18500000,
    keterangan: 'Pekerjaan pasangan bata, plesteran, dan lantai',
    createdAt: '2026-03-01T08:10:00Z',
  },
  {
    id: 'KK-003',
    kodeAkun: '5.2.02.01.003',
    uraian: 'Pengadaan Pasir Pasang & Beton Berkualitas',
    kategori: 'MATERIAL',
    satuan: 'm3',
    volumeTarget: 35,
    hargaSatuan: 310000,
    totalAnggaran: 10850000,
    keterangan: 'Material adukan spesi dan cor lantai dasar',
    createdAt: '2026-03-01T08:20:00Z',
  },
  {
    id: 'KK-004',
    kodeAkun: '5.2.02.01.004',
    uraian: 'Bata Merah Bakar Standar Konstruksi',
    kategori: 'MATERIAL',
    satuan: 'Buah',
    volumeTarget: 8000,
    hargaSatuan: 1100,
    totalAnggaran: 8800000,
    keterangan: 'Penyekatan dinding ruang kelas & toilet',
    createdAt: '2026-03-01T08:30:00Z',
  },
  {
    id: 'KK-005',
    kodeAkun: '5.2.02.01.005',
    uraian: 'Kusen Aluminium 4 inch & Daun Jendela/Pintu Kaca 5mm',
    kategori: 'MATERIAL',
    satuan: 'Unit',
    volumeTarget: 14,
    hargaSatuan: 1450000,
    totalAnggaran: 20300000,
    keterangan: 'Penggantian kusen lapuk ruang kelas A dan B',
    createdAt: '2026-03-01T08:40:00Z',
  },
  {
    id: 'KK-006',
    kodeAkun: '5.2.02.01.006',
    uraian: 'Keramik Lantai Granit Tile 60x60 cm Unpolished/Matt',
    kategori: 'MATERIAL',
    satuan: 'Dus',
    volumeTarget: 180,
    hargaSatuan: 165000,
    totalAnggaran: 29700000,
    keterangan: 'Lantai ruang kelas 1, 2, dan 3',
    createdAt: '2026-03-01T08:50:00Z',
  },
  {
    id: 'KK-007',
    kodeAkun: '5.2.02.01.007',
    uraian: 'Cat Tembok Eksterior & Interior Dulux / Nippon Paint (20 Kg)',
    kategori: 'MATERIAL',
    satuan: 'Pail',
    volumeTarget: 15,
    hargaSatuan: 980000,
    totalAnggaran: 14700000,
    keterangan: 'Finishing cat tembok interior dan fasad luar',
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'KK-008',
    kodeAkun: '5.2.03.01.008',
    uraian: 'Upah Tukang Bangunan Bersertifikat (Pekerjaan Struktur & Arsitektur)',
    kategori: 'UPAH_TUKANG',
    satuan: 'OH',
    volumeTarget: 120,
    hargaSatuan: 150000,
    totalAnggaran: 18000000,
    keterangan: 'Pekerjaan pasangan, plesteran, keramik & pengecatan',
    createdAt: '2026-03-01T09:10:00Z',
  },
  {
    id: 'KK-009',
    kodeAkun: '5.2.03.01.009',
    uraian: 'Upah Pembantu Tukang / Kenek Pekerja Harian',
    kategori: 'UPAH_TUKANG',
    satuan: 'OH',
    volumeTarget: 120,
    hargaSatuan: 115000,
    totalAnggaran: 13800000,
    keterangan: 'Membantu tukang adukan semen, angkat bata dan material',
    createdAt: '2026-03-01T09:20:00Z',
  },
  {
    id: 'KK-010',
    kodeAkun: '5.2.04.01.010',
    uraian: 'Honorarium Tim Pelaksana / Penanggung Jawab Revitalisasi Sekolah',
    kategori: 'HONORARIUM',
    satuan: 'OB',
    volumeTarget: 3,
    hargaSatuan: 1500000,
    totalAnggaran: 4500000,
    keterangan: 'Honorarium penanggung jawab kegiatan revitalisasi (3 bulan)',
    createdAt: '2026-03-01T09:30:00Z',
  },
  {
    id: 'KK-011',
    kodeAkun: '5.2.05.01.011',
    uraian: 'Honorarium Sekretaris & Bendahara Tim Revitalisasi Sekolah',
    kategori: 'HONORARIUM',
    satuan: 'OB',
    volumeTarget: 6,
    hargaSatuan: 1000000,
    totalAnggaran: 6000000,
    keterangan: 'Honorarium pembukuan SPJ dan administrasi kegiatan (2 orang x 3 bulan)',
    createdAt: '2026-03-01T09:40:00Z',
  },
  {
    id: 'KK-012',
    kodeAkun: '5.2.06.01.012',
    uraian: 'Penggandaan, Kertas HVS, Spanduk Proyek & Dokumentasi SPJ',
    kategori: 'ADMINISTRASI',
    satuan: 'Paket',
    volumeTarget: 1,
    hargaSatuan: 2750000,
    totalAnggaran: 2750000,
    keterangan: 'Laporan pertanggungjawaban kemajuan fisik dan keuangan',
    createdAt: '2026-03-01T09:50:00Z',
  },
];

export const INITIAL_TRANSAKSI: TransaksiSPJ[] = [
  {
    id: 'TRX-001',
    tanggal: '2026-03-02',
    nomorBukti: 'BKU-2026-001',
    uraian: 'Penerimaan Penyaluran Dana Bantuan Revitalisasi Sekolah Tahap 1 (70%) ke Rekening Bank Sekolah',
    jenisTransaksi: 'PENERIMAAN',
    kuantitas: 1,
    satuan: 'Tahap',
    hargaSatuan: 105000000,
    nilaiBruto: 105000000,
    kategoriPajak: 'BEBAS_PAJAK',
    tarifPpnPersen: 0,
    nilaiPpn: 0,
    jenisPph: 'Non-PPh',
    tarifPphPersen: 0,
    nilaiPph: 0,
    totalPajak: 0,
    nilaiNetto: 105000000,
    metodePembayaran: 'BANK',
    penerima: 'Kas Negara / KPPN Serang',
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
  },
  {
    id: 'TRX-002',
    tanggal: '2026-03-03',
    nomorBukti: 'BKU-2026-002',
    uraian: 'Penarikan Tunai dari Rekening Bank untuk Operasional Belanja Bahan & Upah Lapangan',
    jenisTransaksi: 'TARIK_TUNAI',
    kuantitas: 1,
    satuan: 'Transaksi',
    hargaSatuan: 30000000,
    nilaiBruto: 30000000,
    kategoriPajak: 'BEBAS_PAJAK',
    tarifPpnPersen: 0,
    nilaiPpn: 0,
    jenisPph: 'Non-PPh',
    tarifPphPersen: 0,
    nilaiPph: 0,
    totalPajak: 0,
    nilaiNetto: 30000000,
    metodePembayaran: 'BANK',
    penerima: 'Bendahara Revitalisasi Sekolah',
    createdAt: '2026-03-03T09:30:00Z',
    updatedAt: '2026-03-03T09:30:00Z',
  },
  {
    id: 'TRX-003',
    tanggal: '2026-03-04',
    nomorBukti: 'KW-001/REVIT/26',
    uraian: 'Pembayaran Belanja 120 Zak Semen Portland 50 kg untuk Pekerjaan Pondasi dan Dinding',
    jenisTransaksi: 'PENGELUARAN',
    kertasKerjaId: 'KK-002',
    kuantitas: 120,
    satuan: 'Zak',
    hargaSatuan: 74000,
    nilaiBruto: 8880000,
    kategoriPajak: 'MATERIAL_BARANG',
    tarifPpnPersen: 11,
    nilaiPpn: 976800,
    jenisPph: 'PPh 22',
    tarifPphPersen: 1.5,
    nilaiPph: 133200,
    totalPajak: 1110000,
    nilaiNetto: 7770000,
    metodePembayaran: 'TUNAI',
    penerima: 'TB. Berkah Jaya Makmur',
    alamatPenerima: 'Jl. Raya Banten Lama No. 12',
    npwpPenerima: '07.345.123.4-417.000',
    createdAt: '2026-03-04T11:15:00Z',
    updatedAt: '2026-03-04T11:15:00Z',
  },
  {
    id: 'TRX-004',
    tanggal: '2026-03-05',
    nomorBukti: 'KW-002/REVIT/26',
    uraian: 'Pembayaran Pengadaan 20 m3 Pasir Pasang Berkualitas untuk Pasangan Bata',
    jenisTransaksi: 'PENGELUARAN',
    kertasKerjaId: 'KK-003',
    kuantitas: 20,
    satuan: 'm3',
    hargaSatuan: 310000,
    nilaiBruto: 6200000,
    kategoriPajak: 'MATERIAL_BARANG',
    tarifPpnPersen: 11,
    nilaiPpn: 682000,
    jenisPph: 'PPh 22',
    tarifPphPersen: 1.5,
    nilaiPph: 93000,
    totalPajak: 775000,
    nilaiNetto: 5425000,
    metodePembayaran: 'TUNAI',
    penerima: 'CV. Pasir Prima Mandiri',
    alamatPenerima: 'Kp. Sukamaju KM 5 Serang',
    npwpPenerima: '08.212.899.1-417.000',
    createdAt: '2026-03-05T14:20:00Z',
    updatedAt: '2026-03-05T14:20:00Z',
  },
  {
    id: 'TRX-005',
    tanggal: '2026-03-07',
    nomorBukti: 'KW-003/REVIT/26',
    uraian: 'Pembayaran Upah Tukang Bangunan Minggu Ke-1 (Pekerjaan Pembongkaran & Pasang Bata)',
    jenisTransaksi: 'PENGELUARAN',
    kertasKerjaId: 'KK-008',
    kuantitas: 24,
    satuan: 'OH',
    hargaSatuan: 150000,
    nilaiBruto: 3600000,
    kategoriPajak: 'JASA_KONSTRUKSI_TUKANG',
    tarifPpnPersen: 0,
    nilaiPpn: 0,
    jenisPph: 'PPh 21',
    tarifPphPersen: 2.5,
    nilaiPph: 90000,
    totalPajak: 90000,
    nilaiNetto: 3510000,
    metodePembayaran: 'TUNAI',
    penerima: 'Kelompok Tukang Bangunan (Mandor: Bpk. Rohmat)',
    alamatPenerima: 'Ds. Bendung RT 03/RW 02',
    createdAt: '2026-03-07T16:00:00Z',
    updatedAt: '2026-03-07T16:00:00Z',
  },
  {
    id: 'TRX-006',
    tanggal: '2026-03-08',
    nomorBukti: 'KW-004/REVIT/26',
    uraian: 'Pembayaran Transfer Pengadaan 8 Unit Kusen Aluminium & Daun Pintu Kaca Kelas',
    jenisTransaksi: 'PENGELUARAN',
    kertasKerjaId: 'KK-005',
    kuantitas: 8,
    satuan: 'Unit',
    hargaSatuan: 1450000,
    nilaiBruto: 11600000,
    kategoriPajak: 'MATERIAL_BARANG',
    tarifPpnPersen: 11,
    nilaiPpn: 1276000,
    jenisPph: 'PPh 22',
    tarifPphPersen: 1.5,
    nilaiPph: 174000,
    totalPajak: 1450000,
    nilaiNetto: 10150000,
    metodePembayaran: 'BANK',
    penerima: 'Alumindo Cipta Kreasi',
    alamatPenerima: 'Kawasan Industri Cikande',
    npwpPenerima: '31.542.110.2-402.000',
    createdAt: '2026-03-08T10:45:00Z',
    updatedAt: '2026-03-08T10:45:00Z',
  },
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-03-01T08:00:00Z',
    operator: 'Siti Nurhaliza, S.Pd. (Bendahara)',
    action: 'TAMBAH',
    modul: 'KERTAS_KERJA',
    deskripsi: 'Inisialisasi Rencana Anggaran Biaya (Kertas Kerja) Revitalisasi 12 paket pekerjaan',
    nominal: 144500000,
  },
  {
    id: 'LOG-002',
    timestamp: '2026-03-02T10:00:00Z',
    operator: 'Siti Nurhaliza, S.Pd. (Bendahara)',
    action: 'TAMBAH',
    modul: 'BKU',
    deskripsi: 'Input Penerimaan Penyaluran Dana Tahap 1 dari KPPN Serang',
    nominal: 105000000,
  },
  {
    id: 'LOG-003',
    timestamp: '2026-03-03T09:30:00Z',
    operator: 'Siti Nurhaliza, S.Pd. (Bendahara)',
    action: 'TAMBAH',
    modul: 'BUKU_BANK',
    deskripsi: 'Penarikan tunai Rp 30.000.000 untuk kas tunai belanja material dan upah kerja',
    nominal: 30000000,
  },
  {
    id: 'LOG-004',
    timestamp: '2026-03-04T11:15:00Z',
    operator: 'Siti Nurhaliza, S.Pd. (Bendahara)',
    action: 'TAMBAH',
    modul: 'BKU',
    deskripsi: 'Input Belanja 120 Zak Semen TB. Berkah Jaya Makmur terhubung KK-002',
    nominal: 8880000,
  },
];

// Helper to safely load from localStorage
export function loadProfile(): SchoolProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: SchoolProfile): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  logActivity({
    operator: profile.namaBendahara || 'Bendahara',
    action: 'PENGATURAN',
    modul: 'PENGATURAN',
    deskripsi: 'Memperbarui informasi profil sekolah dan tim pelaksana revitalisasi',
  });
}

export function loadKertasKerja(): KertasKerjaItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KERTAS_KERJA);
    const items: KertasKerjaItem[] = data ? JSON.parse(data) : INITIAL_KERTAS_KERJA;
    // Otomatis migrasikan kategori lama ALAT_SEWA / KONSUMSI ke HONORARIUM
    let hasChanged = false;
    const migrated = items.map((item) => {
      const rawCat = (item as unknown as { kategori: string }).kategori;
      if (rawCat === 'ALAT_SEWA' || rawCat === 'KONSUMSI') {
        hasChanged = true;
        return { ...item, kategori: 'HONORARIUM' as const };
      }
      return item;
    });
    if (hasChanged) {
      localStorage.setItem(STORAGE_KEYS.KERTAS_KERJA, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return INITIAL_KERTAS_KERJA;
  }
}

export function saveKertasKerja(items: KertasKerjaItem[]): void {
  localStorage.setItem(STORAGE_KEYS.KERTAS_KERJA, JSON.stringify(items));
}

export function loadTransaksi(): TransaksiSPJ[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSAKSI);
    const items: TransaksiSPJ[] = data ? JSON.parse(data) : INITIAL_TRANSAKSI;
    let hasChanged = false;
    const migrated = items.map((t) => {
      const rawCat = (t as unknown as { kategoriBelanja?: string }).kategoriBelanja;
      if (rawCat === 'ALAT_SEWA' || rawCat === 'KONSUMSI') {
        hasChanged = true;
        return { ...t, kategoriBelanja: 'HONORARIUM' as const };
      }
      return t;
    });
    if (hasChanged) {
      localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return INITIAL_TRANSAKSI;
  }
}

export function saveTransaksi(items: TransaksiSPJ[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(items));
}

export function loadLogs(): ActivityLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : INITIAL_LOGS;
  } catch {
    return INITIAL_LOGS;
  }
}

export function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
  const currentLogs = loadLogs();
  const newLog: ActivityLog = {
    ...log,
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newLog, ...currentLogs].slice(0, 500); // keep max 500 logs
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
}

export function resetAllDataToDefault(): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
  localStorage.setItem(STORAGE_KEYS.KERTAS_KERJA, JSON.stringify(INITIAL_KERTAS_KERJA));
  localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(INITIAL_TRANSAKSI));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  logActivity({
    operator: DEFAULT_PROFILE.namaBendahara,
    action: 'RESET',
    modul: 'PENGATURAN',
    deskripsi: 'Reset seluruh data aplikasi ke sampel awal Revitalisasi Sekolah',
  });
}

// ==================== FITUR BACKUP & RESTORE ====================
export interface AppBackupData {
  version: string;
  appName: string;
  exportedAt: string;
  profile: SchoolProfile;
  kertasKerja: KertasKerjaItem[];
  transaksi: TransaksiSPJ[];
  logs: ActivityLog[];
  summary: {
    totalKertasKerja: number;
    totalTransaksi: number;
    totalPagu: number;
    totalKas: number;
    namaSekolah: string;
    tahunAnggaran: number;
  };
}

export function createBackupData(
  profile: SchoolProfile,
  kertasKerja: KertasKerjaItem[],
  transaksi: TransaksiSPJ[],
  logs: ActivityLog[]
): AppBackupData {
  const totalPagu = kertasKerja.reduce((acc, k) => acc + (k.totalAnggaran || 0), 0);
  const totalKas = transaksi.reduce((acc, t) => {
    if (t.jenisTransaksi === 'PENERIMAAN') return acc + t.nilaiBruto;
    if (t.jenisTransaksi === 'PENGELUARAN') return acc - t.nilaiBruto;
    return acc;
  }, 0);

  return {
    version: '1.2.0',
    appName: 'SI-SPJ Revitalisasi Sekolah',
    exportedAt: new Date().toISOString(),
    profile,
    kertasKerja,
    transaksi,
    logs,
    summary: {
      totalKertasKerja: kertasKerja.length,
      totalTransaksi: transaksi.length,
      totalPagu,
      totalKas,
      namaSekolah: profile.namaSekolah,
      tahunAnggaran: profile.tahunAnggaran,
    },
  };
}

export function downloadBackupFile(backup: AppBackupData): void {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (backup.profile.namaSekolah || 'REVITALISASI').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `BACKUP_SPJ_${safeName}_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function restoreBackupData(
  backup: AppBackupData,
  mode: 'REPLACE' | 'MERGE',
  currentProfile: SchoolProfile,
  currentKK: KertasKerjaItem[],
  currentTrx: TransaksiSPJ[],
  currentLogs: ActivityLog[]
): {
  success: boolean;
  message: string;
  profile: SchoolProfile;
  kertasKerja: KertasKerjaItem[];
  transaksi: TransaksiSPJ[];
  logs: ActivityLog[];
} {
  try {
    if (!backup.kertasKerja || !Array.isArray(backup.kertasKerja)) {
      return {
        success: false,
        message: 'Format berkas tidak valid: Data Kertas Kerja tidak ditemukan di file backup.',
        profile: currentProfile,
        kertasKerja: currentKK,
        transaksi: currentTrx,
        logs: currentLogs,
      };
    }
    if (!backup.transaksi || !Array.isArray(backup.transaksi)) {
      return {
        success: false,
        message: 'Format berkas tidak valid: Data Transaksi SPJ tidak ditemukan di file backup.',
        profile: currentProfile,
        kertasKerja: currentKK,
        transaksi: currentTrx,
        logs: currentLogs,
      };
    }

    // Pastikan migrasi kategori berjalan pada data yang dipulihkan
    const sanitizedKK: KertasKerjaItem[] = backup.kertasKerja.map((k) => {
      const rawCat = (k as unknown as { kategori: string }).kategori;
      if (rawCat === 'ALAT_SEWA' || rawCat === 'KONSUMSI') {
        return { ...k, kategori: 'HONORARIUM' as const };
      }
      return k;
    });

    const sanitizedTrx: TransaksiSPJ[] = backup.transaksi.map((t) => {
      const rawCat = (t as unknown as { kategoriBelanja?: string }).kategoriBelanja;
      if (rawCat === 'ALAT_SEWA' || rawCat === 'KONSUMSI') {
        return { ...t, kategoriBelanja: 'HONORARIUM' as const };
      }
      return t;
    });

    let newProfile = backup.profile || currentProfile;
    let newKK: KertasKerjaItem[];
    let newTrx: TransaksiSPJ[];
    let newLogs: ActivityLog[];

    if (mode === 'REPLACE') {
      newKK = sanitizedKK;
      newTrx = sanitizedTrx;
      const restoreLog: ActivityLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: newProfile.namaBendahara || 'Bendahara',
        action: 'RESET',
        modul: 'PENGATURAN',
        deskripsi: `Pemulihan cadangan (Restore Timpa Total): ${sanitizedKK.length} item RAB & ${sanitizedTrx.length} transaksi SPJ`,
      };
      newLogs = [restoreLog, ...(backup.logs || [])].slice(0, 500);
    } else {
      // MERGE mode: merge by id
      const existingKKIds = new Set(currentKK.map((k) => k.id));
      const addedKK = sanitizedKK.filter((k) => !existingKKIds.has(k.id));
      newKK = [...currentKK, ...addedKK];

      const existingTrxIds = new Set(currentTrx.map((t) => t.id));
      const addedTrx = sanitizedTrx.filter((t) => !existingTrxIds.has(t.id));
      newTrx = [...currentTrx, ...addedTrx];

      const restoreLog: ActivityLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: currentProfile.namaBendahara || 'Bendahara',
        action: 'TAMBAH',
        modul: 'PENGATURAN',
        deskripsi: `Pemulihan cadangan (Restore Gabung): Menambahkan ${addedKK.length} item RAB & ${addedTrx.length} transaksi baru`,
      };
      newLogs = [restoreLog, ...currentLogs].slice(0, 500);
      newProfile = currentProfile;
    }

    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
    localStorage.setItem(STORAGE_KEYS.KERTAS_KERJA, JSON.stringify(newKK));
    localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(newTrx));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(newLogs));

    return {
      success: true,
      message: `Pemulihan data berhasil! ${newKK.length} item Kertas Kerja dan ${newTrx.length} transaksi SPJ siap digunakan.`,
      profile: newProfile,
      kertasKerja: newKK,
      transaksi: newTrx,
      logs: newLogs,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses berkas backup';
    return {
      success: false,
      message: `Gagal memulihkan cadangan: ${errMsg}`,
      profile: currentProfile,
      kertasKerja: currentKK,
      transaksi: currentTrx,
      logs: currentLogs,
    };
  }
}

// Format Currency IDR
export function formatIDR(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format standard date
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// Format short date (DD/MM/YYYY)
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Helper to compute realization for a Kertas Kerja item across all SPJ transactions
export function getRealizationForKertasKerjaItem(
  kertasKerjaId: string,
  transaksiList: TransaksiSPJ[],
  excludeTrxId?: string
) {
  let realisasiVolume = 0;
  let realisasiRp = 0;
  let linkedCount = 0;

  transaksiList.forEach((t) => {
    if (t.id === excludeTrxId || t.jenisTransaksi !== 'PENGELUARAN') return;

    if (t.items && t.items.length > 0) {
      t.items.forEach((sub) => {
        if (sub.kertasKerjaId === kertasKerjaId) {
          realisasiVolume += sub.kuantitas || 0;
          realisasiRp += sub.nilaiBruto || 0;
          linkedCount += 1;
        }
      });
    } else if (t.kertasKerjaId === kertasKerjaId) {
      realisasiVolume += t.kuantitas || 0;
      realisasiRp += t.nilaiBruto || 0;
      linkedCount += 1;
    }
  });

  return { realisasiVolume, realisasiRp, linkedCount };
}

