<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\PoSchedule;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function __construct(private ActivityLogService $logService) {}

    public function index(): JsonResponse
    {
        $products = Product::with(['poSchedules' => fn ($q) => $q->upcoming()])->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar produk.',
            'data' => ProductResource::collection($products),
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = $path;
        }

        // Remove 'image' key from data since it's not a model field
        unset($data['image']);

        $product = Product::create($data);

        $this->logService->log($request->user(), 'create_product', $product);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dibuat.',
            'data' => new ProductResource($product),
        ], 201);
    }

    public function update(StoreProductRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $data = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image_url && Storage::disk('public')->exists($product->image_url)) {
                Storage::disk('public')->delete($product->image_url);
            }
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = $path;
        }

        // Remove 'image' key from data since it's not a model field
        unset($data['image']);

        $product->update($data);

        $this->logService->log($request->user(), 'update_product', $product);

        return response()->json([
            'success' => true,
            'message' => 'Produk diperbarui.',
            'data' => new ProductResource($product->fresh()),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        // Check if product has associated order items
        if ($product->orderItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak dapat dihapus karena sudah memiliki pesanan.',
                'data' => null,
            ], 422);
        }

        // Delete image file if exists
        if ($product->image_url && Storage::disk('public')->exists($product->image_url)) {
            Storage::disk('public')->delete($product->image_url);
        }

        // Delete related PO schedules
        $product->poSchedules()->delete();
        $product->delete();

        $this->logService->log($request->user(), 'delete_product', $product);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.',
        ]);
    }

    public function storeSchedule(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'schedule_date' => 'required|date|after:today',
            'allocated_stock' => 'required|integer|min:1',
        ]);

        $schedule = PoSchedule::create([
            'product_id' => $request->product_id,
            'schedule_date' => $request->schedule_date,
            'allocated_stock' => $request->allocated_stock,
            'remaining_stock' => $request->allocated_stock,
        ]);

        $this->logService->log($request->user(), 'create_po_schedule', $schedule);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal PO berhasil dibuat.',
            'data' => $schedule,
        ], 201);
    }

    public function updateSchedule(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'schedule_date' => 'sometimes|date',
            'allocated_stock' => 'sometimes|integer|min:0',
            'remaining_stock' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:open,closed,full',
        ]);

        $schedule = PoSchedule::findOrFail($id);
        $schedule->update($request->only(['schedule_date', 'allocated_stock', 'remaining_stock', 'status']));

        $this->logService->log($request->user(), 'update_po_schedule', $schedule);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal PO diperbarui.',
            'data' => $schedule->fresh(),
        ]);
    }

    public function deleteSchedule(Request $request, int $id): JsonResponse
    {
        $schedule = PoSchedule::findOrFail($id);

        // Check if schedule has order items
        if ($schedule->orderItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal PO tidak dapat dihapus karena sudah memiliki pesanan.',
                'data' => null,
            ], 422);
        }

        $schedule->delete();

        $this->logService->log($request->user(), 'delete_po_schedule', $schedule);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal PO berhasil dihapus.',
        ]);
    }
}
