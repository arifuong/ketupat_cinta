<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use App\Enums\UserRole;
use App\Enums\UserStatus;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'wa_number' => $request->wa_number,
            'password' => Hash::make($request->password),

            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
            'is_trusted' => false,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('wa_number', $request->wa_number)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor WhatsApp atau password salah.',
            ], 401);
        }

        // Handle status check safely (supports both enum and string)
        $statusValue = is_object($user->status) ? $user->status->value : $user->status;
        if ($statusValue === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak aktif. Hubungi admin.',
            ], 403);
        }

        // Delete old tokens to prevent token bloat
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        $user = request()->user();

        if ($user) {
            $current = $user->currentAccessToken();
            if ($current) {
                $current->delete();
            } else {
                // fallback: delete all tokens for the user if no current token
                $user->tokens()->delete();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    public function me(): JsonResponse
    {
        $user = request()->user()->load('addresses');

        return response()->json([
            'success' => true,
            'message' => 'Data profil.',
            'data' => new UserResource($user),
        ]);
    }
}
