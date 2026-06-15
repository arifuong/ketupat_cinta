<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\InvoiceResource;
use App\Models\User;
use App\Models\ResellerInvoice;
use App\Models\Order;
use App\Models\Payment;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private ActivityLogService $logService) {}

    /**
     * Admin monitoring dashboard stats.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Dashboard statistics.',
            'data' => [
                'total_orders_today' => Order::whereDate('created_at', today())->count(),
                'orders_pending_payment' => Payment::awaitingVerification()->count(),
                'orders_processing' => Order::byStatus(\App\Enums\OrderStatus::PROCESSING)->count(),
                'total_revenue' => Payment::verified()->sum('amount'),
                'total_resellers' => User::resellers()->count(),
                'total_customers' => User::customers()->count(),
                'overdue_invoices' => ResellerInvoice::overdue()->count(),
                'total_unpaid_debt' => ResellerInvoice::unpaid()->selectRaw('SUM(total_debt - paid_amount) as total')->value('total') ?? 0,
            ],
        ]);
    }

    /**
     * Admin dashboard todo summary counts.
     */
    public function todoSummary(): JsonResponse
    {
        $pendingOrders = Order::whereIn('order_status', [
            \App\Enums\OrderStatus::PENDING_PAYMENT,
            \App\Enums\OrderStatus::WAITING_VERIFICATION,
            \App\Enums\OrderStatus::PROCESSING
        ])->count();

        $pendingPayments = Payment::where('payment_status', \App\Enums\PaymentStatus::MENUNGGU_VERIFIKASI)->count();

        $pendingResellerBillings = ResellerInvoice::whereIn('status', [
            \App\Enums\InvoiceStatus::MENUNGGU_VERIFIKASI,
            \App\Enums\InvoiceStatus::SEBAGIAN_DIBAYAR,
            \App\Enums\InvoiceStatus::TERLAMBAT
        ])->count();

        $pendingUsers = \App\Models\ResellerApplication::where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard todo summary.',
            'data' => [
                'pending_orders' => $pendingOrders,
                'pending_payments' => $pendingPayments,
                'pending_reseller_billings' => $pendingResellerBillings,
                'pending_users' => $pendingUsers,
            ]
        ]);
    }

    /**
     * List all users.
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::query()->orderByDesc('created_at');

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengguna.',
            'data' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Change user role.
     */
    public function updateUserRole(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|in:customer,reseller',
            'is_trusted' => 'nullable|boolean',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'role' => $request->role,
            'is_trusted' => $request->boolean('is_trusted', $user->is_trusted),
        ]);

        $this->logService->log($request->user(), 'update_user_role', $user);

        return response()->json([
            'success' => true,
            'message' => "Role diubah ke '{$request->role}'.",
            'data' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * List all invoices.
     */
    public function invoices(Request $request): JsonResponse
    {
        $query = ResellerInvoice::with(['user', 'order', 'payments'])->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Daftar tagihan reseller.',
            'data' => InvoiceResource::collection($invoices),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    /**
     * Activity logs.
     */
    public function activityLogs(Request $request): JsonResponse
    {
        $logs = \App\Models\ActivityLog::with('admin')
            ->recent()
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Activity logs.',
            'data' => $logs,
        ]);
    }
}
