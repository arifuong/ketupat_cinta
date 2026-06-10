<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ResellerApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResellerApplicationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'business_description' => ['nullable', 'string', 'max:2000'],
            'motivation' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        // Check if user already has a pending application
        $existingPending = ResellerApplication::where('user_id', $user->id)
            ->pending()
            ->exists();

        if ($existingPending) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah memiliki pengajuan yang sedang diproses.',
                'data' => null,
            ], 422);
        }

        $application = ResellerApplication::create([
            'user_id' => $user->id,
            'business_name' => $request->business_name,
            'business_description' => $request->business_description,
            'motivation' => $request->motivation,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan reseller berhasil dikirim.',
            'data' => $application->load('user'),
        ], 201);
    }

    public function myApplication(Request $request): JsonResponse
    {
        $application = ResellerApplication::where('user_id', $request->user()->id)
            ->with('reviewer')
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => $application ? 'Detail pengajuan reseller.' : 'Belum ada pengajuan.',
            'data' => $application,
        ]);
    }
}
