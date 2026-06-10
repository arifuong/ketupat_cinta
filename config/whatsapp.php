<?php

return [
    'provider' => env('WA_PROVIDER', 'fonnte'),

    'fonnte' => [
        'api_url' => env('FONNTE_API_URL', 'https://api.fonnte.com/send'),
        'token' => env('FONNTE_TOKEN', ''),
    ],

    'templates' => [
        'order_created' => "Halo {name},\nPesanan #{order_number} berhasil dibuat!\nTotal: Rp {total}\nSilakan lakukan pembayaran sebelum {expired_at}.\n\nTerima kasih 🙏\nKetupat Cinta",

        'payment_success' => "Halo {name},\nPembayaran untuk pesanan #{order_number} berhasil dikonfirmasi! ✅\nPesanan Anda sedang diproses.\n\nTerima kasih 🙏\nKetupat Cinta",

        'order_shipped' => "Halo {name},\nPesanan #{order_number} sedang dalam perjalanan! 🚚\nKurir: {courier}\nDriver: {driver}\nTracking: {tracking_link}\n\nTerima kasih 🙏\nKetupat Cinta",

        'order_completed' => "Halo {name},\nPesanan #{order_number} telah selesai! ✅\nTerima kasih telah berbelanja di Ketupat Cinta 🙏",

        'invoice_reminder' => "Halo {name},\nTagihan #{invoice_number} sebesar Rp {amount} akan jatuh tempo pada {due_date}.\nSilakan segera lakukan pembayaran.\n\nTerima kasih 🙏\nKetupat Cinta",

        'invoice_overdue' => "Halo {name},\nTagihan #{invoice_number} sebesar Rp {amount} sudah melewati jatuh tempo.\nMohon segera lakukan pelunasan.\n\nTerima kasih 🙏\nKetupat Cinta",
    ],
];
