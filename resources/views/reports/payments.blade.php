<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Pembayaran</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 1.2cm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
        }
        .logo-title {
            font-size: 20px;
            font-weight: bold;
            color: #1F6F5F;
            letter-spacing: 0.5px;
        }
        .logo-subtitle {
            font-size: 9px;
            color: #666;
            margin-top: 2px;
        }
        .report-title-block {
            text-align: right;
        }
        .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 3px;
        }
        .report-meta {
            font-size: 9px;
            color: #555;
        }
        .summary-container {
            width: 100%;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .summary-card {
            width: 22%;
            float: left;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;
            margin-right: 3%;
        }
        .summary-card.last {
            margin-right: 0;
            width: 22%;
        }
        .summary-card-title {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 3px;
        }
        .summary-card-value {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            clear: both;
        }
        .data-table th {
            background-color: #1F6F5F;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8px;
            padding: 6px;
            border: 1px solid #1F6F5F;
            text-align: left;
        }
        .data-table td {
            padding: 6px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <table class="header-table">
        <tr>
            <td>
                <div class="logo-title">KETUPAT CINTA</div>
                <div class="logo-subtitle">Premium Indonesian Traditional Delicacy</div>
            </td>
            <td class="report-title-block">
                <div class="report-title">LAPORAN PEMBAYARAN</div>
                <div class="report-meta">
                    <strong>Tanggal Cetak:</strong> {{ now()->format('d/m/Y H:i') }}<br>
                    <strong>Periode:</strong> {{ $startDate ? date('d/m/Y', strtotime($startDate)) : 'Awal' }} - {{ $endDate ? date('d/m/Y', strtotime($endDate)) : 'Sekarang' }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Summary Metrics -->
    <div class="summary-container">
        <div class="summary-card">
            <div class="summary-card-title">Total Pendapatan</div>
            <div class="summary-card-value">Rp {{ number_format($total_revenue, 0, ',', '.') }}</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-title">Total Pesanan</div>
            <div class="summary-card-value">{{ $total_orders }}</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-title">Total Customer</div>
            <div class="summary-card-value">{{ $total_customers }}</div>
        </div>
        <div class="summary-card last">
            <div class="summary-card-title">Total Reseller</div>
            <div class="summary-card-value">{{ $total_resellers }}</div>
        </div>
    </div>

    <!-- Data Table -->
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 4%;">No</th>
                <th style="width: 18%;">Nomor Order</th>
                <th style="width: 18%;">Nomor Invoice</th>
                <th style="width: 20%;">Customer / Reseller</th>
                <th style="width: 10%;">Tanggal</th>
                <th style="width: 12%;">Metode</th>
                <th style="width: 10%;" class="text-right">Total</th>
                <th style="width: 8%;" class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($payments as $payment)
            <tr>
                <td class="text-center">{{ $loop->iteration }}</td>
                <td>{{ $payment->order->order_number ?? '-' }}</td>
                <td>{{ $payment->order->resellerInvoice->invoice_number ?? '-' }}</td>
                <td>{{ $payment->order->user->name ?? '-' }}</td>
                <td>{{ $payment->created_at->format('d/m/Y') }}</td>
                <td>{{ $payment->method->label() }}</td>
                <td class="text-right">Rp {{ number_format($payment->amount, 0, ',', '.') }}</td>
                <td class="text-center">{{ $payment->payment_status->label() }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="text-center" style="padding: 15px; color: #777;">Belum ada data laporan untuk periode ini.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
