<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Struk Tagihan - {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            size: A4;
            margin: 1.5cm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.5;
        }
        .receipt-box {
            max-width: 600px;
            margin: auto;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 30px;
            background: #fff;
        }
        .divider {
            border-top: 1px dashed #cbd5e1;
            margin: 15px 0;
            clear: both;
        }
        .brand-header {
            text-align: center;
            margin-bottom: 20px;
        }
        .brand-name {
            font-size: 22px;
            font-weight: bold;
            color: #1F6F5F;
            letter-spacing: 1px;
        }
        .brand-details {
            font-size: 9px;
            color: #64748b;
            margin-top: 3px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .info-table td {
            border: none;
            padding: 4px 0;
            vertical-align: top;
        }
        .info-label {
            width: 35%;
            color: #64748b;
            font-weight: 500;
        }
        .info-value {
            width: 65%;
            color: #0f172a;
            font-weight: 600;
        }
        .product-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .product-table th {
            border-bottom: 2px solid #cbd5e1;
            padding: 8px 4px;
            text-align: left;
            color: #64748b;
            font-size: 9px;
            text-transform: uppercase;
        }
        .product-table td {
            border-bottom: 1px solid #f1f5f9;
            padding: 8px 4px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .summary-block {
            float: right;
            width: 45%;
            margin-top: 10px;
        }
        .summary-row {
            display: table;
            width: 100%;
            margin-bottom: 4px;
        }
        .summary-label {
            display: table-cell;
            color: #64748b;
            text-align: right;
            padding-right: 15px;
        }
        .summary-value {
            display: table-cell;
            font-weight: 600;
            text-align: right;
            width: 110px;
        }
        .total-row {
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            margin-top: 6px;
            font-weight: bold;
            font-size: 12px;
            color: #1F6F5F;
        }
        .status-badge {
            display: block;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            border-radius: 6px;
            margin-top: 20px;
            clear: both;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .status-lunas {
            border: 2px solid #16a34a;
            color: #16a34a;
            background-color: #f0fdf4;
        }
        .status-unpaid {
            border: 2px solid #dc2626;
            color: #dc2626;
            background-color: #fef2f2;
        }
        .footer-message {
            text-align: center;
            color: #64748b;
            font-size: 9px;
            margin-top: 40px;
            clear: both;
        }
    </style>
</head>
<body>
    <div class="receipt-box">
        <!-- Brand Header -->
        <div class="brand-header">
            <div class="brand-name">KETUPAT CINTA</div>
            <div class="brand-details">Premium Traditional Taste • Dusun Purbo, Purwosari, Sleman, Yogyakarta</div>
        </div>

        <div class="divider"></div>

        <!-- Info Grid -->
        <table class="info-table">
            <tr>
                <td class="info-label">Nomor Invoice</td>
                <td class="info-value">: {{ $invoice->invoice_number }}</td>
            </tr>
            <tr>
                <td class="info-label">Nomor Order</td>
                <td class="info-value">: {{ $invoice->order->order_number ?? '-' }}</td>
            </tr>
            <tr>
                <td class="info-label">Nama Customer / Reseller</td>
                <td class="info-value">: {{ $invoice->user->name }}</td>
            </tr>
            <tr>
                <td class="info-label">Tanggal</td>
                <td class="info-value">: {{ $invoice->created_at->format('d/m/Y H:i') }}</td>
            </tr>
            <tr>
                <td class="info-label">Metode Pembayaran</td>
                <td class="info-value">: Bayar Tempo (Reseller)</td>
            </tr>
            <tr>
                <td class="info-label">Status Pembayaran</td>
                <td class="info-value">: {{ $invoice->status->label() }}</td>
            </tr>
            <tr>
                <td class="info-label">Sisa Tagihan (jika tempo)</td>
                <td class="info-value">: Rp {{ number_format($invoice->total_debt - $invoice->paid_amount, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td class="info-label">Jumlah Cicilan</td>
                <td class="info-value">: {{ $invoice->current_installment }} / {{ $invoice->installment_count }}</td>
            </tr>
            <tr>
                <td class="info-label">Status Invoice</td>
                <td class="info-value">: {{ $invoice->status->label() }}</td>
            </tr>
        </table>

        <div class="divider"></div>

        <!-- Products Table -->
        <table class="product-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Daftar Produk</th>
                    <th style="width: 10%;" class="text-center">Qty</th>
                    <th style="width: 20%;" class="text-right">Harga</th>
                    <th style="width: 20%;" class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @if($invoice->order && $invoice->order->items)
                    @foreach($invoice->order->items as $item)
                    <tr>
                        <td>{{ $item->product->name }}</td>
                        <td class="text-center">{{ $item->qty }}</td>
                        <td class="text-right">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                        <td class="text-right">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                    </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="4" class="text-center" style="color: #777;">Item tidak tersedia</td>
                    </tr>
                @endif
            </tbody>
        </table>

        <!-- Summary Block -->
        <div style="width: 100%; overflow: hidden; margin-top: 10px;">
            <div class="summary-block">
                @if($invoice->order)
                <div class="summary-row">
                    <div class="summary-label">Subtotal</div>
                    <div class="summary-value">Rp {{ number_format($invoice->order->subtotal_amount, 0, ',', '.') }}</div>
                </div>
                <div class="summary-row">
                    <div class="summary-label">Ongkir</div>
                    <div class="summary-value">Rp {{ number_format($invoice->order->shipping_cost, 0, ',', '.') }}</div>
                </div>
                @endif
                <div class="summary-row total-row">
                    <div class="summary-label">Total</div>
                    <div class="summary-value">Rp {{ number_format($invoice->total_debt, 0, ',', '.') }}</div>
                </div>
                <div class="summary-row" style="margin-top: 6px;">
                    <div class="summary-label">Nominal Dibayar</div>
                    <div class="summary-value">Rp {{ number_format($invoice->paid_amount, 0, ',', '.') }}</div>
                </div>
            </div>
        </div>

        <!-- Status Lunas / Sisa Tagihan -->
        @if($invoice->status === \App\Enums\InvoiceStatus::LUNAS)
            <div class="status-badge status-lunas">STATUS : LUNAS</div>
        @else
            <div class="status-badge status-unpaid">
                Sisa Tagihan : Rp {{ number_format($invoice->total_debt - $invoice->paid_amount, 0, ',', '.') }}
            </div>
        @endif

        <div class="footer-message">
            Terima kasih telah berbelanja di Ketupat Cinta
        </div>
    </div>
</body>
</html>
