# Catatan Perbaikan & Peningkatan — Strength Lab
**Domain:** elprian.ftl.my.id
**Tanggal audit:** 3 Oktober 2026
**Cakupan:** Audit read-only (tidak ada data yang dibuat, diubah, atau dihapus)
**Status umum:** Aplikasi berfungsi, tidak ada error fatal. Namun ditemukan inkonsistensi data, loading lambat, bug UI, dan data dummy tertinggal.

---

## A. Daftar Masalah yang Harus Diperbaiki

### Prioritas Tinggi

#### A1. Kontradiksi data di Dashboard
Notifikasi, statistik, dan AI Coach Insights menampilkan angka yang saling bertentangan:
- Notifikasi "SESI TERKONFIRMASI — Dana Gading, Upper Body RPE 8, pukul 16:00 hari ini" muncul, tetapi kartu "Sesi Hari Ini" menunjukkan **0** dan halaman Jadwal kosong untuk hari ini.
- AI Coach Insights menampilkan "Performa Sesi Meningkat — sesi bulan ini naik +100%", sementara statistik "Sesi Bulan Ini" menunjukkan **0** (−100% vs bulan lalu).
- AI Coach Insights menampilkan "Pencapaian Target Revenue — Rp 0 (72% dari target bulanan)". Rp 0 tidak mungkin 72% dari target.
- "Paket Mau Habis (≤2 sesi)" menunjukkan **0**, tetapi client Chininta tercatat sisa **2 sesi** dan task "Follow Up Renewal — Chininta (Sisa 2 Sesi)" aktif.
- "Alert Retensi Client" menyebut **2 client** inaktif > 7 hari, tetapi halaman Client menunjukkan **3 Inaktif (> 7h)**.

**Rekomendasi:** Satukan sumber data — seluruh widget Dashboard harus membaca dari satu query/tampilan data yang sama. Periksa logika ambang batas "mau habis" (≤2 sesi harusnya menghitung client dengan sisa 2), definisi "hari ini" dan "bulan ini" (pastikan zona waktu Asia/Jakarta konsisten), dan validasi agar AI Insights tidak tampil ketika data pembanding nol/kosong.

#### A2. Loading awal lambat
- Dashboard: ~8,5 detik sebelum data tampil (skeleton terlalu lama).
- Jadwal: ~10 detik saat pertama dibuka.
- Client: ~5 detik.

**Rekomendasi:** Cek query API per halaman (kemungkinan N+1 query atau fetch berantai). Pertimbangkan caching statistik dashboard, pagination di sisi server untuk list client/sesi, dan lazy-load komponen berat (grafik, feed aktivitas). Target: First Contentful Paint < 2,5 detik.

#### A3. Bug dropdown menu profil di Pengaturan
Setelah membuka menu profil (avatar), menu tidak bisa ditutup dengan tombol Escape dan backdrop-nya memblokir semua klik termasuk sidebar — satu-satunya jalan keluar adalah navigasi manual lewat URL.

**Rekomendasi:** Perbaiki event handler backdrop/dropdown (klik di luar menu harus menutupnya, Escape harus menutupnya).

#### A4. Nomor WhatsApp customer support masih placeholder
Menu Pengaturan → "Pusat Bantuan & Customer Support" mengarah ke `https://wa.me/6281234567890` — nomor dummy.

**Rekomendasi:** Ganti dengan nomor WhatsApp admin asli.

### Prioritas Sedang

#### A5. Bell notifikasi tidak berfungsi
Ikon lonceng di header Dashboard diklik tidak membuka panel apa pun (pusat notifikasi hanya ada sebagai section di halaman).

**Rekomendasi:** Pasang dropdown panel notifikasi pada bell, atau sembunyikan ikon bell jika memang tidak dipakai.

#### A6. Logika sapaan waktu salah
Sapaan "Good Morning" muncul pukul 11:41 WIB.

**Rekomendasi:** Perbaiki logika greeting (pagi < 11:00, siang 11:00–15:00, sore 15:00–18:00, malam > 18:00) dengan zona waktu pengguna, atau gunakan bahasa Indonesia ("Selamat pagi/siang/sore/malam").

#### A7. Data dummy tertinggal di produksi
- Client "Samantha": "Sisa: 993 Sesi" / "06 / 999 Sesi Terpakai" — tidak realistis.
- Email client "otty@pt.local" — email dummy.

**Rekomendasi:** Bersihkan/hapus data tes sebelum produksi, atau tandai jelas akun tes. Tambahkan validasi jumlah sesi yang wajar saat input paket.

#### A8. Info "Perangkat Aktif" tidak akurat
Pengaturan menampilkan "iPhone / Mac App Session • StrengthLab Enterprise App" padahal akses dilakukan dari browser desktop — tampak hardcoded.

**Rekomendasi:** Tampilkan info sesi yang sebenarnya (user agent + waktu login) atau hapus section ini jika tidak didukung.

