# Database Overview — PT Client Management System

## Entity Relationship Summary

```
users (auth.users extended)
  │
  ├── personal_trainers (1:1 dengan users role=PT)
  │     │
  │     ├── clients (1:N — PT punya banyak client)
  │     │     │
  │     │     ├── pt_packages (1:N — client punya banyak paket)
  │     │     │     │
  │     │     │     ├── pt_transactions (1:N — paket punya banyak transaksi)
  │     │     │     │
  │     │     │     └── workout_sessions (1:N — paket punya banyak sesi)
  │     │     │           │
  │     │     │           └── session_exercises (1:N — sesi punya banyak exercise)
  │     │     │
  │     │     ├── measurements (1:N — body measurement history)
  │     │     │
  │     │     └── nutrition_logs (1:N — daily nutrition logs)
  │     │           │
  │     │           └── food_diary (1:N — makanan per hari)
  │     │
  │     ├── workout_programs (template/assigned programs)
  │     │
  │     └── meal_plans (template/assigned meal plans)
  │
  └── notifications (per user)

audit_logs (semua aktivitas penting)
```

---

## Tabel Utama

| Tabel | Deskripsi | Rows Est. |
|---|---|---|
| `users` | Extended dari Supabase auth | ~1000 |
| `personal_trainers` | Data profil PT | ~50 |
| `clients` | Data profil client | ~500 |
| `pt_packages` | Paket sesi yang dibeli | ~1500 |
| `pt_transactions` | Riwayat pembayaran | ~2000 |
| `workout_programs` | Program latihan | ~200 |
| `workout_sessions` | Riwayat sesi latihan | ~10000 |
| `session_exercises` | Detail exercise per sesi | ~80000 |
| `exercises` | Library exercise | ~500 |
| `measurements` | Data tubuh client | ~5000 |
| `nutrition_logs` | Log nutrisi harian | ~15000 |
| `food_diary` | Makanan per log | ~60000 |
| `foods` | Database makanan | ~2000 |
| `meal_plans` | Rencana makan | ~300 |
| `notifications` | Notifikasi user | ~50000 |
| `audit_logs` | Audit trail | ~100000 |

---

## Master Data Tables

| Tabel | Deskripsi |
|---|---|
| `exercise_categories` | Kategori latihan (Strength, Cardio, dll) |
| `muscle_groups` | Kelompok otot (Chest, Back, dll) |
| `equipment` | Peralatan gym (Barbell, Dumbbell, dll) |
| `fitness_goals` | Tujuan fitness (Lose Weight, Build Muscle, dll) |
| `activity_levels` | Tingkat aktivitas (Sedentary, Active, dll) |
| `payment_methods` | Metode pembayaran (Transfer, Cash, dll) |
| `package_types` | Tipe paket (10 Sesi, 20 Sesi, Custom, dll) |
| `food_categories` | Kategori makanan (Protein, Karbohidrat, dll) |
| `measurement_types` | Tipe pengukuran |
| `notification_types` | Tipe notifikasi |

---

## Business Rules di Database Level

| Rule | Implementasi |
|---|---|
| Session hanya berkurang jika status = Completed | Trigger / Application logic |
| Workout tidak bisa dihapus jika ada histori | Foreign key constraint + soft delete |
| Audit Log semua perubahan | Trigger `audit_log_trigger` |
| Data terisolasi per user | Supabase RLS policies |
| Paket punya masa berlaku | `expires_at` column + cron check |

---

## Supabase Configuration

- **Auth**: Email/Password (Phase 1), Magic Link (Future)
- **Storage Buckets**: `avatars`, `progress-photos`, `documents`
- **Realtime**: Subscriptions untuk notifikasi, jadwal sesi
- **Edge Functions**: Trigger notifikasi, expire paket
- **Database**: PostgreSQL 15 (Supabase managed)
- **ORM**: Drizzle ORM dengan TypeScript type safety
