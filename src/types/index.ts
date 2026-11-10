export type PaymentMethod = 'TUNAI' | 'BANK';

export type TaxCategory = 
  | 'MATERIAL_BARANG'      // PPN 11% / PPh 22 1.5%
  | 'JASA_KONSTRUKSI_TUKANG' // PPh Final Jasa Konstruksi / PPh 21
  | 'JASA_KONSULTAN'       // PPh 21 / PPh 23
  | 'SEWA_PERALATAN'       // PPh 23 (2%)
  | 'MAKAN_MINUM'          // PB1 / PPh 23
  | 'BEBAS_PAJAK';         // Non-Pajak

export interface TaxConfiguration {
  category: TaxCategory;
  categoryLabel: string;
  defaultPpnRate: number;
  defaultPphRate: number;
  pphType: string;
}

export interface KertasKerjaItem {
  id: string;
  kodeAkun: string;          // contoh: 5.1.02.01.01.002
  uraian: string;            // contoh: Pengadaan Semen Portland 50kg untuk Plesteran Dinding
  kategori: 'MATERIAL' | 'UPAH_TUKANG' | 'ALAT_SEWA' | 'KONSUMSI' | 'ADMINISTRASI';
  satuan: string;            // Zak, m3, m2, OH (Orang Hari), Batang, Unit, Rim
  volumeTarget: number;      // misal: 250
  hargaSatuan: number;       // misal: 72000
  totalAnggaran: number;     // volumeTarget * hargaSatuan
  keterangan?: string;
  createdAt: string;
}

export interface TransaksiSPJ {
  id: string;
  tanggal: string;           // YYYY-MM-DD
  nomorBukti: string;        // contoh: BKU/2026/04/001 atau KW-001/REVIT
  uraian: string;            // Deskripsi transaksi SPJ
  jenisTransaksi: 'PENGELUARAN' | 'PENERIMAAN' | 'TARIK_TUNAI' | 'SETOR_BANK';
  kertasKerjaId?: string;    // ID kertas kerja yang terhubung (opsional jika penerimaan kas/tarik tunai)
  
  kategoriBelanja?: 'MATERIAL' | 'UPAH_TUKANG' | 'ALAT_SEWA' | 'KONSUMSI' | 'ADMINISTRASI';
  
  // Rincian kuantitas & harga (khusus pengeluaran belanja)
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  nilaiBruto: number;        // kuantitas * hargaSatuan (atau nominal transaksi langsung)
  
  // Multi-item belanja dalam satu nomor bukti/kuitansi
  items?: Array<{
    id: string;
    kertasKerjaId?: string;
    uraian: string;
    kuantitas: number;
    satuan: string;
    hargaSatuan: number;
    nilaiBruto: number;
  }>;
  
  // Pajak
  kategoriPajak: TaxCategory;
  tarifPpnPersen: number;    // Dapat diisi manual (misal 11%)
  nilaiPpn: number;
  jenisPph: string;          // PPh 21, PPh 22, PPh 23, PPh Final
  tarifPphPersen: number;    // Dapat diisi manual (misal 1.5% atau 2%)
  nilaiPph: number;
  totalPajak: number;        // nilaiPpn + nilaiPph
  nilaiNetto: number;        // nilaiBruto - totalPajak
  
  metodePembayaran: PaymentMethod; // TUNAI atau BANK
  penerima: string;          // Toko Bangunan / Nama Pekerja / CV / Bendahara
  alamatPenerima?: string;
  npwpPenerima?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  operator: string;
  action: 'TAMBAH' | 'EDIT' | 'HAPUS' | 'HAPUS_MASSAL' | 'PENGATURAN' | 'RESET';
  modul: 'KERTAS_KERJA' | 'BKU' | 'BUKU_BANK' | 'BUKU_TUNAI' | 'PENGATURAN';
  deskripsi: string;
  nominal?: number;
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  tahunAnggaran: number;
  namaProgram: string;       // Revitalisasi Ruang Kelas & Sarana Prasarana Sekolah
  sumberDana: string;        // DAK Fisik Bidang Pendidikan / BOSP Revitalisasi
  nomorSK: string;           // SK Tim Pelaksana Revitalisasi
  
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaBendahara: string;
  nipBendahara: string;
  namaKetuaTimPelaksana: string;
  nipKetuaTimPelaksana: string;
  
  namaBank: string;
  nomorRekening: string;
  namaRekening: string;
}

export interface DashboardStats {
  saldoTotalKas: number;
  saldoBank: number;
  saldoTunai: number;
  totalPaguAnggaran: number;
  totalRealisasiBelanja: number;
  sisaAnggaran: number;
  persentaseRealisasi: number;
  totalPajakDipungut: number;
  totalPajakPpn: number;
  totalPajakPph: number;
}
