<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Customer\ProductController;
use App\Http\Controllers\Customer\CartController;
use App\Http\Controllers\Customer\OrderController;
use App\Http\Controllers\Customer\PaymentController;
use App\Http\Controllers\Customer\ProfileController;
use App\Http\Controllers\Customer\ResellerApplicationController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\ResellerApplicationController as AdminResellerApplicationController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Reseller\InvoiceController;
use App\Http\Controllers\Admin\ResellerInvoiceController;
use App\Http\Controllers\Admin\ReportController;

use App\Http\Controllers\Webhook\MidtransController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UtilController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Ketupat Cinta
|--------------------------------------------------------------------------
*/

// ── Health Check ──
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'Ketupat Cinta']));

// ── Auth (Public) ──
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
});

// ── Products (Public) ──
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{slug}', [ProductController::class, 'show']);
});

// ── Webhook (Public, signature verified by middleware) ──
Route::post('/payments/webhook', [MidtransController::class, 'handle'])
    ->middleware(\App\Http\Middleware\ValidateMidtransSignature::class);

// ══════════════════════════════════════════════════════════════════
// AUTHENTICATED ROUTES
// ══════════════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // ── Utilities ──
    Route::prefix('util')->group(function () {
        Route::get('/payment-methods', [UtilController::class, 'getPaymentMethods']);
    });

    // ── User Profile & Addresses ──
    Route::prefix('user')->group(function () {
        Route::put('/profile', [ProfileController::class, 'updateProfile']);
        Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);
        Route::get('/addresses', [ProfileController::class, 'addresses']);
        Route::post('/addresses', [ProfileController::class, 'storeAddress']);
        Route::put('/addresses/{id}', [ProfileController::class, 'updateAddress']);
        Route::delete('/addresses/{id}', [ProfileController::class, 'deleteAddress']);
    });

    // ── Cart ──
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/', [CartController::class, 'store']);
        Route::put('/{id}', [CartController::class, 'update']);
        Route::delete('/{id}', [CartController::class, 'destroy']);
        Route::post('/validate', [CartController::class, 'validate']);
    });

    // ── Orders (Customer/Reseller) ──
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/{id}', [OrderController::class, 'show']);
        Route::get('/{id}/receipt', [OrderController::class, 'receipt']);
        Route::patch('/{id}/cancel', [OrderController::class, 'cancel']);
        // Customer confirmation
        Route::patch('/{id}/received', [OrderController::class, 'received']);
        Route::patch('/{id}/gosend-driver', [OrderController::class, 'updateGoSendDriver']);
    });

    // ── Reseller orders confirmation & cancel ──
    Route::prefix('reseller')->middleware('role:reseller')->group(function () {
        Route::patch('/orders/{id}/received', [\App\Http\Controllers\Reseller\OrderController::class, 'received']);
        Route::patch('/orders/{id}/cancel', [\App\Http\Controllers\Reseller\OrderController::class, 'cancel']);
    });


    // ── Payments (Customer/Reseller) ──

    Route::prefix('payments')->group(function () {
        Route::post('/{orderId}/upload', [PaymentController::class, 'upload']);
        Route::post('/{orderId}/gateway', [PaymentController::class, 'gateway']);
    });

    // ── Reseller Application (Customer) ──
    Route::post('/reseller-application', [ResellerApplicationController::class, 'store']);
    Route::get('/reseller-application', [ResellerApplicationController::class, 'myApplication']);
    Route::get('/reseller-application/my', [ResellerApplicationController::class, 'myApplication']);

    // ── Notifications ──
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    // ══════════════════════════════════════════════════════════════
    // RESELLER ROUTES
    // ══════════════════════════════════════════════════════════════
    Route::prefix('reseller')->middleware('role:reseller')->group(function () {
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
        Route::get('/invoices/{id}/receipt', [InvoiceController::class, 'receipt']);
        Route::post('/invoices/{id}/pay', [InvoiceController::class, 'pay']);
    });

    // ══════════════════════════════════════════════════════════════
    // ADMIN ROUTES
    // ══════════════════════════════════════════════════════════════
    Route::prefix('admin')->middleware('role:admin')->group(function () {

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/todo-summary', [DashboardController::class, 'todoSummary']);

        // Products & PO Schedules
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::post('/products/{id}', [AdminProductController::class, 'update']);
        Route::put('/products/{id}', [AdminProductController::class, 'update']);
        Route::delete('/products/{id}', [AdminProductController::class, 'destroy']);
        Route::post('/products/{id}/restore', [AdminProductController::class, 'restore']);
        Route::post('/po-schedules', [AdminProductController::class, 'storeSchedule']);
        Route::put('/po-schedules/{id}', [AdminProductController::class, 'updateSchedule']);
        Route::delete('/po-schedules/{id}', [AdminProductController::class, 'deleteSchedule']);

        // Reseller Applications
        Route::get('/reseller-applications', [AdminResellerApplicationController::class, 'index']);
        Route::patch('/reseller-applications/{id}/review', [AdminResellerApplicationController::class, 'review']);

        // Orders
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
        Route::patch('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
        Route::patch('/orders/{id}/ship', [AdminOrderController::class, 'ship']);
        Route::patch('/orders/{id}/cancel', [AdminOrderController::class, 'cancel']);

        // Payments
        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::patch('/payments/{id}/verify', [AdminPaymentController::class, 'verify']);

        // Reseller tempo invoices (approve/reject/remind)
        Route::patch('/reseller-invoices/{id}/verify', [ResellerInvoiceController::class, 'verify']);
        Route::post('/reseller-invoices/{id}/remind', [ResellerInvoiceController::class, 'remind']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/orders', [ReportController::class, 'orders']);
            Route::get('/payments', [ReportController::class, 'payments']);
            Route::get('/reseller-billing', [ReportController::class, 'resellerBilling']);
        });

        // Users
        Route::get('/users', [DashboardController::class, 'users']);
        Route::patch('/users/{id}/role', [DashboardController::class, 'updateUserRole']);

        // Invoices
        Route::get('/invoices', [DashboardController::class, 'invoices']);

        // Activity Logs
        Route::get('/activity-logs', [DashboardController::class, 'activityLogs']);
    });
});
