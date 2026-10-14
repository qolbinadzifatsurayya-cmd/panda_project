export type JenjangSekolah = 'SD' | 'SMP';

export interface SosialisasiReport {
  id: string;
  wilayah: string; // salah satu dari 14 wilayah
  kabupatenKota: string; // nama kab/kota yang dikunjungi
  jenjang: JenjangSekolah; // SD atau SMP
  sekolah: string; // Nama Sekolah
  pic: string; // Penanggung Jawab di sekolah / Panitia Daerah
  kontak: string; // Kontak / HP / WA
  jumlahAudience: number; // Jumlah Audience Sosialisasi
  jumlahPendaftar: number; // Jumlah Siswa yang Daftar
  tanggalKunjungan: string; // YYYY-MM-DD
  catatan?: string; // Dokumentasi / keterangan tambahan
  dokumentasiUrl?: string; // Foto/dokumentasi utama (Base64 atau URL cloud)
  dokumentasiList?: string[]; // Daftar foto dokumentasi kegiatan sosialisasi
  createdAt: string;
  updatedAt: string;
}

export interface KabupatenStats {
  nama: string;
  sdCount: number;
  smpCount: number;
  totalSekolah: number;
  audienceCount: number;
  pendaftarCount: number;
  sdTargetMet: boolean; // >= 15 SD
  smpTargetMet: boolean; // >= 5 SMP
  isTargetMet: boolean; // both >= 15 SD and >= 5 SMP
}

export interface WilayahTargetProgress {
  wilayah: string;
  totalSekolah: number;
  totalSD: number;
  totalSMP: number;
  totalAudience: number;
  totalPendaftar: number;
  kabupatenStats: KabupatenStats[];
  kabupatenCount: number; // total distinct kab/kota visited
  qualifyingKabupatenCount: number; // kab/kota meeting both 15 SD & 5 SMP
  isTargetSelesai: boolean; // qualifyingKabupatenCount >= 2
  persentaseSelesai: number; // 0 - 100%
}

export const DAFTAR_WILAYAH = [
  'Sulawesi tengah',
  'Riau',
  'Kalbar',
  'Jabar',
  'Jateng',
  'Sumut',
  'Sumbar',
  'Sumsel',
  'Lampung',
  'Sulsel',
  'Bali',
  'NTB',
  'Bengkulu',
  'Kep. Riau',
] as const;

export type WilayahName = typeof DAFTAR_WILAYAH[number];

export const TARGET_RULES = {
  MIN_KAB_KOTA: 2,
  MIN_SD_PER_KAB: 15,
  MIN_SMP_PER_KAB: 5,
};
