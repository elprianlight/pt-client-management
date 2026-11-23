-- 0400: RLS penuh untuk database PT Client Management (disesuaikan dengan skema produksi).
-- Prasyarat: tidak ada. Idempotent. Tidak mengubah/menghapus data pengguna.
-- Koneksi server (Drizzle/postgres/service_role) tetap melewati RLS (auth.uid() = null dianggap tepercaya).
-- Rollback darurat: ALTER TABLE public.<tabel> DISABLE ROW LEVEL SECURITY; (lihat daftar di bagian 3).

------------------------------------------------------------------------------------------------
-- 1. Fungsi bantu (SECURITY DEFINER agar tidak rekursif terhadap RLS)
------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS
$$ SELECT role::text FROM public.users WHERE id = auth.uid() AND is_active $$;
CREATE OR REPLACE FUNCTION public.app_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS
$$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active AND role = 'super_admin') $$;
CREATE OR REPLACE FUNCTION public.app_trainer_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS
$$ SELECT t.id FROM public.personal_trainers t JOIN public.users u ON u.id = t.user_id WHERE t.user_id = auth.uid() AND u.is_active AND u.role = 'personal_trainer' $$;
CREATE OR REPLACE FUNCTION public.app_client_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS
$$ SELECT c.id FROM public.clients c JOIN public.users u ON u.id = c.user_id WHERE c.user_id = auth.uid() AND u.is_active AND u.role = 'client' $$;
CREATE OR REPLACE FUNCTION public.app_my_trainer() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS
$$ SELECT c.trainer_id FROM public.clients c JOIN public.users u ON u.id = c.user_id WHERE c.user_id = auth.uid() AND u.is_active AND u.role = 'client' $$;
CREATE OR REPLACE FUNCTION public.app_is_end_user_nonadmin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS
$$ SELECT auth.uid() IS NOT NULL AND NOT public.app_is_admin() $$;
REVOKE EXECUTE ON FUNCTION public.app_role(), public.app_is_admin(), public.app_trainer_id(), public.app_client_id(), public.app_my_trainer(), public.app_is_end_user_nonadmin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_role(), public.app_is_admin(), public.app_trainer_id(), public.app_client_id(), public.app_my_trainer(), public.app_is_end_user_nonadmin() TO authenticated;

