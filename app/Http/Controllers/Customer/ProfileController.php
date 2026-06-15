<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Address\StoreAddressRequest;
use App\Http\Resources\UserResource;
use App\Models\UserAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        if ($request->has('wa_number')) {
            $phone = preg_replace('/[^0-9]/', '', $request->wa_number);
            if (str_starts_with($phone, '62')) {
                $phone = '0' . substr($phone, 2);
            }
            $request->merge([
                'wa_number' => $phone
            ]);
        }

        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'wa_number' => [
                'sometimes',
                'string',
                'regex:/^08[0-9]{8,13}$/',
                Rule::unique('users', 'wa_number')->ignore(auth()->id()),
            ],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'password' => ['sometimes', 'string', 'min:6', 'confirmed'],
            'old_password' => ['required_with:password', 'string'],
        ], [
            'wa_number.regex' => 'Nomor WhatsApp harus diawali dengan 08 dan terdiri dari 10 sampai 15 digit.',
            'wa_number.unique' => 'Nomor WhatsApp sudah terdaftar.',
        ]);

        $user = $request->user();
        $updateData = [];

        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }

        if ($request->has('wa_number')) {
            $updateData['wa_number'] = $request->wa_number;
        }

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $updateData['avatar'] = $path;
        }

        if ($request->has('password')) {
            if (!Hash::check($request->old_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password lama tidak sesuai.',
                    'data' => null,
                ], 422);
            }
            // Use DB::table to avoid double-hashing by 'hashed' cast
            \Illuminate\Support\Facades\DB::table('users')
                ->where('id', $user->id)
                ->update(['password' => Hash::make($request->password)]);
        }

        if (!empty($updateData)) {
            $user->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil diperbarui.',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function addresses(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar alamat.',
            'data' => $addresses,
        ]);
    }

    public function storeAddress(StoreAddressRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        // If setting as default, unset others
        if (!empty($data['is_default']) && $data['is_default']) {
            UserAddress::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        $address = UserAddress::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil ditambahkan.',
            'data' => $address,
        ], 201);
    }

    public function updateAddress(StoreAddressRequest $request, int $id): JsonResponse
    {
        $address = UserAddress::where('user_id', $request->user()->id)->findOrFail($id);

        $data = $request->validated();
        if (!empty($data['is_default']) && $data['is_default']) {
            UserAddress::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        $address->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Alamat diperbarui.',
            'data' => $address->fresh(),
        ]);
    }

    public function deleteAddress(Request $request, int $id): JsonResponse
    {
        $address = UserAddress::where('user_id', $request->user()->id)->findOrFail($id);
        $address->delete();

        return response()->json([
            'success' => true,
            'message' => 'Alamat dihapus.',
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Avatar diperbarui.',
            'data' => [
                'avatar_url' => $user->avatar ? asset('storage/' . $user->avatar) : null,
            ],
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password lama tidak sesuai.',
                'data' => null,
            ], 422);
        }

        // Use DB::table to avoid double-hashing by 'hashed' cast
        \Illuminate\Support\Facades\DB::table('users')
            ->where('id', $user->id)
            ->update(['password' => Hash::make($request->password)]);

        return response()->json([
            'success' => true,
            'message' => 'Password diperbarui.',
        ]);
    }
}
