<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\PoScheduleResource;
use App\Models\Product;
use App\Models\PoSchedule;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::active()
            ->with(['poSchedules' => fn ($q) => $q->upcoming()])
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar produk.',
            'data' => ProductResource::collection($products),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->with(['poSchedules' => fn ($q) => $q->upcoming()])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'message' => 'Detail produk.',
            'data' => new ProductResource($product),
        ]);
    }
}