### Prioritas Rendah

#### A9. Label dan teks yang tidak rapi
- Spasi hilang: "5Paket", "0Paket", "7Paket", "8Sesi", "Bergabung25 Jul", "60Menit" (halaman Laporan).
- "3 Inaktif (> 7h)" tidak konsisten dengan tooltip "Filter Inaktif > 7 Hari".
- Tab Paket & Sesi: teks loading "Memuat data billing bulan2026-10..." (spasi hilang); opsi periode billing menyertakan "November 2026" padahal masih Oktober.
- Laporan: "Menampilkan baris dari" tanpa angka; susunan label statistik membingungkan ("98% / Total Sesi / 05 Klien Aktif"); label grafik revenue berurutan aneh.
- Campur bahasa: "3 client belum diukur berat & body fat bulan ini".
- "Kebijakan Privasi & Syarat Ketentuan" terlihat bisa diklik tetapi hanya teks biasa.

**Rekomendasi:** Rapikan seluruh string tampilan, konsistenkan istilah Indonesia/Inggris, pastikan label dinamis selalu terisi angkanya, dan jadikan Kebijakan Privasi tautan ke dokumen yang sebenarnya (atau hapus jika belum ada).

---

## B. Peningkatan yang Disarankan

### B1. Kepercayaan data (paling penting)
- Tambahkan satu halaman/kartu "Kesehatan Data" untuk admin: deteksi anomali otomatis (sesi tanpa client, paket dengan sisa negatif/tidak wajar, notifikasi basi) agar masalah seperti A1 tertangkap sebelum dilihat pengguna.
- Tambahkan timestamp "data terakhir diperbarui" di setiap widget Dashboard agar jelas data mana yang live dan mana yang cache.

### B2. Performa
- Implementasikan caching untuk statistik dashboard dan laporan (mis. refresh tiap 5–15 menit, bukan tiap buka halaman).
- Optimasi gambar dan bundle JS; pertimbangkan code-splitting per halaman.

### B3. Fitur pencatatan sesi (inti aplikasi)
- Quick check-in dari Dashboard: tombol check-in langsung pada kartu "Sesi Hari Ini" tanpa harus pindah halaman.
- Timer sesi bawaan (start/stop) dengan pencatatan durasi otomatis.
- Template workout yang benar-benar bisa dipakai ulang per client (tab Workout Plan saat ini kosong — lengkapi alur "Buat Routine" dan "Lihat Template Workout").
- Pencatatan RPE, beban, dan repetisi per set dalam satu form sesi (bukan hanya catatan teks).

### B4. Retensi & monetisasi
- Pengingat otomatis paket mau habis via WhatsApp (saat ini hanya task manual) — integrasikan dengan tombol WhatsApp yang sudah ada di kartu client.
- Laporan revenue yang akurat: pisahkan revenue prabayar vs pascabayar, tampilkan piutang (billing bulanan) karena ada client berstatus PASCABAYAR.
- Grafik tren kehadiran dan progres per client (berat, body fat, strength) — saat ini tab Progress dan Nutrisi masih kosong/belum dikonfigurasi.

### B5. UX & aksesibilitas
- Mode mobile/responsif: pastikan seluruh alur bisa dipakai dari HP karena PT bekerja di lantai gym.
- Konsistensi bahasa: pilih satu bahasa utama (disarankan Bahasa Indonesia penuh) untuk seluruh UI.
- Konfirmasi sebelum aksi destruktif (hapus client/sesi) dan feedback sukses yang jelas setelah setiap aksi.

### B6. Keamanan & akun
- Kebijakan password yang wajar untuk akun client (saat ini form tambah client meminta password manual — pertimbangkan generate otomatis + reset via WhatsApp/email).
- Log aktivitas admin (siapa mengubah apa) untuk akuntabilitas data.
- Pastikan Kebijakan Privasi & Syarat Ketentuan tersedia karena aplikasi menyimpan data kesehatan client (data fisik & medis di tab Profil).

---

## C. Urutan Pengerjaan yang Disarankan

1. **Segera (minggu ini):** A1 (kontradiksi data), A3 (bug dropdown), A4 (nomor WA asli), A7 (bersihkan data dummy).
2. **Jangka pendek (2–4 minggu):** A2 (performa loading), A5, A6, A8, A9 (bug UI minor), B5 (konsistensi bahasa).
3. **Jangka menengah (1–3 bulan):** B3 (penguatan fitur sesi), B4 (retensi & revenue), B1 (kesehatan data), B6 (keamanan).
4. **Jangka panjang:** B2 lanjutan, aplikasi mobile native/PWA jika dibutuhkan.

---

*Dokumen ini disusun dari hasil audit read-only tanggal 3 Oktober 2026. Aksi tulis (check-in, tambah/edit client, unduh CSV) dan tampilan mobile tidak diuji dalam audit ini.*
