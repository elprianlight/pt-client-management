-- PRD v2: pencatatan sesi dan pembayaran sesi
-- Aman dijalankan berulang (idempotent). Jalankan SEBELUM men-deploy kode PRD v2.

-- 1. Keputusan PT untuk batal / no-show
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS counts_toward_balance boolean NOT NULL DEFAULT false;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS count_reason text;

-- 2. Paket tidak kedaluwarsa
ALTER TABLE pt_packages ALTER COLUMN expires_at DROP NOT NULL;

-- 3. Transaksi: jenis dan void
ALTER TABLE pt_transactions ADD COLUMN IF NOT EXISTS kind varchar(20) NOT NULL DEFAULT 'payment';
ALTER TABLE pt_transactions ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE pt_transactions ADD COLUMN IF NOT EXISTS void_reason text;
ALTER TABLE pt_transactions ADD COLUMN IF NOT EXISTS voided_by uuid;

-- 4. Rekening tujuan transfer per PT
CREATE TABLE IF NOT EXISTS pt_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES personal_trainers(id) ON DELETE CASCADE,
  bank_name varchar(100) NOT NULL,
  account_number varchar(50) NOT NULL,
  account_holder varchar(150) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bank_trainer_id_idx ON pt_bank_accounts(trainer_id);

-- 5. Laporan pembayaran dari PT (menunggu konfirmasi Admin)
CREATE TABLE IF NOT EXISTS payment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES personal_trainers(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  package_id uuid NOT NULL REFERENCES pt_packages(id),
  amount numeric(12,2) NOT NULL,
  proof_path text NOT NULL,
  notes text,
  period_month varchar(7),
  status varchar(20) NOT NULL DEFAULT 'pending',
  reject_reason text,
  transaction_id uuid REFERENCES pt_transactions(id),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payrep_status_idx ON payment_reports(status);
CREATE INDEX IF NOT EXISTS payrep_trainer_id_idx ON payment_reports(trainer_id);

-- 6. Penghitung nomor kuitansi ELP-TAHUN-URUTAN
CREATE TABLE IF NOT EXISTS receipt_counters (
  year integer PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0
);

-- 7. RLS: tabel baru tertutup untuk akses langsung dari klien Supabase.
--    Aplikasi mengakses lewat koneksi server (Drizzle) yang tidak terkena RLS.
ALTER TABLE pt_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_counters ENABLE ROW LEVEL SECURITY;

-- 8. View saldo paket: sisa sesi, total dibayar, sisa tagihan (dihitung dari sesi dan transaksi)
CREATE OR REPLACE VIEW package_balance AS
SELECT
  p.id AS package_id,
  p.client_id,
  p.trainer_id,
  p.billing_type,
  p.total_sessions,
  COALESCE(s.counted, 0)::int AS counted_sessions,
  (p.total_sessions - COALESCE(s.counted, 0))::int AS remaining_sessions,
  p.total_price,
  COALESCE(t.paid, 0) AS total_paid,
  (p.total_price - COALESCE(t.paid, 0)) AS outstanding
FROM pt_packages p
LEFT JOIN (
  SELECT package_id,
         COUNT(*) FILTER (WHERE status = 'completed'
                          OR (status IN ('cancelled','no_show') AND counts_toward_balance)) AS counted
  FROM workout_sessions GROUP BY package_id
) s ON s.package_id = p.id
LEFT JOIN (
  SELECT package_id,
         SUM(CASE WHEN kind = 'refund' THEN -amount ELSE amount END)
           FILTER (WHERE voided_at IS NULL AND payment_status IN ('paid','partial')) AS paid
  FROM pt_transactions GROUP BY package_id
) t ON t.package_id = p.id;

-- 9. Bucket privat untuk bukti transfer (folder pertama = id pengguna pengunggah)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "payment_proofs_insert_own" ON storage.objects;
CREATE POLICY "payment_proofs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "payment_proofs_select_own_or_admin" ON storage.objects;
CREATE POLICY "payment_proofs_select_own_or_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
    )
  );
