# PRD — Project Requirements Document

## 1. Executive Summary
**Ketupat Cinta** adalah platform pemesanan berbasis web yang didesain khusus untuk mengelola penjualan produk **Ketupat Cinta** dan **Bumbu Sate Maranggi** dengan sistem Pre-Order (PO). Platform ini menggantikan alur manual via WhatsApp menjadi sistem digital yang terstruktur, otomatis, dan tetap mempertahankan kesederhanaan navigasi bagi target pasar utama: Ibu Rumah Tangga dan Reseller lokal di wilayah Bandung dan Cimahi. Fokus sistem adalah efisiensi order PO, validasi wilayah ketat, manajemen piutang reseller yang transparan, serta pemisahan status pembayaran dan status pesanan untuk memudahkan tracking.

## 2. Business Goals & KPI
| Target Bisnis | KPI | Target |
|---|---|---|
| Efisiensi Operasional | Pengurangan volume chat manual order & status | ≥ 70% |
| Adopsi Mandiri | Tingkat checkout mandiri oleh user non-tech | ≥ 90% |
| Akurasi Produksi PO | Kesesuaian PO masuk vs kapasitas | 100% |
| Verifikasi Pembayaran | Waktu admin konfirmasi manual upload | ≤ 2 jam (jam kerja) |
| Cakupan Wilayah | Validasi alamat Bandung/Cimahi | 100% tepat |

## 3. Actors & Peran Sistem
Sistem hanya mengakui 5 aktor berikut. Aktor eksternal dipisahkan jelas untuk keperluan Use Case dan integrasi.
1. **Admin:** Pengelola katalog, jadwal PO, validasi pesanan, verifikasi bukti transfer, update status pengiriman, dan manajemen piutang reseller.
2. **Customer:** Pembeli ritel (Harga normal, MOQ standar, wajib bayar di awal).
3. **Reseller:** Pembeli grosir terverifikasi (Harga khusus, MOQ lebih tinggi, opsi pembayaran tempo/admin).
4. **WhatsApp API (Eksternal):** Pengirim notifikasi otomatis ke user berdasarkan trigger status.
5. **Payment Gateway (Eksternal):** Prosesor pembayaran instan (Midtrans) yang mengembalikan webhook status pembayaran.

*Catatan:* Kurir/Jasa pengiriman **bukan** aktor sistem. Mereka hanya direpresentasikan sebagai metadata pilihan metode pengiriman dalam checkout dan log shipments.

## 4. Business Rules & Aturan Bisnis
1. **Validasi Wilayah (Hard-Constraint):** Sistem hanya mengizinkan proses checkout jika `city` berisi "Bandung" atau "Cimahi". Validasi terjadi di level UI, Form Submission, dan Backend API.
2. **Stok Pre-Order (PO):** 
   - Stok bersifat terikat jadwal PO. Stok **tidak** berkurang saat `Cart` atau `Checkout Initiated`.
   - Stok berkurang permanen hanya ketika `status_pembayaran` berubah ke `Pembayaran Berhasil`.
   - Jika stok PO habis, sistem otomatis mengunci tanggal tersebut dan menampilkan pesan "Kuota PO Penuh".
3. **MOQ Reseller:** Validasi ketat di backend saat checkout. Jika `qty < min_order_reseller`, request ditolak dengan error code `422 UNPROCESSABLE`.
4. **Validasi Upload Bukti Transfer:** 
   - Format: JPG, PNG, PDF.
   - Maks Ukuran: 2MB.
   - Wajib diunggah jika metode pembayaran = `Manual Upload`.
   - Ditolak otomatis jika melanggar aturan, mengubah status pembayaran kembali ke `Menunggu Pembayaran`.
5. **Aturan Pembayaran Tempo Reseller:**
   - Hanya tersedia untuk user dengan `role = 'reseller'` dan `is_trusted = true`.
   - Tidak ada bunga/penalti finansial. Fokus pada rekam jejak administrasi.
   - Jatuh tempo default: 7 hari setelah pesanan status `Pesanan Selesai`.
   - Jika melewati tanggal jatuh tempo tanpa lunas, status tagihan otomatis berubah ke `Terlambat`.
6. **Pemisahan Alur Pembayaran:** 
   - `Manual Upload`: User upload bukti → Admin verifikasi → Status berubah.
   - `Payment Gateway`: User redirect ke Midtrans → Webhook otomatis → Status langsung `Berhasil`.
   - Satu pesanan hanya menggunakan satu metode. Tidak ada pencampuran alokasi dana.

