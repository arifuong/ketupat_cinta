<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ResellerApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResellerApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ResellerApplication::with(['user', 'reviewer'])
            ->orderByDesc('created_at');

        if ($request->has('status') && in_array($request->status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $request->status);
        }

        $applications = $query->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengajuan reseller.',
            'data' => $applications->items(),
            'meta' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'total' => $applications->total(),
            ],
        ]);
    }

    public function review(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $application = ResellerApplication::findOrFail($id);

        if ($application->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan ini sudah ditinjau sebelumnya.',
                'data' => null,
            ], 422);
        }

        $application->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // If approved, upgrade user role to reseller
        if ($request->status === 'approved') {
            $application->user->update([
                'role' => UserRole::RESELLER,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $request->status === 'approved'
                ? 'Pengajuan disetujui. User telah dijadikan reseller.'
                : 'Pengajuan ditolak.',
            'data' => $application->fresh()->load(['user', 'reviewer']),
        ]);
    }
}