------------------------------------------------------------------------------------------------
-- 2. Trigger/fungsi database yang sudah ada: kunci search_path, jalankan sebagai pemilik, tandai "sistem"
------------------------------------------------------------------------------------------------
ALTER FUNCTION public.generate_receipt_number(integer) SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_assign_receipt_number() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_trg_sync_package_sessions() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_trg_sync_package_payment() SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.fn_recalc_package_sessions(p_package_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_used integer;
BEGIN
  IF p_package_id IS NULL THEN RETURN; END IF;
  SELECT COUNT(*)::integer INTO v_used FROM public.workout_sessions
   WHERE package_id = p_package_id AND (status = 'completed' OR (status IN ('cancelled','no_show') AND counts_toward_balance = true));
  PERFORM set_config('elp.sys', '1', true);
  UPDATE public.pt_packages SET used_sessions = COALESCE(v_used, 0), updated_at = now() WHERE id = p_package_id;
  PERFORM set_config('elp.sys', '', true);
END $$;

CREATE OR REPLACE FUNCTION public.fn_recalc_package_payment_status(p_package_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_total_price numeric; v_billing_type text; v_net_paid numeric;
BEGIN
  IF p_package_id IS NULL THEN RETURN; END IF;
  SELECT total_price, COALESCE(billing_type, 'prepaid') INTO v_total_price, v_billing_type FROM public.pt_packages WHERE id = p_package_id;
  IF NOT FOUND OR v_billing_type <> 'prepaid' THEN RETURN; END IF;
  SELECT COALESCE(SUM(CASE WHEN kind = 'refund' THEN -amount ELSE amount END), 0) INTO v_net_paid
    FROM public.pt_transactions WHERE package_id = p_package_id AND voided_at IS NULL AND payment_status = 'paid';
  PERFORM set_config('elp.sys', '1', true);
  UPDATE public.pt_packages SET payment_status = CASE
        WHEN v_net_paid >= v_total_price AND v_total_price > 0 THEN 'paid'::payment_status
        WHEN v_net_paid > 0 THEN 'partial'::payment_status ELSE 'pending'::payment_status END, updated_at = now()
   WHERE id = p_package_id;
  PERFORM set_config('elp.sys', '', true);
END $$;

-- Penjaga kolom sensitif (RLS tidak bisa membatasi per kolom)
CREATE OR REPLACE FUNCTION public.elp_guard_users() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF public.app_is_end_user_nonadmin() AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.role IS DISTINCT FROM OLD.role OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.username IS DISTINCT FROM OLD.username OR NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    RAISE EXCEPTION 'Tidak berwenang mengubah data akun';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.elp_guard_clients() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF public.app_is_end_user_nonadmin() AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.trainer_id IS DISTINCT FROM OLD.trainer_id OR NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat memindahkan atau menonaktifkan klien';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.elp_guard_packages() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF public.app_is_end_user_nonadmin() AND COALESCE(current_setting('elp.sys', true), '') <> '1' AND (
       NEW.trainer_id IS DISTINCT FROM OLD.trainer_id OR NEW.client_id IS DISTINCT FROM OLD.client_id OR NEW.billing_type IS DISTINCT FROM OLD.billing_type
    OR NEW.total_sessions IS DISTINCT FROM OLD.total_sessions OR NEW.total_price IS DISTINCT FROM OLD.total_price OR NEW.price_per_session IS DISTINCT FROM OLD.price_per_session
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status OR NEW.used_sessions IS DISTINCT FROM OLD.used_sessions) THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat mengubah harga, kuota, atau status pembayaran paket';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.elp_guard_sessions() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF public.app_is_end_user_nonadmin() AND (NEW.trainer_id IS DISTINCT FROM OLD.trainer_id OR NEW.client_id IS DISTINCT FROM OLD.client_id OR NEW.package_id IS DISTINCT FROM OLD.package_id) THEN
    RAISE EXCEPTION 'Sesi tidak boleh dipindahkan ke paket atau klien lain';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS elp_guard_users ON public.users;           CREATE TRIGGER elp_guard_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.elp_guard_users();
DROP TRIGGER IF EXISTS elp_guard_clients ON public.clients;       CREATE TRIGGER elp_guard_clients BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.elp_guard_clients();
DROP TRIGGER IF EXISTS elp_guard_packages ON public.pt_packages;  CREATE TRIGGER elp_guard_packages BEFORE UPDATE ON public.pt_packages FOR EACH ROW EXECUTE FUNCTION public.elp_guard_packages();
DROP TRIGGER IF EXISTS elp_guard_sessions ON public.workout_sessions; CREATE TRIGGER elp_guard_sessions BEFORE UPDATE ON public.workout_sessions FOR EACH ROW EXECUTE FUNCTION public.elp_guard_sessions();

ALTER VIEW public.package_balance SET (security_invoker = true);

------------------------------------------------------------------------------------------------
-- 3. Aktifkan RLS di semua tabel public, hapus policy lama bernama elp_*, tutup akses anon
------------------------------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.relname FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r' AND c.relname NOT LIKE '\_\_%' AND c.relname NOT LIKE 'drizzle%' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.relname);
  END LOOP;
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE 'elp\_%' LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  -- Admin boleh semua di semua tabel; kebijakan khusus di bawah menambah akses peran lain.
  FOR r IN SELECT c.relname FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r' AND c.relname NOT LIKE '\_\_%' AND c.relname NOT LIKE 'drizzle%' AND c.relname NOT IN ('receipt_sequences') LOOP
    EXECUTE format('CREATE POLICY elp_admin_all ON public.%I FOR ALL TO authenticated USING (public.app_is_admin()) WITH CHECK (public.app_is_admin())', r.relname);
  END LOOP;
END $$;

-- Tabel referensi: semua pengguna login boleh membaca
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['activity_levels','equipment','exercise_categories','exercises','fitness_goals','food_categories','foods','measurement_types','muscle_groups','notification_types','package_types','payment_methods','app_settings'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY elp_ref_read ON public.%I FOR SELECT TO authenticated USING (public.app_role() IS NOT NULL)', t);
    END IF;
  END LOOP;
END $$;

------------------------------------------------------------------------------------------------
-- 4. Kebijakan per tabel inti
------------------------------------------------------------------------------------------------
-- users
CREATE POLICY elp_users_select ON public.users FOR SELECT TO authenticated USING (
  id = auth.uid()
  OR (public.app_role() = 'personal_trainer' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.user_id = users.id AND c.trainer_id = public.app_trainer_id()))
  OR (public.app_role() = 'client' AND EXISTS (SELECT 1 FROM public.personal_trainers t WHERE t.user_id = users.id AND t.id = public.app_my_trainer())));
CREATE POLICY elp_users_insert ON public.users FOR INSERT TO authenticated WITH CHECK (public.app_role() = 'personal_trainer' AND role = 'client');
CREATE POLICY elp_users_update ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid() OR (public.app_role() = 'personal_trainer' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.user_id = users.id AND c.trainer_id = public.app_trainer_id())))
  WITH CHECK (id = auth.uid() OR (public.app_role() = 'personal_trainer' AND EXISTS (SELECT 1 FROM public.clients c WHERE c.user_id = users.id AND c.trainer_id = public.app_trainer_id())));

-- personal_trainers
CREATE POLICY elp_pt_select ON public.personal_trainers FOR SELECT TO authenticated USING (user_id = auth.uid() OR id = public.app_my_trainer());

-- clients
CREATE POLICY elp_clients_select ON public.clients FOR SELECT TO authenticated USING (trainer_id = public.app_trainer_id() OR id = public.app_client_id());
CREATE POLICY elp_clients_insert ON public.clients FOR INSERT TO authenticated WITH CHECK (public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id());
CREATE POLICY elp_clients_update ON public.clients FOR UPDATE TO authenticated USING (public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id()) WITH CHECK (public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id());

