# PRD & Technical Spec: Rombak Menu Jadwal Mingguan (Weekly Schedule & Analytics)

## 1. Executive Summary & Objective
Merombak antarmuka (UI) dan logika alur kerja (logic) pada modul **Jadwal / Sesi Latihan** dari tampilan harian menjadi tampilan **Mingguan Interaktif (Weekly View)** terintegrasi dengan **Dashboard Analitik Sesi Ringkas** di bagian paling atas.

---

## 2. Struktur Layout & Hirarki Visual (Top to Bottom)

### A. Top Navigation & Global Week Selector
- **Navigation Controls**:
  - Tombol `<` (Previous Week) dan `>` (Next Week).
  - Tombol `Minggu Ini` (Current Week Jump).
  - Teks Range Tanggal: Format `DD MMM - DD MMM YYYY` (contoh: `24 Agt - 30 Agt 2026`).
  - Switcher View: `[Mingguan]` / `[Harian]` toggle.

### B. Header Analytics Bar (Metrics Cards)
Menampilkan 5 metric cards kunci dengan icon, angka tebal, dan micro-label:
1. **Total Sesi Minggu Ini**: Total seluruh sesi terjadwal dalam rentang minggu terpilih.
2. **Booked / Upcoming**: Sesi yang sudah dijadwalkan dan belum berlangsung.
3. **Completed**: Sesi yang sukses diselesaikan (Check-in/Done).
4. **Cancelled**: Sesi yang dibatalkan oleh klien/trainer.
5. **No-Show**: Sesi di mana klien tidak hadir tanpa pemberitahuan (kuota terpotong/hangus).

*Optional Productivity Metric:*
- **Utilization Hours**: Total jam mengajar efektif vs kapasitas target mingguan.

---

### C. Weekly Day Strip Navigator (7 Days Picker)
Bar horizontal 7 hari (Senin s/d Minggu) dengan visual:
- Singkatan Nama Hari (`SEN`, `SEL`, `RAB`, `KAM`, `JUM`, `SAB`, `MIN`).
- Tanggal (`24`, `25`, `26`, ...).
- Badge/Indicator jumlah sesi hari tersebut.
- Dot indicator status (Hijau = Completed, Biru = Scheduled, Merah = Cancel/No-show).
- State: `Active Day` (Highlighted border/background).

---

### D. Filter & Search Controls
- **Status Filter Chips**: `Semua`, `Scheduled / Booked`, `Completed`, `Cancelled`, `No-Show`.
- **Search Input**: Pencarian instan berdasarkan Nama Klien atau Lokasi.

---

### E. Session Cards (List View)
Setiap kartu sesi menampilkan:
1. **Time Slot**: `HH:mm` (Contoh: `06:00 - 07:00`).
2. **Client Name & Package Progress**: Nama Klien + Badge Paket (Contoh: `Marysa Iskandar (Sesi 14/20)`).
3. **Workout Focus & Target RPE**: Jenis latihan (Contoh: `Lower Body Strength`, `Circuit Training`) + Badge `RPE 8`.
4. **Location / Branch**: Nama Gym / Spot (Contoh: `FTL Pasar Minggu`, `Essence`, `Hang Lekir`).
5. **Status Badge**:
   - `Scheduled / Booked`: Biru neon / Cyan
   - `Completed`: Hijau emerald
   - `Cancelled`: Merah crimson
   - `No-Show`: Oranye / Amber
6. **Quick Actions / Context Menu**:
   - Tombol Check-In / Complete.
   - Tombol Edit / Reschedule.
   - Tombol Mark No-Show / Cancel.
   - Shortcut ke Log Workout / Detail Sesi.

---

## 3. Data Schema & Model Specification

```typescript
export interface WeeklyAnalytics {
  totalSessions: number;
  bookedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  totalHours: number;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'noshow';

export interface WorkoutSession {
  id: string;
  clientId: string;
  clientName: string;
  sessionNumber: number;
  totalPackageSessions: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  workoutType: string;
  rpeTarget: number;
  location: string;
  status: SessionStatus;
  notes?: string;
  injuryAlert?: string;
}
```

---

## 4. Design Guidelines (Theme: Dark Glassmorphic Fitness)
- **Background**: `#0b0f19` / Deep dark slate.
- **Card Background**: `#131b2e` atau `rgba(30, 41, 59, 0.7)` dengan `backdrop-blur-md` dan border `1px solid rgba(255, 255, 255, 0.08)`.
- **Accents**:
  - Primary / Brand: `#6366f1` (Indigo) / `#3b82f6` (Blue).
  - Success / Completed: `#10b981` (Emerald Green).
  - Danger / Cancelled: `#ef4444` (Red).
  - Warning / No-Show: `#f59e0b` (Amber).
- **Typography**: Clean Sans-Serif (Inter / Plus Jakarta Sans), readable font weights.

---

## 5. Implementation Checklist for AI Agent
- [ ] Buat custom hook atau state management untuk navigasi tanggal mingguan (`currentWeekStart`, `currentWeekEnd`).
- [ ] Buat kalkulasi otomatis (aggregation function) untuk menghitung analytics bar dari array sessions minggu terpilih.
- [ ] Implementasikan Weekly Day Strip dengan seleksi tanggal aktif.
- [ ] Buat filter list sesi berdasarkan filter chips dan active selected date.
- [ ] Tampilkan kartu sesi dengan badge status, kuota sesi klien, RPE, dan aksi cepat.