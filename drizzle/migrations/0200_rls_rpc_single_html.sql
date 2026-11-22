-- =============================================================================
-- 0200: RLS + fungsi database untuk klien HTML tunggal (browser -> Supabase langsung)
--
-- Prasyarat: 0000 (baseline) dan 0100 (PRD v2) sudah dijalankan.
-- Idempotent: aman dijalankan ulang.
--
-- Prinsip:
--  * Semua tabel di schema public: RLS DINYALAKAN (default tertutup).
--  * Browser hanya BACA lewat policy per peran; semua TULIS yang menyangkut uang,
--    saldo sesi, dan akun lewat fungsi app_* (SECURITY DEFINER) yang memeriksa peran sendiri.
--  * Aplikasi Next.js lama memakai koneksi Postgres langsung (peran postgres) sehingga
--    tidak terpengaruh RLS.
--  * auth.uid() = users.id (akun dibuat lewat Supabase Auth, email username@pt.local).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Fungsi bantu identitas (SECURITY DEFINER: tidak memicu RLS berulang)
-- -----------------------------------------------------------------------------
create or replace function public.app_role() returns user_role
language sql stable security definer set search_path = public, pg_temp as $$
  select role from public.users where id = auth.uid() and is_active
$$;

create or replace function public.app_trainer_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select id from public.personal_trainers where user_id = auth.uid() limit 1
$$;

create or replace function public.app_client_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select id from public.clients where user_id = auth.uid() limit 1
$$;

