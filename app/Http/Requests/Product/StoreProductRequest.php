<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $requiredOrSometimes = $isUpdate ? 'sometimes' : 'required';

        return [
            'name' => [$requiredOrSometimes, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'price_normal' => [$requiredOrSometimes, 'numeric', 'min:0'],
            'price_reseller' => [$requiredOrSometimes, 'numeric', 'min:0'],
            'min_order_customer' => [$requiredOrSometimes, 'integer', 'min:1'],
            'min_order_reseller' => [$requiredOrSometimes, 'integer', 'min:1'],
            'stock_po_default' => [$requiredOrSometimes, 'integer', 'min:0'],
        ];
    }
}
