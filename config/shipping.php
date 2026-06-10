<?php

return [
    'methods' => [
        'gosend_customer' => [
            'label' => 'GoSend (Customer Driver)',
            'default_cost' => env('SHIPPING_GOSEND_CUSTOMER', 15000),
        ],
        'gosend_toko' => [
            'label' => 'GoSend (Toko Driver)',
            'default_cost' => env('SHIPPING_GOSEND_TOKO', 10000),
        ],
        'kurir_internal' => [
            'label' => 'Kurir Internal',
            'default_cost' => env('SHIPPING_KURIR_INTERNAL', 0),
        ],
    ],
];
