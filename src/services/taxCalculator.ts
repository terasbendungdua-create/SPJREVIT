import { TaxCategory, TaxConfiguration } from '../types';

export const TAX_PRESETS: Record<TaxCategory, TaxConfiguration> = {
  MATERIAL_BARANG: {
    category: 'MATERIAL_BARANG',
    categoryLabel: 'Belanja Material / Barang Toko',
    defaultPpnRate: 11,
    defaultPphRate: 1.5,
    pphType: 'PPh 22 (Belanja Barang)',
  },
  JASA_KONSTRUKSI_TUKANG: {
    category: 'JASA_KONSTRUKSI_TUKANG',
    categoryLabel: 'Upah Tukang & Tenaga Kerja Lapangan',
    defaultPpnRate: 0,
    defaultPphRate: 2.5,
    pphType: 'PPh 21 (Upah Tukang/Tenaga Kerja)',
  },
  HONORARIUM: {
    category: 'HONORARIUM',
    categoryLabel: 'Honorarium Tim Pelaksana / Panitia / Narasumber',
    defaultPpnRate: 0,
    defaultPphRate: 5.0,
    pphType: 'PPh 21 (Honorarium)',
  },
  JASA_KONSULTAN: {
    category: 'JASA_KONSULTAN',
    categoryLabel: 'Jasa Konsultan / Tenaga Ahli Pengawas',
    defaultPpnRate: 11,
    defaultPphRate: 2.0,
    pphType: 'PPh 23 (Jasa Teknis / Keahlian)',
  },
  SEWA_PERALATAN: {
    category: 'SEWA_PERALATAN',
    categoryLabel: 'Sewa Alat Konstruksi & Perancah (Molen/Scaffolding)',
    defaultPpnRate: 11,
    defaultPphRate: 2.0,
    pphType: 'PPh 23 (Sewa Harta/Alat)',
  },
  MAKAN_MINUM: {
    category: 'MAKAN_MINUM',
    categoryLabel: 'Konsumsi Rapat & Makan Minum Pekerja',
    defaultPpnRate: 0,
    defaultPphRate: 2.0,
    pphType: 'PPh 23 / Pajak Restoran (PB1)',
  },
  BEBAS_PAJAK: {
    category: 'BEBAS_PAJAK',
    categoryLabel: 'Non-Pajak / Di Bawah Batas / Bebas Potongan',
    defaultPpnRate: 0,
    defaultPphRate: 0,
    pphType: 'Non-PPh',
  },
};

export function calculateTaxes(
  nilaiBruto: number,
  category: TaxCategory,
  manualPpnPercent?: number,
  manualPphPercent?: number
) {
  const preset = TAX_PRESETS[category] || TAX_PRESETS.BEBAS_PAJAK;
  
  const ppnRate = manualPpnPercent !== undefined ? manualPpnPercent : preset.defaultPpnRate;
  const pphRate = manualPphPercent !== undefined ? manualPphPercent : preset.defaultPphRate;

  // Nilai Dasar Pengenaan Pajak (DPP)
  // Standard in government procurement: if gross includes PPN, or gross is before tax
  // We provide standard multiplier: PPN = (Gross * ppnRate) / 100, PPh = (Gross * pphRate) / 100
  const nilaiPpn = Math.round((nilaiBruto * ppnRate) / 100);
  const nilaiPph = Math.round((nilaiBruto * pphRate) / 100);
  const totalPajak = nilaiPpn + nilaiPph;
  const nilaiNetto = Math.max(0, nilaiBruto - totalPajak);

  return {
    ppnRate,
    pphRate,
    pphType: preset.pphType,
    nilaiPpn,
    nilaiPph,
    totalPajak,
    nilaiNetto,
  };
}
