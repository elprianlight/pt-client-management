-- 0300: perbaikan minimal agar elprian-training.html bisa mencatat pembayaran dan rekening dari browser.
-- Hasil audit: RLS aktif tanpa policy di pt_bank_accounts, payment_reports, receipt_sequences,
-- sehingga INSERT transaksi (trigger nomor kuitansi) dan rekening/laporan ditolak untuk role authenticated.
-- Aman dijalankan berulang. TIDAK menghapus atau mengubah data.

-- 1) Pembuat nomor kuitansi berjalan sebagai pemilik fungsi (menulis receipt_sequences).
ALTER FUNCTION public.generate_receipt_number(integer) SECURITY DEFINER SET search_path = public, pg_temp;

-- 2) Izinkan pengguna yang sudah login memakai rekening dan laporan pembayaran.
--    (Pembatasan per peran masih di aplikasi. Untuk pembatasan di database, jalankan RLS penuh terpisah.)
DROP POLICY IF EXISTS elp_banks_authenticated ON public.pt_bank_accounts;
CREATE POLICY elp_banks_authenticated ON public.pt_bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS elp_reports_authenticated ON public.payment_reports;
CREATE POLICY elp_reports_authenticated ON public.payment_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3) (Opsional) Hitung ulang sesi terpakai. Audit menemukan 2 paket yang selisih 1 sesi dari data sesinya.
-- SELECT public.fn_recalc_package_sessions(id) FROM public.pt_packages;