create or replace function public.app_can_see_trainer(tid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select case public.app_role()
    when 'super_admin' then true
    when 'personal_trainer' then tid = public.app_trainer_id()
    when 'client' then tid = (select trainer_id from public.clients where id = public.app_client_id())
    else false end
$$;

create or replace function public.app_can_see_client(cid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select case public.app_role()
    when 'super_admin' then true
    when 'personal_trainer' then exists (select 1 from public.clients c where c.id = cid and c.trainer_id = public.app_trainer_id())
    when 'client' then cid = public.app_client_id()
    else false end
$$;

create or replace function public.app_can_see_user(uid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select uid = auth.uid()
    or public.app_role() = 'super_admin'
    or exists (select 1 from public.clients c where c.user_id = uid and public.app_can_see_client(c.id))
    or exists (select 1 from public.personal_trainers p where p.user_id = uid and public.app_can_see_trainer(p.id))
$$;

-- -----------------------------------------------------------------------------
-- 2. RLS: nyalakan di SEMUA tabel public (default tertutup)
-- -----------------------------------------------------------------------------
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename not like 'drizzle%' and tablename not like '\_\_%' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Policy BACA per peran
-- -----------------------------------------------------------------------------
do $$
declare p record;
begin
  -- bersihkan policy lama yang kita kelola (idempotent)
  for p in select policyname, tablename from pg_policies where schemaname = 'public' and policyname like 'app\_%' loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy app_users_select on public.users for select to authenticated
  using (public.app_can_see_user(id));
create policy app_users_admin_update on public.users for update to authenticated
  using (public.app_role() = 'super_admin') with check (public.app_role() = 'super_admin');

create policy app_pt_select on public.personal_trainers for select to authenticated
  using (public.app_can_see_trainer(id));
create policy app_pt_admin_update on public.personal_trainers for update to authenticated
  using (public.app_role() = 'super_admin') with check (public.app_role() = 'super_admin');

create policy app_clients_select on public.clients for select to authenticated
  using (public.app_can_see_client(id));
create policy app_clients_update on public.clients for update to authenticated
  using (public.app_role() in ('super_admin','personal_trainer') and public.app_can_see_client(id))
  with check (public.app_role() in ('super_admin','personal_trainer') and public.app_can_see_client(id));

create policy app_pkg_select on public.pt_packages for select to authenticated
  using (public.app_can_see_client(client_id));
create policy app_trx_select on public.pt_transactions for select to authenticated
  using (public.app_can_see_client(client_id));
create policy app_sess_select on public.workout_sessions for select to authenticated
  using (public.app_can_see_client(client_id));

create policy app_bank_select on public.pt_bank_accounts for select to authenticated
  using (public.app_can_see_trainer(trainer_id));
create policy app_bank_admin_all on public.pt_bank_accounts for all to authenticated
  using (public.app_role() = 'super_admin') with check (public.app_role() = 'super_admin');

-- Laporan pembayaran: Admin semua, PT miliknya; klien tidak melihat
create policy app_rep_select on public.payment_reports for select to authenticated
  using (public.app_role() = 'super_admin'
         or (public.app_role() = 'personal_trainer' and trainer_id = public.app_trainer_id()));

-- Tabel referensi: semua pengguna masuk boleh baca
create policy app_ref_package_types on public.package_types for select to authenticated using (true);
create policy app_ref_payment_methods on public.payment_methods for select to authenticated using (true);

-- Audit log: hanya Admin membaca; penulisan lewat fungsi
create policy app_audit_select on public.audit_logs for select to authenticated
  using (public.app_role() = 'super_admin');

-- Tahap berikutnya (Workout, Nutrisi, Progres, Laporan) sengaja belum diberi policy:
-- tabelnya tetap tertutup dari browser sampai modul itu ditambahkan.

-- -----------------------------------------------------------------------------
-- 4. Hak akses: cabut dari anon, beri authenticated hanya yang perlu
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke insert, delete, truncate on all tables in schema public from authenticated;
-- update hanya lewat policy di atas (users, personal_trainers, clients, bank via 'all')
revoke update on public.pt_packages, public.pt_transactions, public.workout_sessions,
  public.payment_reports, public.receipt_counters, public.audit_logs from authenticated;
grant insert, delete on public.pt_bank_accounts to authenticated;
-- clients: update dibatasi per kolom (user_id tidak boleh diubah dari browser)
revoke update on public.clients from authenticated;
grant update (trainer_id, date_of_birth, gender, height, current_weight, fitness_goal, medical_notes,
              emergency_contact_name, emergency_contact_phone, is_active, updated_at) on public.clients to authenticated;
revoke update on public.users from authenticated;
grant update (full_name, phone, is_active, updated_at) on public.users to authenticated;
revoke update on public.personal_trainers from authenticated;
grant update (specialization, bio, years_experience, certifications, price_per_session, is_active, updated_at) on public.personal_trainers to authenticated;
grant select on all tables in schema public to authenticated;
revoke select on public.receipt_counters from authenticated;

-- -----------------------------------------------------------------------------
-- 5. Fungsi inti (bukan untuk dipanggil browser langsung)
-- -----------------------------------------------------------------------------
create or replace function public.app_audit(p_action text, p_table text, p_record uuid, p_old jsonb, p_new jsonb)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  values (auth.uid(), p_action, p_table, p_record, p_old, p_new)
$$;
revoke execute on function public.app_audit(text, text, uuid, jsonb, jsonb) from public, anon, authenticated;

create or replace function public.app_is_postpaid(p public.pt_packages) returns boolean
language sql immutable as $$
  select p.billing_type = 'postpaid'
      or lower(coalesce(p.package_name, '')) like '%pascabayar%'
      or lower(coalesce(p.package_name, '')) like '%postpaid%'
$$;

create or replace function public.app_paid_for(p_package uuid) returns numeric
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(sum(case when kind = 'refund' then -amount else amount end), 0)
  from public.pt_transactions
  where package_id = p_package and voided_at is null and payment_status in ('paid', 'partial')
$$;
revoke execute on function public.app_paid_for(uuid) from public, anon;

create or replace function public.app_recalc_package_payment(p_package uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare pkg public.pt_packages; paid numeric; st payment_status;
begin
  select * into pkg from public.pt_packages where id = p_package;
  if not found or public.app_is_postpaid(pkg) then return; end if;
  paid := public.app_paid_for(p_package);
  st := case when pkg.total_price > 0 and paid >= pkg.total_price then 'paid'
             when paid > 0 then 'partial' else 'pending' end;
  update public.pt_packages set payment_status = st, updated_at = now() where id = p_package;
end $$;
revoke execute on function public.app_recalc_package_payment(uuid) from public, anon, authenticated;

create or replace function public.app_next_receipt() returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare y int := extract(year from (now() at time zone 'Asia/Jakarta'))::int; n int;
begin
  insert into public.receipt_counters (year, last_number) values (y, 1)
  on conflict (year) do update set last_number = public.receipt_counters.last_number + 1
  returning last_number into n;
  return 'ELP-' || y || '-' || lpad(n::text, 4, '0');
end $$;
revoke execute on function public.app_next_receipt() from public, anon, authenticated;

create or replace function public.app_insert_payment(p_package uuid, p_amount numeric, p_notes text, p_month text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare pkg public.pt_packages; post boolean; outstanding numeric; rn text; tid uuid; note text;
begin
  select * into pkg from public.pt_packages where id = p_package for update;
  if not found then raise exception 'Paket tidak ditemukan'; end if;
  post := public.app_is_postpaid(pkg);
  if not post then
    outstanding := pkg.total_price - public.app_paid_for(pkg.id);
    if p_amount > outstanding + 0.005 then
      raise exception 'Pembayaran melebihi sisa tagihan (sisa Rp %)', replace(to_char(greatest(outstanding, 0), 'FM999,999,999,990'), ',', '.');
    end if;
  end if;
  rn := public.app_next_receipt();
  note := nullif(concat_ws(' — ',
            case when post and p_month is not null then 'Billing Pascabayar: ' || p_month end,
            nullif(btrim(coalesce(p_notes, '')), '')), '');
  insert into public.pt_transactions (package_id, trainer_id, client_id, amount, payment_status, payment_date, receipt_number, kind, notes)
  values (pkg.id, pkg.trainer_id, pkg.client_id, p_amount, 'paid', now(), rn, 'payment', note)
  returning id into tid;
  perform public.app_recalc_package_payment(pkg.id);
  return jsonb_build_object('transaction_id', tid, 'receipt_number', rn, 'client_id', pkg.client_id);
end $$;
revoke execute on function public.app_insert_payment(uuid, numeric, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC pembayaran
-- -----------------------------------------------------------------------------
create or replace function public.app_record_payment(p_package uuid, p_amount numeric, p_notes text default null, p_month text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare r jsonb;
begin
  if public.app_role() is distinct from 'super_admin' then raise exception 'Hanya Admin yang dapat mencatat pembayaran'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Jumlah harus lebih dari 0'; end if;
  if p_month is not null and p_month !~ '^\d{4}-\d{2}$' then raise exception 'Format bulan tidak valid'; end if;
  r := public.app_insert_payment(p_package, p_amount, p_notes, p_month);
  perform public.app_audit('RECORD_PAYMENT', 'pt_transactions', (r->>'transaction_id')::uuid, null,
    jsonb_build_object('package_id', p_package, 'amount', p_amount, 'receipt_number', r->>'receipt_number'));
  return r;
end $$;

create or replace function public.app_void_transaction(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare trx public.pt_transactions;
begin
  if public.app_role() is distinct from 'super_admin' then raise exception 'Hanya Admin yang dapat mem-void transaksi'; end if;
  if btrim(coalesce(p_reason, '')) = '' then raise exception 'Alasan void wajib diisi'; end if;
  select * into trx from public.pt_transactions where id = p_id for update;
  if not found then raise exception 'Transaksi tidak ditemukan'; end if;
  if trx.voided_at is not null then raise exception 'Transaksi sudah di-void'; end if;
  update public.pt_transactions set voided_at = now(), void_reason = btrim(p_reason), voided_by = auth.uid() where id = p_id;
  perform public.app_recalc_package_payment(trx.package_id);
  perform public.app_audit('VOID_TRANSACTION', 'pt_transactions', p_id,
    jsonb_build_object('amount', trx.amount, 'receipt_number', trx.receipt_number), jsonb_build_object('void_reason', btrim(p_reason)));
end $$;

create or replace function public.app_submit_payment_report(p_package uuid, p_amount numeric, p_proof_path text, p_notes text default null, p_period_month text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare pkg public.pt_packages; rid uuid;
begin
  if public.app_role() is distinct from 'personal_trainer' or public.app_trainer_id() is null then
    raise exception 'Hanya PT yang dapat melaporkan pembayaran'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Jumlah harus lebih dari 0'; end if;
  if p_proof_path is null or length(p_proof_path) < 3 then raise exception 'Foto bukti transfer wajib diunggah'; end if;
  if left(p_proof_path, 37) <> auth.uid()::text || '/' then raise exception 'Bukti transfer tidak valid'; end if;
  if p_period_month is not null and p_period_month !~ '^\d{4}-\d{2}$' then raise exception 'Format bulan tidak valid'; end if;
  select * into pkg from public.pt_packages where id = p_package;
  if not found or pkg.trainer_id <> public.app_trainer_id() then raise exception 'Paket bukan milik klien Anda'; end if;
  insert into public.payment_reports (trainer_id, client_id, package_id, amount, proof_path, notes, period_month)
  values (pkg.trainer_id, pkg.client_id, pkg.id, p_amount, p_proof_path, nullif(btrim(coalesce(p_notes, '')), ''),
          case when public.app_is_postpaid(pkg) then p_period_month end)
  returning id into rid;
  perform public.app_audit('SUBMIT_PAYMENT_REPORT', 'payment_reports', rid, null, jsonb_build_object('package_id', p_package, 'amount', p_amount));
  return rid;
end $$;

create or replace function public.app_confirm_payment_report(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare rep public.payment_reports; r jsonb;
begin
  if public.app_role() is distinct from 'super_admin' then raise exception 'Hanya Admin yang dapat mengonfirmasi'; end if;
  select * into rep from public.payment_reports where id = p_id for update;
  if not found then raise exception 'Laporan tidak ditemukan'; end if;
  if rep.status <> 'pending' then raise exception 'Laporan sudah diproses'; end if;
  r := public.app_insert_payment(rep.package_id, rep.amount,
         'Laporan PT' || case when rep.notes is not null then ': ' || rep.notes else '' end, rep.period_month);
  update public.payment_reports set status = 'confirmed', transaction_id = (r->>'transaction_id')::uuid,
         reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
  perform public.app_audit('CONFIRM_PAYMENT_REPORT', 'payment_reports', p_id, null,
    jsonb_build_object('transaction_id', r->>'transaction_id', 'receipt_number', r->>'receipt_number'));
  return r;
end $$;

create or replace function public.app_reject_payment_report(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare rep public.payment_reports;
begin
  if public.app_role() is distinct from 'super_admin' then raise exception 'Hanya Admin yang dapat menolak laporan'; end if;
  if btrim(coalesce(p_reason, '')) = '' then raise exception 'Alasan penolakan wajib diisi'; end if;
  select * into rep from public.payment_reports where id = p_id for update;
  if not found then raise exception 'Laporan tidak ditemukan'; end if;
  if rep.status <> 'pending' then raise exception 'Laporan sudah diproses'; end if;
  update public.payment_reports set status = 'rejected', reject_reason = btrim(p_reason), reviewed_by = auth.uid(), reviewed_at = now() where id = p_id;
  perform public.app_audit('REJECT_PAYMENT_REPORT', 'payment_reports', p_id, null, jsonb_build_object('reason', btrim(p_reason)));
end $$;

-- -----------------------------------------------------------------------------
-- 7. RPC sesi latihan
-- -----------------------------------------------------------------------------
create or replace function public.app_session_counted(p_status session_status, p_counts boolean) returns boolean
language sql immutable as $$
  select p_status = 'completed' or (p_status in ('cancelled', 'no_show') and coalesce(p_counts, false))
$$;

-- Akses tulis sesi: Admin atau PT pemilik sesi
create or replace function public.app_assert_session_writer(p_trainer uuid) returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.app_role() = 'super_admin' then return; end if;
  if public.app_role() = 'personal_trainer' and p_trainer = public.app_trainer_id() then return; end if;
  raise exception 'Unauthorized: sesi ini bukan milik Anda';
end $$;
revoke execute on function public.app_assert_session_writer(uuid) from public, anon, authenticated;

create or replace function public.app_set_session_status(p_session uuid, p_status session_status, p_counts boolean default false, p_reason text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.workout_sessions; is_cancel boolean; new_counts boolean; new_reason text; old_c boolean; new_c boolean; delta int;
begin
  select * into s from public.workout_sessions where id = p_session for update;
  if not found then raise exception 'Sesi tidak ditemukan'; end if;
  perform public.app_assert_session_writer(s.trainer_id);
  is_cancel := p_status in ('cancelled', 'no_show');
  if is_cancel and btrim(coalesce(p_reason, '')) = '' then raise exception 'Alasan wajib diisi untuk sesi batal atau no-show'; end if;
  new_counts := case when is_cancel then coalesce(p_counts, false) else false end;
  new_reason := case when is_cancel then btrim(p_reason) end;
  if s.status = p_status and s.counts_toward_balance = new_counts and s.count_reason is not distinct from new_reason then return; end if;
  old_c := public.app_session_counted(s.status, s.counts_toward_balance);
  new_c := public.app_session_counted(p_status, new_counts);
  delta := new_c::int - old_c::int;
  update public.workout_sessions set
    status = p_status, counts_toward_balance = new_counts, count_reason = new_reason,
    completed_at = case when p_status = 'completed' then now() when s.status = 'completed' then null else s.completed_at end,
    check_in_at = case when p_status = 'check_in' then coalesce(s.check_in_at, now()) when p_status = 'scheduled' then null else s.check_in_at end,
    updated_at = now()
  where id = p_session;
  if delta <> 0 then
    update public.pt_packages set used_sessions = greatest(used_sessions + delta, 0) where id = s.package_id;
  end if;
  perform public.app_audit('UPDATE_SESSION_STATUS', 'workout_sessions', p_session,
    jsonb_build_object('status', s.status, 'counts', s.counts_toward_balance, 'reason', s.count_reason),
    jsonb_build_object('status', p_status, 'counts', new_counts, 'reason', new_reason));
end $$;

create or replace function public.app_check_in_session(p_session uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.workout_sessions;
begin
  select * into s from public.workout_sessions where id = p_session for update;
  if not found then raise exception 'Sesi tidak ditemukan'; end if;
  perform public.app_assert_session_writer(s.trainer_id);
  if s.status = 'completed' then raise exception 'Sesi ini sudah berstatus Selesai'; end if;
  update public.workout_sessions set status = 'check_in', check_in_at = now(), updated_at = now() where id = p_session;
  perform public.app_audit('CHECK_IN_SESSION', 'workout_sessions', p_session, jsonb_build_object('status', s.status), jsonb_build_object('status', 'check_in'));
end $$;

create or replace function public.app_complete_session(p_session uuid, p_rpe int default null, p_notes text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.workout_sessions; n text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  select * into s from public.workout_sessions where id = p_session for update;
  if not found then raise exception 'Sesi tidak ditemukan'; end if;
  perform public.app_assert_session_writer(s.trainer_id);
  if p_rpe is not null and (p_rpe < 1 or p_rpe > 10) then raise exception 'RPE harus 1 sampai 10'; end if;
  update public.workout_sessions set rpe = p_rpe,
    pt_notes = coalesce(n, pt_notes),
    session_notes = case when n is not null and left(btrim(coalesce(session_notes, '')), 1) not in ('[', '{') then n else session_notes end,
    updated_at = now()
  where id = p_session;
  perform public.app_set_session_status(p_session, 'completed', false, null);
end $$;

create or replace function public.app_schedule_session(p_package uuid, p_scheduled_at timestamptz, p_program_type text,
  p_location text default null, p_notes text default null, p_status session_status default 'scheduled')
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare pkg public.pt_packages; sid uuid; n text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  select * into pkg from public.pt_packages where id = p_package for update;
  if not found then raise exception 'Paket tidak ditemukan'; end if;
  perform public.app_assert_session_writer(pkg.trainer_id);
  if btrim(coalesce(p_program_type, '')) = '' then raise exception 'Pilih program latihan'; end if;
  if not public.app_is_postpaid(pkg) and pkg.used_sessions >= pkg.total_sessions then raise exception 'Kuota sesi paket ini sudah habis'; end if;
  insert into public.workout_sessions (package_id, trainer_id, client_id, scheduled_at, completed_at, check_in_at, duration, program_type, session_notes, pt_notes, location, status)
  values (pkg.id, pkg.trainer_id, pkg.client_id, p_scheduled_at,
          case when p_status = 'completed' then now() end, case when p_status = 'check_in' then now() end,
          60, btrim(p_program_type), n, n, nullif(btrim(coalesce(p_location, '')), ''), p_status)
  returning id into sid;
  if p_status = 'completed' then
    update public.pt_packages set used_sessions = used_sessions + 1 where id = pkg.id;
  end if;
  return sid;
end $$;

create or replace function public.app_update_session(p_session uuid, p_scheduled_at timestamptz, p_program_type text,
  p_location text default null, p_notes text default null, p_rpe int default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.workout_sessions; n text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  select * into s from public.workout_sessions where id = p_session for update;
  if not found then raise exception 'Sesi tidak ditemukan'; end if;
  perform public.app_assert_session_writer(s.trainer_id);
  if p_rpe is not null and (p_rpe < 1 or p_rpe > 10) then raise exception 'RPE harus 1 sampai 10'; end if;
  update public.workout_sessions set scheduled_at = p_scheduled_at, program_type = btrim(p_program_type),
    location = nullif(btrim(coalesce(p_location, '')), ''), session_notes = n, pt_notes = n, rpe = p_rpe, updated_at = now()
  where id = p_session;
end $$;

create or replace function public.app_delete_session(p_session uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.workout_sessions;
begin
  select * into s from public.workout_sessions where id = p_session for update;
  if not found then raise exception 'Sesi tidak ditemukan'; end if;
  perform public.app_assert_session_writer(s.trainer_id);
  if public.app_session_counted(s.status, s.counts_toward_balance) then
    update public.pt_packages set used_sessions = greatest(used_sessions - 1, 0) where id = s.package_id;
  end if;
  delete from public.workout_sessions where id = p_session;
  perform public.app_audit('DELETE_SESSION', 'workout_sessions', p_session, to_jsonb(s), null);
end $$;

-- -----------------------------------------------------------------------------
-- 8. RPC paket
-- -----------------------------------------------------------------------------
create or replace function public.app_sell_package(p_client uuid, p_name text, p_total_sessions int, p_price_per_session numeric,
  p_start date default current_date, p_notes text default null, p_billing text default 'prepaid', p_paid_now boolean default false)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.clients; pid uuid; total numeric; cname text;
begin
  if public.app_role() not in ('super_admin', 'personal_trainer') then raise exception 'Unauthorized'; end if;
  select * into c from public.clients where id = p_client;
  if not found then raise exception 'Client tidak ditemukan'; end if;
  if public.app_role() = 'personal_trainer' and c.trainer_id <> public.app_trainer_id() then raise exception 'Client bukan milik Anda'; end if;
  if p_billing not in ('prepaid', 'postpaid') then raise exception 'Jenis tagihan tidak valid'; end if;
  if p_price_per_session is null or p_price_per_session < 0 then raise exception 'Harga tidak valid'; end if;
  if p_billing = 'postpaid' then
    select full_name into cname from public.users where id = c.user_id;
    insert into public.pt_packages (trainer_id, client_id, package_name, total_sessions, used_sessions, price_per_session, total_price,
                                    payment_status, billing_type, start_date, expires_at, notes)
    values (c.trainer_id, c.id, 'Pascabayar Bulanan - ' || coalesce(cname, 'Client'), 999, 0, p_price_per_session, 0,
            'pending', 'postpaid', coalesce(p_start, current_date), null,
            'Pascabayar: latihan dulu, ditagih setiap bulan.')
    returning id into pid;
  else
    if btrim(coalesce(p_name, '')) = '' then raise exception 'Nama paket wajib diisi'; end if;
    if p_total_sessions is null or p_total_sessions < 1 then raise exception 'Minimal 1 sesi'; end if;
    total := p_total_sessions * p_price_per_session;
    insert into public.pt_packages (trainer_id, client_id, package_name, total_sessions, used_sessions, price_per_session, total_price,
                                    payment_status, billing_type, start_date, expires_at, notes)
    values (c.trainer_id, c.id, btrim(p_name), p_total_sessions, 0, p_price_per_session, total,
            'pending', 'prepaid', coalesce(p_start, current_date), null, nullif(btrim(coalesce(p_notes, '')), ''))
    returning id into pid;
    if p_paid_now then
      if public.app_role() <> 'super_admin' then raise exception 'Hanya Admin yang dapat mencatat pembayaran'; end if;
      if total > 0 then perform public.app_insert_payment(pid, total, 'Pembayaran lunas saat penjualan paket', null); end if;
    end if;
  end if;
  perform public.app_audit('SELL_PACKAGE', 'pt_packages', pid, null, jsonb_build_object('client_id', p_client, 'billing', p_billing));
  return pid;
end $$;

create or replace function public.app_update_package(p_package uuid, p_name text, p_total_sessions int, p_price_per_session numeric, p_notes text default null, p_is_active boolean default true)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare pkg public.pt_packages;
begin
  select * into pkg from public.pt_packages where id = p_package for update;
  if not found then raise exception 'Paket tidak ditemukan'; end if;
  if public.app_role() = 'client' or not public.app_can_see_client(pkg.client_id) then raise exception 'Unauthorized'; end if;
  if p_price_per_session < 0 then raise exception 'Harga tidak valid'; end if;
  if not public.app_is_postpaid(pkg) and p_total_sessions < pkg.used_sessions then
    raise exception 'Total sesi tidak boleh kurang dari sesi terpakai (%)', pkg.used_sessions; end if;
  update public.pt_packages set
    package_name = btrim(p_name),
    total_sessions = case when public.app_is_postpaid(pkg) then total_sessions else p_total_sessions end,
    price_per_session = p_price_per_session,
    total_price = case when public.app_is_postpaid(pkg) then 0 else p_total_sessions * p_price_per_session end,
    notes = nullif(btrim(coalesce(p_notes, '')), ''), is_active = p_is_active, updated_at = now()
  where id = p_package;
  perform public.app_recalc_package_payment(p_package);
  perform public.app_audit('UPDATE_PACKAGE', 'pt_packages', p_package, to_jsonb(pkg), null);
end $$;

-- Hapus paket: hanya Admin; paket yang sudah punya transaksi uang tidak boleh dihapus (void dulu)
create or replace function public.app_delete_package(p_package uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.app_role() is distinct from 'super_admin' then raise exception 'Hanya Admin yang dapat menghapus paket'; end if;
  if exists (select 1 from public.pt_transactions where package_id = p_package and voided_at is null) then
    raise exception 'Paket sudah punya transaksi pembayaran. Void transaksinya dulu.'; end if;
  delete from public.payment_reports where package_id = p_package;
  delete from public.pt_transactions where package_id = p_package;
  delete from public.workout_sessions where package_id = p_package;
  delete from public.pt_packages where id = p_package;
  perform public.app_audit('DELETE_PACKAGE', 'pt_packages', p_package, null, null);
end $$;

-- -----------------------------------------------------------------------------
-- 9. RPC akun: akun auth dibuat browser (signUp klien sementara), profil dibuat di sini
--    Hanya Admin (PT juga boleh membuat klien untuk dirinya sendiri).
-- -----------------------------------------------------------------------------
create or replace function public.app_create_pt(p_auth_id uuid, p_username text, p_full_name text, p_phone text default null,
  p_specialization text default null, p_bio text default null, p_years int default null, p_price numeric default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare tid uuid;
begin
  if public.app_role() is distinct from 'super_admin' then raise exception 'Hanya Admin yang dapat menambah PT'; end if;
  if not exists (select 1 from auth.users where id = p_auth_id) then raise exception 'Akun login belum dibuat'; end if;
  if exists (select 1 from public.users where id = p_auth_id) then raise exception 'Akun sudah terdaftar'; end if;
  insert into public.users (id, email, username, full_name, phone, role, is_active)
  values (p_auth_id, lower(p_username) || '@pt.local', lower(p_username), btrim(p_full_name), nullif(btrim(coalesce(p_phone, '')), ''), 'personal_trainer', true);
  insert into public.personal_trainers (user_id, specialization, bio, years_experience, price_per_session)
  values (p_auth_id, nullif(btrim(coalesce(p_specialization, '')), ''), nullif(btrim(coalesce(p_bio, '')), ''), p_years, p_price)
  returning id into tid;
  perform public.app_audit('CREATE_PT', 'personal_trainers', tid, null, jsonb_build_object('username', p_username));
  return tid;
end $$;

create or replace function public.app_create_client(p_auth_id uuid, p_username text, p_full_name text, p_phone text default null,
  p_trainer uuid default null, p_gender text default null, p_dob date default null, p_height numeric default null,
  p_weight numeric default null, p_goal text default null, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare tid uuid; cid uuid;
begin
  if public.app_role() not in ('super_admin', 'personal_trainer') then raise exception 'Unauthorized'; end if;
  tid := case when public.app_role() = 'personal_trainer' then public.app_trainer_id() else p_trainer end;
  if tid is null then raise exception 'Pilih Personal Trainer'; end if;
  if not exists (select 1 from auth.users where id = p_auth_id) then raise exception 'Akun login belum dibuat'; end if;
  if exists (select 1 from public.users where id = p_auth_id) then raise exception 'Akun sudah terdaftar'; end if;
  insert into public.users (id, email, username, full_name, phone, role, is_active)
  values (p_auth_id, lower(p_username) || '@pt.local', lower(p_username), btrim(p_full_name), nullif(btrim(coalesce(p_phone, '')), ''), 'client', true);
  insert into public.clients (user_id, trainer_id, gender, date_of_birth, height, initial_weight, current_weight, fitness_goal, medical_notes)
  values (p_auth_id, tid, nullif(p_gender, '')::gender, p_dob, p_height, p_weight, p_weight, coalesce(nullif(btrim(coalesce(p_goal, '')), ''), 'General Fitness'), nullif(btrim(coalesce(p_notes, '')), ''))
  returning id into cid;
  perform public.app_audit('CREATE_CLIENT', 'clients', cid, null, jsonb_build_object('username', p_username));
  return cid;
end $$;

create or replace function public.app_update_my_profile(p_full_name text, p_phone text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or public.app_role() is null then raise exception 'Unauthorized'; end if;
  if btrim(coalesce(p_full_name, '')) = '' then raise exception 'Nama wajib diisi'; end if;
  update public.users set full_name = btrim(p_full_name), phone = nullif(btrim(coalesce(p_phone, '')), ''), updated_at = now() where id = auth.uid();
end $$;

-- -----------------------------------------------------------------------------
-- 10. Eksekusi: hanya pengguna masuk, bukan anon / publik
-- -----------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'app\_%' loop
    execute format('revoke execute on function %s from public, anon', f.sig);
  end loop;
end $$;

grant execute on function
  public.app_role(), public.app_trainer_id(), public.app_client_id(),
  public.app_can_see_trainer(uuid), public.app_can_see_client(uuid), public.app_can_see_user(uuid),
  public.app_is_postpaid(public.pt_packages), public.app_session_counted(session_status, boolean), public.app_paid_for(uuid),
  public.app_record_payment(uuid, numeric, text, text),
  public.app_void_transaction(uuid, text),
  public.app_submit_payment_report(uuid, numeric, text, text, text),
  public.app_confirm_payment_report(uuid),
  public.app_reject_payment_report(uuid, text),
  public.app_set_session_status(uuid, session_status, boolean, text),
  public.app_check_in_session(uuid),
  public.app_complete_session(uuid, int, text),
  public.app_schedule_session(uuid, timestamptz, text, text, text, session_status),
  public.app_update_session(uuid, timestamptz, text, text, text, int),
  public.app_delete_session(uuid),
  public.app_sell_package(uuid, text, int, numeric, date, text, text, boolean),
  public.app_update_package(uuid, text, int, numeric, text, boolean),
  public.app_delete_package(uuid),
  public.app_create_pt(uuid, text, text, text, text, text, int, numeric),
  public.app_create_client(uuid, text, text, text, uuid, text, date, numeric, numeric, text, text),
  public.app_update_my_profile(text, text)
to authenticated;
