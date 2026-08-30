# PRD: Menu "Jadwal" — Strength Lab / Elprian Training PWA

## Konteks
Aplikasi sudah memiliki bottom navigation dengan menu: Dashboard, Client, Check-In, Jadwal, Laporan.
Menu **Jadwal** berada di antara Check-In dan Laporan, dan saat ini belum memiliki halaman/implementasi.

Stack: Supabase (train.ftl.my.id v2), tabel yang relevan: `clients`, `activities`, `profiles`, `outlets`, `outlet_assignments`, `client_programs`.

---

## Tujuan
Membuat halaman Jadwal yang menampilkan:
1. Ringkasan analisa performa sesi secara mingguan.
2. Tampilan mingguan aktivitas latihan client.

---

## 1. Bagian Analisa (Header/Top Section)

Tampilkan ringkasan performa sesi untuk minggu berjalan (Senin–Minggu), dalam bentuk kartu-kartu metrik (mengikuti gaya visual 4-kotak yang sudah ada di halaman Check-In).

**Metrik yang wajib ditampilkan:**
- Total Sesi Minggu Ini (jumlah seluruh sesi yang terjadwal dalam minggu berjalan)
- Total Bookingan (jumlah sesi dengan status Scheduled)
- Total Sesi Cancelled
- Total Sesi No Show

**Informasi tambahan yang dibutuhkan untuk mendukung analisa ini:**
- Rentang tanggal minggu yang sedang ditampilkan (misal: "25–31 Agustus 2026")
- Navigasi pindah minggu (minggu sebelumnya / minggu berikutnya), serupa pola navigasi tanggal yang sudah ada di Check-In
- Filter berdasarkan PT (untuk role Manager yang bisa melihat semua PT)
- Filter berdasarkan Outlet (jika Manager mengelola lebih dari satu outlet)
- Persentase completion rate (Completed dari Total Sesi)
- Persentase cancellation rate dan no-show rate

---

## 2. Tampilan Mingguan (Weekly Session View)

Menampilkan aktivitas sesi latihan client selama 1 minggu berjalan.

**Struktur tampilan:**
- Grid atau list berbasis 7 hari (Senin–Minggu)
- Setiap hari menampilkan daftar sesi yang terjadwal pada hari tersebut

**Informasi per sesi yang ditampilkan:**
- Jam sesi
- Nama client
- Jenis program/latihan (misal: Total Body, Lower Body, Circuit Training)
- Lokasi/outlet sesi (jika relevan)
- Status sesi (Scheduled / Completed / Cancelled / No Show), dengan indikator warna:
  - Hijau = Completed
  - Biru = Scheduled
  - Merah = Cancelled/No Show
- Catatan tambahan sesi bila ada (misal RPE, catatan intensitas)

**Navigasi:**
- Toggle "Hari" / "Minggu" (mengikuti pola toggle yang sudah ada di Check-In)
- Tombol navigasi minggu sebelumnya/berikutnya

---

## Referensi Desain
- Ikuti tema visual dark mode yang sudah digunakan di halaman Check-In (kartu metrik, badge status berwarna, toggle switch)
- Konsisten dengan struktur bottom navigation yang sudah ada
