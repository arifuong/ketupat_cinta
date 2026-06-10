<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== FIXING ADMIN PASSWORD ===" . PHP_EOL;

// Fix admin password - use update() to bypass the 'hashed' cast which would double-hash
$admin = User::where('wa_number', '081234567890')->first();
if ($admin) {
    // Use DB::table to set password directly, bypassing the model's 'hashed' cast
    \Illuminate\Support\Facades\DB::table('users')
        ->where('id', $admin->id)
        ->update(['password' => Hash::make('password')]);

    $admin->refresh();
    $result = Hash::check('password', $admin->password);
    echo "Admin password fixed. Hash::check: " . ($result ? 'PASS ✅' : 'STILL FAIL ❌') . PHP_EOL;
} else {
    echo "Admin not found!" . PHP_EOL;
}

// Verify all users
echo PHP_EOL . "=== VERIFY ALL USERS ===" . PHP_EOL;
foreach (User::all() as $u) {
    echo "{$u->name} ({$u->wa_number}): Hash::check('password') = " .
        (Hash::check('password', $u->password) ? 'PASS ✅' : 'FAIL ❌') . PHP_EOL;
}

echo PHP_EOL . "=== DONE ===" . PHP_EOL;