## 5. Functional Requirements

### 5.1 Autentikasi & Manajemen Akun
- Registrasi via Nomor WhatsApp (OTP/Validasi sederhana) + Nama + Password.
- Login menggunakan No. WA + Password.
- Admin dapat mengubah `role` user dari `customer` ke `reseller` atau sebaliknya.

### 5.2 Katalog & Jadwal PO
- Tampilan 2 produk utama (Ketupat Cinta, Bumbu Sate Maranggi).
- Dropdown/Calendar selector untuk memilih tanggal PO.
- Harga otomatis menyesuaikan `role` user (Customer: `price_normal`, Reseller: `price_reseller`).

### 5.3 Keranjang & Checkout
- Add to Cart, Update Qty, Remove Item.
- Validasi real-time: Stok tersedia sesuai jadwal PO? Qty memenuhi MOQ untuk Reseller?
- Form alamat: Kota (Dropdown Bandung/Cimahi), Detail Alamat, Link Maps.
- Pilihan Metode Pembayaran: Transfer Bank / QRIS (Manual Upload) atau Midtrans (Gateway).
- Pilihan Metode Pengiriman: GoSend (Customer Driver), GoSend (Toko Driver), Kurir Internal.

### 5.4 Manajemen Pembayaran & Invoice
- **Manual:** Admin menerima notifikasi, melihat gambar bukti, klik "Setujui" atau "Tolak".
- **Gateway:** Webhook Midtrans otomatis mengupdate status.
- **Tempo:** Sistem membuat record di `reseller_invoices` dengan status `Belum Ditagih` → `Menunggu Pembayaran`.

### 5.5 Manajemen Pesanan & Pengiriman
- Admin Dashboard: Daftar pesanan filter berdasarkan status, tanggal, tipe user.
- Admin mengupdate status pesanan secara berurutan.
- Admin mengisi metadata pengiriman: No. Resi/Link Tracking, Nama Driver, Nopol Kendaraan, Catatan.
- Update status dan info pengiriman memicu kirim notifikasi WA secara otomatis.

### 5.6 Modul Piutang Reseller
- Dashboard Reseller menampilkan "Tagihan Saya" (Total Utang, Jatuh Tempo, Status).
- Reseller dapat melakukan pembayaran pelunasan (Manual/Gateway) yang dikreditkan ke invoice terkait.
- Riwayat pembayaran tersimpan rapi.

### 5.7 Notifikasi
- Trigger WA otomatis pada: Order Dibuat, Status Pembayaran Berhasil, Status Pengiriman Dikirim, dan Reminder Jatuh Tempo Tempo.
- Notifikasi internal di dashboard untuk status penting.

## 6. Status Sistem & Lifecycle
Status dipisah secara eksplisit untuk menghindari konflik logika bisnis.

### 6.1 Status Pembayaran (`payments.payment_status`)
1. `Menunggu Pembayaran` (Default saat order dibuat)
2. `Menunggu Verifikasi` (Setelah upload bukti manual)
3. `Pembayaran Berhasil` (Setelah approval admin atau webhook gateway)
4. `Pembayaran Ditolak` (Bukti tidak valid/expired)

### 6.2 Status Pesanan (`orders.order_status`)
1. `Dibuat` (Awal)
2. `Sedang Diproses` (Setelah pembayaran berhasil / tempo disetujui)
3. `Sedang Disiapkan` (Barang dalam proses packing/masak PO)
4. `Sedang Dikirim` (Barang交给了 kurir/driver)
5. `Pesanan Selesai` (Diterima oleh user atau melewati masa klaim)
6. `Dibatalkan` (Expired/Invalid/Violation)

*Catatan Alur:* 
- Tempo: `Dibuat` → `Sedang Diproses` (Langsung, skip payment status) → `Sedang Disiapkan` → `Sedang Dikirim` → `Selesai`.
- Regular: `Dibuat` → `Menunggu Pembayaran` → `Pembayaran Berhasil` → `Sedang Diproses` → `Sedang Disiapkan` → `Sedang Dikirim` → `Selesai`.

## 7. User Journey

