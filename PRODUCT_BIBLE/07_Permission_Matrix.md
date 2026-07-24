# 07 — Permission Matrix

## Overview

Dokumen ini mendefinisikan hak akses setiap role terhadap setiap fitur dalam sistem PT Client Management.

---

## Matrix Akses

| Feature | Super Admin | Personal Trainer | Client |
|---|:---:|:---:|:---:|
| **Dashboard** | ✅ Full | ✅ Own Data | ✅ Own Data |
| **Tambah PT** | ✅ | ❌ | ❌ |
| **Edit/Delete PT** | ✅ | ❌ | ❌ |
| **Lihat Semua PT** | ✅ | ❌ | ❌ |
| **Tambah Client** | ✅ | ✅ | ❌ |
| **Edit Client** | ✅ | ✅ Own | ❌ |
| **Delete Client** | ✅ | ❌ | ❌ |
| **Lihat Client** | ✅ All | ✅ Own | ✅ Self |
| **Tambah Paket** | ✅ | ✅ | ❌ |
| **Edit Paket** | ✅ | ✅ Own | ❌ |
| **Lihat Paket** | ✅ All | ✅ Own | ✅ Self |
| **Workout Library** | ✅ | ✅ | View Only |
| **Buat Program Workout** | ✅ | ✅ | ❌ |
| **Lihat Workout** | ✅ | ✅ | ✅ Own |
| **Jadwal Sesi** | ✅ | ✅ | ❌ |
| **Complete Sesi** | ✅ | ✅ | ❌ |
| **Cancel/Reschedule** | ✅ | ✅ | ❌ |
| **Nutrition Input** | ✅ | ✅ | ✅ |
| **Nutrition View** | ✅ All | ✅ Own Client | ✅ Self |
| **Progress/Measurement** | ✅ | ✅ | View Only |
| **Before/After Photo** | ✅ | ✅ | View Only |
| **Reports** | ✅ All | ✅ Own | ✅ Self |
| **Audit Log** | ✅ | ❌ | ❌ |
| **Master Data** | ✅ | ❌ | ❌ |
| **Settings** | ✅ | ✅ Own | ✅ Own |

---

## Implementasi RBAC

### Supabase Row Level Security (RLS)

```sql
-- Client hanya bisa lihat data sendiri
CREATE POLICY "client_own_data" ON clients
  USING (user_id = auth.uid());

-- PT hanya bisa lihat client miliknya
CREATE POLICY "pt_own_clients" ON clients
  USING (trainer_id = (SELECT id FROM personal_trainers WHERE user_id = auth.uid()));

-- Super Admin bypass semua RLS
CREATE POLICY "super_admin_all" ON clients
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin');
```

### Next.js Middleware

Middleware melakukan redirect berdasarkan role pada route yang diakses.

| Route | Allowed Roles |
|---|---|
| `/dashboard` | All |
| `/pt` | super_admin only |
| `/clients` | super_admin, personal_trainer |
| `/packages` | super_admin, personal_trainer |
| `/workout` | All |
| `/session` | All |
| `/nutrition` | All |
| `/progress` | All |
| `/reports` | All |
| `/settings` | All |
