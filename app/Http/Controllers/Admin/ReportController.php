<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ResellerInvoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    private function getSummaryStats(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $total_revenue = Payment::verified()
            ->when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate))
            ->sum('amount');

        $total_orders = Order::when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate))
            ->count();

        $total_customers = \App\Models\User::where('role', 'customer')
            ->when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate))
            ->count();

        $total_resellers = \App\Models\User::where('role', 'reseller')
            ->when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate))
            ->count();

        return compact('total_revenue', 'total_orders', 'total_customers', 'total_resellers', 'startDate', 'endDate');
    }

    public function orders(Request $request)
    {
        $orders = Order::with(['user', 'address', 'resellerInvoice'])
            ->when($request->status, fn($q) => $q->where('order_status', $request->status))
            ->when($request->start_date, fn($q) => $q->whereDate('created_at', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('created_at', '<=', $request->end_date))
            ->orderByDesc('created_at')
            ->get();

        if ($request->export === 'pdf') {
            $stats = $this->getSummaryStats($request);
            $pdf = Pdf::loadView('reports.orders', array_merge(compact('orders'), $stats));
            return $pdf->download('laporan-pesanan.pdf');
        }

        if ($request->export === 'csv') {
            $headers = ["Invoice", "Customer", "Total", "Status", "Tanggal"];
            return $this->exportCsv('laporan-pesanan.csv', $headers, $orders->map(fn($o) => [
                $o->resellerInvoice->invoice_number ?? $o->order_number,
                $o->user->name,
                $o->total_amount,
                $o->order_status->label(),
                $o->created_at->format('d/m/Y')
            ])->toArray());
        }

        return response()->json([
            'success' => true,
            'message' => $orders->isEmpty() ? 'Belum ada data laporan.' : 'Data laporan.',
            'data' => $orders
        ]);
    }

    public function payments(Request $request)
    {
        $payments = Payment::with(['order.user'])
            ->when($request->status, fn($q) => $q->where('payment_status', $request->status))
            ->when($request->start_date, fn($q) => $q->whereDate('created_at', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('created_at', '<=', $request->end_date))
            ->orderByDesc('created_at')
            ->get();

        if ($request->export === 'pdf') {
            $stats = $this->getSummaryStats($request);
            $pdf = Pdf::loadView('reports.payments', array_merge(compact('payments'), $stats));
            return $pdf->download('laporan-pembayaran.pdf');
        }

        if ($request->export === 'csv') {
            $headers = ["Order #", "Customer", "Metode", "Total", "Status", "Tanggal"];
            return $this->exportCsv('laporan-pembayaran.csv', $headers, $payments->map(fn($p) => [
                $p->order->order_number ?? '-',
                $p->order->user->name ?? '-',
                $p->method->label(),
                $p->amount,
                $p->payment_status->label(),
                $p->created_at->format('d/m/Y')
            ])->toArray());
        }

        return response()->json([
            'success' => true,
            'message' => $payments->isEmpty() ? 'Belum ada data laporan.' : 'Data laporan.',
            'data' => $payments
        ]);
    }

    public function resellerBilling(Request $request)
    {
        $invoices = ResellerInvoice::with(['user', 'order'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->start_date, fn($q) => $q->whereDate('created_at', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('created_at', '<=', $request->end_date))
            ->orderByDesc('created_at')
            ->get();

        $filename = $request->id === 'installments' ? 'laporan-cicilan' : 'laporan-penagihan';

        if ($request->export === 'pdf') {
            $stats = $this->getSummaryStats($request);
            $pdf = Pdf::loadView('reports.billing', array_merge(compact('invoices'), $stats));
            return $pdf->download("{$filename}.pdf");
        }

        if ($request->export === 'csv') {
            $headers = ["Invoice", "Reseller", "Total", "Terbayar", "Sisa", "Cicilan", "Status"];
            return $this->exportCsv("{$filename}.csv", $headers, $invoices->map(fn($i) => [
                $i->invoice_number,
                $i->user->name,
                $i->total_debt,
                $i->paid_amount,
                $i->remaining_debt,
                "{$i->current_installment} / {$i->installment_count}",
                $i->status->label()
            ])->toArray());
        }

        return response()->json([
            'success' => true,
            'message' => $invoices->isEmpty() ? 'Belum ada data laporan.' : 'Data laporan.',
            'data' => $invoices
        ]);
    }

    private function exportCsv($filename, $headers, $data)
    {
        $callback = function() use ($headers, $data) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($data as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename={$filename}",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ]);
    }
}
