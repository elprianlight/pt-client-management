# Database Schema: Personal Trainer Management (PT-Core)

Rancangan database ini dioptimalkan untuk Relational Database (MySQL/PostgreSQL) menggunakan ORM seperti Eloquent (Laravel). Pendekatan ini memisahkan `Clients`, `Packages`, dan `Subscriptions` (Paket aktif) agar history perpanjangan (renewals) tidak menimpa data lama.

## 1. Tabel `users` (Trainer / Admin)
Menyimpan data autentikasi Anda sebagai Personal Trainer.

| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | |
| `name` | VARCHAR | NOT NULL | Nama trainer |
| `email` | VARCHAR | UNIQUE, NOT NULL | |
| `password` | VARCHAR | NOT NULL | |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

## 2. Tabel `clients`
Menyimpan data profil dari 5 active clients Anda (dan client masa depan).

| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | |
| `name` | VARCHAR | NOT NULL | Nama lengkap client |
| `phone` | VARCHAR | NULL | Untuk notifikasi / WhatsApp |
| `status` | ENUM | default: 'active' | `active`, `inactive`, `lead` |
| `goals` | TEXT | NULL | Catatan target (hypertrophy, fat loss) |
| `created_at` | TIMESTAMP | | Tanggal bergabung |
| `updated_at` | TIMESTAMP | | |

## 3. Tabel `packages`
Master data untuk paket sesi yang Anda jual (10 Sesi, 20 Sesi).

| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | |
| `name` | VARCHAR | NOT NULL | cth: "Paket 10 Sesi", "Paket 20 Sesi" |
| `total_sessions`| INT | NOT NULL | 10 atau 20 |
| `price` | DECIMAL | NOT NULL | Harga paket |
| `validity_days` | INT | default: 90 | Masa berlaku paket (hari) |

## 4. Tabel `client_subscriptions` (Transaksi Perpanjangan)
Setiap kali client membeli/memperpanjang paket, masuk sebagai row baru di sini. Ini memungkinkan tracking "Revenue Bulan Ini".

| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | |
| `client_id` | BIGINT | FK -> clients.id | |
| `package_id` | BIGINT | FK -> packages.id | |
| `start_date` | DATE | NOT NULL | Tanggal mulai paket |
| `end_date` | DATE | NOT NULL | Tanggal kedaluwarsa paket |
| `sessions_total`| INT | NOT NULL | Snapshot jumlah sesi (10/20) |
| `sessions_used` | INT | default: 0 | Jumlah sesi yang sudah terpakai |
| `status` | ENUM | default: 'active' | `active`, `completed`, `expired` |
| `amount_paid` | DECIMAL | NOT NULL | Harga yang dibayar (untuk laporan) |

## 5. Tabel `sessions` (Log Latihan)
Catatan harian untuk tracking kehadiran, jenis latihan, dan intensitas.

| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | |
| `subscription_id`| BIGINT | FK -> client_subscriptions.id | Mengurangi kuota dari paket mana |
| `client_id` | BIGINT | FK -> clients.id | Redundansi aman untuk query cepat |
| `scheduled_at` | DATETIME| NOT NULL | Jadwal latihan (Tgl & Jam) |
| `status` | ENUM | default: 'scheduled'| `scheduled`, `completed`, `cancelled`|
| `workout_split` | VARCHAR | NULL | cth: "Upper Body", "Lower Body", "Full Body" |
| `rpe_score` | INT | NULL | Rate of Perceived Exertion (1-10) |
| `trainer_notes` | TEXT | NULL | Catatan performa, progress beban, dll |
| `created_at` | TIMESTAMP | | |

---

## Relasi Eloquent (Laravel) Concept:

- **Client** `hasMany` **Subscriptions**
- **Client** `hasMany` **Sessions**
- **Subscription** `belongsTo` **Package**
- **Subscription** `hasMany` **Sessions**
- **Session** `belongsTo` **Subscription**

## Logika Bisnis (Backend Flow):
1. **Pendaftaran/Perpanjangan**: Saat Marysa atau Dana membeli paket 10 sesi, buat 1 record di `client_subscriptions`. `sessions_used` = 0.
2. **Log Latihan**: Saat sesi selesai (`status` di-update jadi 'completed' di tabel `sessions`), trigger event/observer untuk menaikkan nilai `sessions_used` di `client_subscriptions` sebanyak +1.
3. **Peringatan Sisa Sesi**: Hitung `(sessions_total - sessions_used)`. Jika hasilnya <= 2, tampilkan di "Notification Center" pada Dashboard.
