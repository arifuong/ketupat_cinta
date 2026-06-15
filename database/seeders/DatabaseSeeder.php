<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\ShippingRate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Demo Users
        |--------------------------------------------------------------------------
        */

        // Admin
        User::updateOrCreate(
            ['wa_number' => '081111111111'],
            [
                'name' => 'Admin',
                'email' => 'admin@ketupat.com',
                'wa_number' => '081111111111',
                'password' => Hash::make('123456'),
                'role' => UserRole::ADMIN,
                'is_trusted' => true,
                'status' => 'active',
            ]
        );

        // Customer
        User::updateOrCreate(
            ['wa_number' => '082222222222'],
            [
                'name' => 'Customer',
                'email' => 'customer@ketupat.com',
                'wa_number' => '082222222222',
                'password' => Hash::make('123456'),
                'role' => UserRole::CUSTOMER,
                'is_trusted' => false,
                'status' => 'active',
            ]
        );

        // Reseller
        User::updateOrCreate(
            ['wa_number' => '083333333333'],
            [
                'name' => 'Reseller',
                'email' => 'reseller@ketupat.com',
                'wa_number' => '083333333333',
                'password' => Hash::make('123456'),
                'role' => UserRole::RESELLER,
                'is_trusted' => true,
                'status' => 'active',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Shipping Rates
        |--------------------------------------------------------------------------
        */

        $methods = [
            'gosend_customer',
            'gosend_toko',
            'kurir_internal'
        ];

        $cities = [
            'bandung',
            'cimahi'
        ];

        $costs = [
            'gosend_customer' => [
                'bandung' => 15000,
                'cimahi' => 18000,
            ],
            'gosend_toko' => [
                'bandung' => 10000,
                'cimahi' => 12000,
            ],
            'kurir_internal' => [
                'bandung' => 0,
                'cimahi' => 5000,
            ],
        ];

        foreach ($methods as $method) {
            foreach ($cities as $city) {
                ShippingRate::updateOrCreate(
                    [
                        'method' => $method,
                        'city' => $city,
                    ],
                    [
                        'cost' => $costs[$method][$city],
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}