### 7.1 Customer Flow
1. Buka Landing Page → Lihat Produk → Pilih Jadwal PO.
2. Tambah ke Keranjang → Isi Alamat (Validasi Bandung/Cimahi).
3. Checkout → Pilih Kurir → Pilih Bayar Manual/Gateway.
4. (Jika Manual) Upload Bukti → Tunggu Verifikasi Admin.
5. Terima Notifikasi WA → Pantau Status di Dashboard → Barang Diterima.

### 7.2 Reseller Flow
1. Login → Lihat Harga Grosir & Stok PO.
2. Tambah Qty (Sistem validasi MOQ & Stok).
3. Checkout → Pilih Kurir → Pilih Bayar atau **Tempo**.
4. (Jika Tempo) Pesanan langsung `Sedang Diproses` → Barang Dikirim → Cek "Tagihan Saya".
5. Bayar Tagihan via Dashboard → Admin Konfirmasi → Status `Lunas`.

### 7.3 Admin Flow
1. Login Dashboard → Monitor PO Masuk & Upload Bukti.
2. Verifikasi Pembayaran → Setujui/Reset → Update Status Pesanan.
3. Input Info Kurir/Resi → Sistem trigger WA Auto.
4. Monitor Piutang Reseller → Input Pelunasan → Update Invoice.

## 8. Database Schema (ERD-Ready)
| Tabel | Kolom Utama | Tipe | Keterangan |
|---|---|---|---|
| `users` | id, name, wa_number, password, role(cust/reseller), is_trusted, status | PK, Str, Str, Hash, Enum, Bool, Enum | Role menentukan pricing & akses tempo |
| `user_addresses` | id, user_id, detail, city, map_link | PK, FK, Text, Str, Str | Validasi city hanya Bandung/Cimahi |
| `products` | id, name, price_normal, price_reseller, min_order_cust, min_order_res, stock_po | PK, Str, Dec, Dec, Int, Int, Int | Stok PO terikat jadwal |
| `po_schedules` | id, product_id, schedule_date, allocated_stock, status | PK, FK, Date, Int, Enum | Manajemen kuota per tanggal PO |
| `orders` | id, user_id, total_amount, shipping_method, payment_type(tempo/manual/gateway), order_status, notes | PK, FK, Dec, Enum, Enum, Enum, Text | Header pesanan |
| `order_items` | id, order_id, product_id, qty, unit_price, subtotal | PK, FK, FK, Int, Dec, Dec | Snapshot harga saat transaksi |
| `payments` | id, order_id, method, status, proof_img_url, gateway_ref, paid_at, expired_at | PK, FK, Enum, Enum, Str, Str, DT, DT | Status terpisah dari order |
| `shipments` | id, order_id, courier_name, driver_name, vehicle_no, tracking_link, status | PK, FK, Str, Str, Str, Str, Enum | Metadata logistik (bukan aktor) |
| `reseller_invoices` | id, user_id, order_id, total_debt, paid_amount, due_date, status | PK, FK, FK, Dec, Dec, Date, Enum | `Belum Ditagih`, `Menunggu`, `Terlambat`, `Lunas` |
| `reseller_payments` | id, invoice_id, user_id, amount, payment_method, paid_at | PK, FK, FK, Dec, Enum, DT | Riwayat pelunasan piutang |
| `notifications` | id, user_id, type, message, is_read, created_at | PK, FK, Str, Text, Bool, DT | Internal & WA log |
| `activity_logs` | id, admin_id, action, target_model, target_id, created_at | PK, FK, Str, Str, Int, DT | Audit trail perubahan krusial |

## 9. API Requirements (RESTful Laravel)
| Endpoint | Method | Deskripsi | Validasi/Rule |
|---|---|---|---|
| `/api/auth/register` | POST | Registrasi user baru via WA | Unique WA, Validate input |
| `/api/auth/login` | POST | Login & generate JWT | Rate limit |
| `/api/products` | GET | Publik: Daftar produk & jadwal PO | Strip `price_reseller` jika bukan reseller |
| `/api/cart/validate` | POST | Cek stok PO & MOQ Reseller | Return available stock & min_order |
| `/api/orders` | POST | Buat pesanan baru | Validasi alamat, stok, MOQ, payment_type |
| `/api/payments/upload` | POST | Upload bukti transfer manual | Validasi ekstensi & size file (2MB) |
| `/api/payments/webhook` | POST | Callback Midtrans | Verify signature, update payment & order status |
| `/api/admin/orders` | GET | List pesanan (filter status/type) | Auth: Admin only |
| `/api/admin/orders/{id}/status` | PATCH | Update status pesanan | Sequential transition only |
| `/api/admin/orders/{id}/ship` | PATCH | Input info kurir & ubah status kirim | Trigger WA API |
| `/api/reseller/invoices` | GET | Lihat tagihan & jatuh tempo | Auth: Reseller only |
| `/api/reseller/pay-invoice` | POST | Bayar tagihan tempo | Validasi `due_date`, deduct `reseller_invoices.paid_amount` |