-- pt_packages
CREATE POLICY elp_pkg_select ON public.pt_packages FOR SELECT TO authenticated USING (trainer_id = public.app_trainer_id() OR client_id = public.app_client_id());
CREATE POLICY elp_pkg_insert ON public.pt_packages FOR INSERT TO authenticated WITH CHECK (
  public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id() AND payment_status = 'pending' AND used_sessions = 0
  AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.trainer_id = public.app_trainer_id()));
CREATE POLICY elp_pkg_update ON public.pt_packages FOR UPDATE TO authenticated USING (public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id()) WITH CHECK (public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id());

-- workout_sessions
CREATE POLICY elp_sess_select ON public.workout_sessions FOR SELECT TO authenticated USING (trainer_id = public.app_trainer_id() OR client_id = public.app_client_id());
CREATE POLICY elp_sess_insert ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK (
  public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id()
  AND EXISTS (SELECT 1 FROM public.pt_packages p WHERE p.id = package_id AND p.trainer_id = public.app_trainer_id() AND p.client_id = workout_sessions.client_id));
CREATE POLICY elp_sess_update ON public.workout_sessions FOR UPDATE TO authenticated USING (public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id()) WITH CHECK (public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id());

-- pt_transactions: hanya baca untuk PT/klien (tulis = Admin)
CREATE POLICY elp_trx_select ON public.pt_transactions FOR SELECT TO authenticated USING (trainer_id = public.app_trainer_id() OR client_id = public.app_client_id());

-- payment_reports: PT melapor dan membaca laporannya; Admin memproses
CREATE POLICY elp_rep_select ON public.payment_reports FOR SELECT TO authenticated USING (trainer_id = public.app_trainer_id());
CREATE POLICY elp_rep_insert ON public.payment_reports FOR INSERT TO authenticated WITH CHECK (
  public.app_role() = 'personal_trainer' AND trainer_id = public.app_trainer_id() AND status = 'pending' AND transaction_id IS NULL
  AND EXISTS (SELECT 1 FROM public.pt_packages p WHERE p.id = package_id AND p.trainer_id = public.app_trainer_id() AND p.client_id = payment_reports.client_id));

-- pt_bank_accounts: baca (PT sendiri / PT milik klien); tulis = Admin
CREATE POLICY elp_bank_select ON public.pt_bank_accounts FOR SELECT TO authenticated USING (trainer_id = public.app_trainer_id() OR trainer_id = public.app_my_trainer());

-- tabel pendukung (dibaca aplikasi lama lewat klien Supabase)
CREATE POLICY elp_meas_select ON public.measurements FOR SELECT TO authenticated USING (client_id = public.app_client_id() OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = measurements.client_id AND c.trainer_id = public.app_trainer_id()));
CREATE POLICY elp_nut_select ON public.nutrition_logs FOR SELECT TO authenticated USING (client_id = public.app_client_id() OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = nutrition_logs.client_id AND c.trainer_id = public.app_trainer_id()));
CREATE POLICY elp_meal_select ON public.meal_plans FOR SELECT TO authenticated USING (trainer_id = public.app_trainer_id() OR client_id = public.app_client_id());
CREATE POLICY elp_prog_select ON public.workout_programs FOR SELECT TO authenticated USING (trainer_id = public.app_trainer_id() OR client_id = public.app_client_id());
CREATE POLICY elp_sx_select ON public.session_exercises FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.workout_sessions s WHERE s.id = session_exercises.session_id AND (s.trainer_id = public.app_trainer_id() OR s.client_id = public.app_client_id())));
CREATE POLICY elp_notif_select ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY elp_notif_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- food_diary: hanya Admin (tidak dipakai klien web ini)

------------------------------------------------------------------------------------------------
-- 5. Storage: bukti transfer privat (folder pertama = id pengguna pengunggah); brand-assets tetap publik-baca
------------------------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow update brand assets" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Allow upload payment proofs and brand assets" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Public read payment proofs" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS elp_proofs_insert ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS elp_proofs_select ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS elp_brand_select ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS elp_brand_write ON storage.objects';
    EXECUTE 'UPDATE storage.buckets SET public = false WHERE id = ''payment-proofs''';
    EXECUTE $p$CREATE POLICY elp_proofs_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text)$p$;
    EXECUTE $p$CREATE POLICY elp_proofs_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.app_is_admin()))$p$;
    EXECUTE $p$CREATE POLICY elp_brand_select ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'brand-assets')$p$;
    EXECUTE $p$CREATE POLICY elp_brand_write ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'brand-assets' AND public.app_is_admin()) WITH CHECK (bucket_id = 'brand-assets' AND public.app_is_admin())$p$;
  END IF;
END $$;

------------------------------------------------------------------------------------------------
-- 6. Perbaikan data: sesi terpakai dihitung ulang (audit menemukan 2 paket selisih 1)
------------------------------------------------------------------------------------------------
SELECT public.fn_recalc_package_sessions(id) FROM public.pt_packages;
