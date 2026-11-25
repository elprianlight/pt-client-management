# Riwayat versi — Elprian Training

## v1.5.0 — 26 Nov 2026
- Hari beruntun: api 3D dari partikel; makin panjang runtutan, makin besar dan terang. Belum ada runtutan: bara redup.
- Pencapaian: karusel lencana koin 3D yang berputar dan bisa digeser dengan jari; lencana tercapai bercahaya merah, yang belum tampil abu dengan gembok.
- Mode Hemat memakai animasi CSS (api berkedip, koin berputar) tanpa WebGL.
- RPE memakai skala 1–10 (Target RPE, konfirmasi latihan, sesi berjalan).

## v1.4.2 — 25 Nov 2026
- Beranda: jarak antara kartu hero, kartu angka (Klien aktif dst.), dan bagian bawah dibuat lebih lega.
- Streak dan Pencapaian: ikon api, lencana, dan titik hari kini berwarna neon merah dengan ikon putih yang jelas; lencana belum tercapai tampil abu dengan gembok.
- Perbaikan halaman Beranda yang bisa tergeser ke samping.

## v1.4.1 — 25 Nov 2026
- Perbaikan: "Paket hampir habis" di Beranda sekarang dihitung per klien (total sisa semua paket aktif), sama dengan Daftar Klien. Paket lama yang sudah habis tidak lagi muncul bila klien sudah punya paket baru.

## v1.4.0 — 25 Nov 2026
- Jadwal berulang mingguan: pilih hari, jam, dan batas akhir; sesi dibuat otomatis 4 minggu ke depan.
- Konfirmasi latihan cepat dengan indikator (RPE, durasi, kepuasan klien, catatan).
- Target RPE di Jadwalkan sesi; tampil di jadwal dan layar sesi berjalan.
- Penomoran versi di Pengaturan dan layar login.
- Database: migrasi 0500 (kolom target_rpe, series_id; tabel session_series).

## v1.3.0 — 25 Nov 2026
- Jadwal: tampilan Mingguan (default) dan Harian.

## v1.2.0 — 25 Nov 2026
- Animasi logo pemuatan, ikon dan manifest PWA, perbaikan zoom iOS, 3D login baru.

## v1.1.0 — 24 Nov 2026
- Desain neon merah-hitam-putih, hologram 3D, Beranda baru, menu bawah dengan aksi cepat.

## v1.0.0 — 20 Nov 2026
- Rilis awal dengan RLS penuh (migrasi 0400).
