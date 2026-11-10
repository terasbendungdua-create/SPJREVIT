import React, { useState } from 'react';
import { SchoolProfile } from '../types';
import { X, Building2, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SchoolProfile;
  onSaveProfile: (profile: SchoolProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>({ ...profile });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Pengaturan Profil Satuan Pendidikan & Tim Revitalisasi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Identitas Sekolah */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 border-b pb-1">
              1. Identitas Satuan Pendidikan & Program
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nama Satuan Pendidikan / Sekolah
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaSekolah}
                  onChange={(e) =>
                    setFormData({ ...formData, namaSekolah: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">NPSN</label>
                <input
                  type="text"
                  required
                  value={formData.npsn}
                  onChange={(e) =>
                    setFormData({ ...formData, npsn: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nama Program Kegiatan
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaProgram}
                  onChange={(e) =>
                    setFormData({ ...formData, namaProgram: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Sumber Dana & Tahun Anggaran
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.sumberDana}
                    onChange={(e) =>
                      setFormData({ ...formData, sumberDana: e.target.value })
                    }
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    required
                    value={formData.tahunAnggaran}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tahunAnggaran: parseInt(e.target.value) || 2026,
                      })
                    }
                    className="w-20 px-2 py-1.5 border border-slate-300 rounded text-center font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Alamat Sekolah Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kecamatan</label>
                <input
                  type="text"
                  value={formData.kecamatan}
                  onChange={(e) =>
                    setFormData({ ...formData, kecamatan: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kabupaten / Kota</label>
                <input
                  type="text"
                  value={formData.kabupatenKota}
                  onChange={(e) =>
                    setFormData({ ...formData, kabupatenKota: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Provinsi</label>
                <input
                  type="text"
                  value={formData.provinsi}
                  onChange={(e) =>
                    setFormData({ ...formData, provinsi: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Tim Pelaksana & Pejabat */}
          <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-slate-900 border-b pb-1">
              2. Penandatangan Laporan Pertanggungjawaban (SPJ)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nama Kepala Sekolah
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaKepalaSekolah}
                  onChange={(e) =>
                    setFormData({ ...formData, namaKepalaSekolah: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.nipKepalaSekolah}
                  onChange={(e) =>
                    setFormData({ ...formData, nipKepalaSekolah: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nama Bendahara Revitalisasi
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaBendahara}
                  onChange={(e) =>
                    setFormData({ ...formData, namaBendahara: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  NIP Bendahara
                </label>
                <input
                  type="text"
                  value={formData.nipBendahara}
                  onChange={(e) =>
                    setFormData({ ...formData, nipBendahara: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Nomor Surat Keputusan (SK) Tim Revitalisasi
              </label>
              <input
                type="text"
                value={formData.nomorSK}
                onChange={(e) =>
                  setFormData({ ...formData, nomorSK: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          {/* Rekening Bank */}
          <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-slate-900 border-b pb-1">
              3. Data Rekening Penampung Bantuan Revitalisasi
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={formData.namaBank}
                  onChange={(e) =>
                    setFormData({ ...formData, namaBank: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={formData.nomorRekening}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorRekening: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Nama Pemilik Rekening
                </label>
                <input
                  type="text"
                  value={formData.namaRekening}
                  onChange={(e) =>
                    setFormData({ ...formData, namaRekening: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