## 10. Non-Functional Requirements
- **Performance:** Page load < 2.5s (3G), API response < 400ms. Caching produk/jadwal PO menggunakan Redis.
- **Security:** JWT Authentication, Bcrypt Password Hashing, CSRF Protection, RBAC, SQL Injection prevention. API Data Masking wajib di level Middleware/Resource.
- **Availability:** Uptime 99%. Scheduled Task (Cron) untuk reset pesanan expired & update status terlambat.
- **UX/UI:** Mobile-First, Font minimal 16px, Kontras Tinggi (Hijau Tua `#013220` & Gold `#D4AF37`), Navigasi 1 kolom, Bahasa sederhana.
- **Compliance:** Data sensitif (No. WA, Alamat) di-encrypt di database. Log activity tersimpan 90 hari.

## 11. Acceptance Criteria

| Fitur | Given | When | Then |
|---|---|---|---|
| Validasi Wilayah | User di halaman checkout | Input city "Garut" | Tombol "Buat Pesanan" disable, muncul error: "Pengiriman hanya untuk Bandung & Cimahi" |
| MOQ Reseller | Reseller login, pilih produk | Submit checkout dengan qty < min_order_reseller | API return 422, modal error muncul: "Minimal pembelian reseller adalah [X]" |
| Upload Bukti | Customer selesai checkout manual | Upload file PDF 5MB | Sistem tolak, status pembayaran tetap `Menunggu Pembayaran`, validasi error muncul |
| Skip Payment (Tempo) | Reseller trusted checkout | Pilih metode "Bayar Tempo" | Order langsung status `Sedang Diproses`, record invoice dibuat dengan status `Belum Ditagih` |
| Status Transition | Admin update order ke `Sedang Disiapkan` | Klik tombol aksi di dashboard | Status order berubah, tidak ada trigger WA (hanya pada update `Sedang Dikirim` & `Selesai`) |
| Gateway Webhook | User bayar via Midtrans | Midtrans kirim webhook `capture` | Backend verifikasi signature, update `payment_status` ke `Berhasil`, decrement stok PO, kirim WA sukses |

## 12. Arsitektur & Tech Stack
- **Frontend:** Next.js 14 (App Router), TailwindCSS, React Hook Form, Axios. Mobile-optimized, SEO-friendly landing page.
- **Backend:** Laravel 11/12 (PHP 8.2), RESTful API, Laravel Sanctum (JWT), Queue Worker (Redis) untuk job notifikasi WA & cron task.
- **Database:** MySQL 8.0 (Relational, ACID compliant).
- **Infrastructure:** Docker Compose, Nginx, Linux VPS/Cloud. Asset storage via local/S3.
- **Integrations:** 
  - Midtrans Snap API & Webhook
  - WhatsApp Business API (Fonnte/Wablas/GWS) via HTTP Post
  - Cron Scheduler untuk `orders.expired_at` & `invoices.due_date`

## 13. Future Roadmap
- **Phase 1 (MVP):** Sistem PO 2 produk, validasi wilayah, manual upload pembayaran, tracking WA, piutang reseller dasar, Next.js + Laravel.
- **Phase 2:** Integrasi Maps API (Geocoding/Radius) untuk validasi jarak otomatis, Dashboard Analitik Admin (Grafik PO, Revenue, Piutang), Export Laporan PDF/Excel.
- **Phase 3:** PWA (Progressive Web App) dengan offline cache, notifikasi push browser, sistem rating produk setelah pesanan selesai.

*Dokumen ini disusun untuk kepatuhan standar analisis sistem, siap dijadikan rujukan pembuatan Use Case Diagram, Activity Diagram, ERD fisik, serta pengembangan sprint oleh tim UI/UX, Dev, QA, dan DevOps.*