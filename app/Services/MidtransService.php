<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = config('midtrans.is_sanitized');
        Config::$is3ds = config('midtrans.is_3ds');
    }

    /**
     * Create Midtrans Snap transaction and return token + redirect URL.
     */
    public function createTransaction(Order $order): array
    {
        $user = $order->user;

        $params = [
            'transaction_details' => [
                'order_id' => $order->order_number . '-' . time(),
                'gross_amount' => (int) $order->total_amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'phone' => $user->wa_number,
            ],
            'item_details' => [],
        ];

        foreach ($order->items as $item) {
            $params['item_details'][] = [
                'id' => $item->product_id,
                'price' => (int) $item->unit_price,
                'quantity' => $item->qty,
                'name' => substr($item->product->name, 0, 50),
            ];
        }

        // Add shipping as item
        if ($order->shipping_cost > 0) {
            $params['item_details'][] = [
                'id' => 'shipping',
                'price' => (int) $order->shipping_cost,
                'quantity' => 1,
                'name' => 'Ongkos Kirim',
            ];
        }

        $snapToken = Snap::getSnapToken($params);

        // Update payment with gateway order ID
        $order->payment->update([
            'gateway_order_id' => $params['transaction_details']['order_id'],
        ]);

        return [
            'snap_token' => $snapToken,
            'redirect_url' => config('midtrans.snap_url'),
            'client_key' => config('midtrans.client_key'),
        ];
    }
}
