# SI-SPJ Revitalisasi Sekolah

Sistem Informasi Pertanggungjawaban Keuangan (SPJ) Kegiatan Revitalisasi Sekolah lengkap dengan Buku Kas Umum (BKU), Buku Pembantu Bank, Buku Pembantu Kas Tunai, Kertas Kerja (RAB), Perhitungan Pajak Otomatis (PPN & PPh), Log Riwayat Audit, Ekspor Excel/PDF, serta Fitur Cadangkan & Pulihkan Data (Backup & Restore).

---

## 🚀 Panduan Publish ke Vercel (Deployment Guide)

Aplikasi ini telah dikonfigurasi penuh dengan berkas `vercel.json` dan Vite SPA rewrite sehingga siap di-deploy langsung ke Vercel:

### Cara 1: Deploy Melalui GitHub & Vercel Dashboard (Paling Mudah)
1. Unggah (push) seluruh repositori ini ke akun **GitHub** atau **GitLab** Anda.
2. Buka [https://vercel.com](https://vercel.com) dan masuk ke akun Anda.
3. Klik tombol **"Add New..."** lalu pilih **"Project"**.
4. Impor repositori GitHub Anda.
5. Vercel akan otomatis mendeteksi pengaturan berikut:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Klik tombol **"Deploy"**.
7. Dalam 1-2 menit, aplikasi Anda sudah live dengan URL publik dari Vercel (misal: `https://si-spj-revitalisasi-sekolah.vercel.app`).

### Cara 2: Deploy Melalui Vercel CLI (Terminal)
Jika Anda menggunakan Vercel CLI di komputer lokal:
```bash
# 1. Install Vercel CLI secara global (jika belum)
npm install -g vercel

# 2. Login ke akun Vercel
vercel login

# 3. Jalankan perintah deploy produksi
vercel --prod
```

---

## ✨ Fitur Utama
1. **Buku Kas Umum (BKU), Buku Pembantu Bank & Buku Tunai**:
   - Pencatatan transaksi real-time dengan saldo harian akurat.
   - Fitur edit dan hapus (hapus per baris atau hapus massal).
2. **Kertas Kerja (RAB Revitalisasi Sekolah)**:
   - Kategori anggaran: **Bahan Material Konstruksi**, **Upah Tukang & Tenaga Kerja**, **Honorarium Tim Pelaksana & Pengelola**, dan **Administrasi SPJ**.
   - Fitur sisip baris pekerjaan baru sejajar dan kontrol kuantitas maksimal (maksimal volume pagu).
3. **Perhitungan Pajak Otomatis**:
   - PPN 11%, PPh 21 (Upah & Honorarium), PPh 22, PPh 23, serta override persentase manual.
4. **Cadangkan & Pulihkan Data (Backup & Restore JSON)**:
   - Unduh salinan database lengkap dalam format JSON.
   - Pulihkan data kapan saja (pilihan Timpa Total atau Gabungkan Data).
5. **Cetak Laporan & Ekspor**:
   - Cetak BKU, Buku Bank, Buku Tunai, Rekapitulasi Realisasi Anggaran, dan Kuitansi Resmi lengkap dengan Kop Surat & Titi Mangsa Tanda Tangan.
   - Ekspor lembar kerja ke berkas Excel (.xlsx).
