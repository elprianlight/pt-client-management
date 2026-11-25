-- 0500: Jadwal berulang + target RPE (hanya penambahan; data lama tidak diubah)
alter table public.workout_sessions
  add column if not exists target_rpe smallint check (target_rpe between 1 and 10),
  add column if not exists series_id uuid;

create table if not exists public.session_series (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.personal_trainers(id),
  client_id     uuid not null references public.clients(id),
  weekdays      smallint[] not null check (cardinality(weekdays) between 1 and 7),  -- 1=Senin ... 7=Minggu
  start_time    time not null,
  start_date    date not null,
  end_date      date,
  program_type  varchar(50),
  location      varchar(255),
  target_rpe    smallint check (target_rpe between 1 and 10),
  indicators    text[] not null default '{rpe,durasi,catatan}',
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.workout_sessions
  drop constraint if exists workout_sessions_series_id_fkey,
  add constraint workout_sessions_series_id_fkey foreign key (series_id) references public.session_series(id) on delete set null,
  drop constraint if exists workout_sessions_series_slot_key,
  add constraint workout_sessions_series_slot_key unique (series_id, scheduled_at);

create index if not exists idx_sessions_series on public.workout_sessions(series_id);
create index if not exists idx_series_trainer on public.session_series(trainer_id) where is_active;

alter table public.session_series enable row level security;

create policy elp_series_admin_all on public.session_series for all to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy elp_series_select on public.session_series for select to authenticated
  using (trainer_id = app_trainer_id() or client_id = app_client_id());
create policy elp_series_insert on public.session_series for insert to authenticated
  with check (app_role() = 'personal_trainer' and trainer_id = app_trainer_id()
    and exists (select 1 from public.pt_packages p where p.client_id = session_series.client_id and p.trainer_id = app_trainer_id()));
create policy elp_series_update on public.session_series for update to authenticated
  using (app_role() = 'personal_trainer' and trainer_id = app_trainer_id())
  with check (app_role() = 'personal_trainer' and trainer_id = app_trainer_id());

-- PT boleh menghapus sesi berulang yang masih "terjadwal" (saat jadwal berulang dihentikan)
create policy elp_sess_delete_series on public.workout_sessions for delete to authenticated
  using (app_role() = 'personal_trainer' and trainer_id = app_trainer_id() and status = 'scheduled' and series_id is not null);
