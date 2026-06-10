<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== LOGIN DIAGNOSTIC ===" . PHP_EOL . PHP_EOL;

$users = User::all();
echo "Total users in DB: " . $users->count() . PHP_EOL . PHP_EOL;

foreach ($users as $u) {
    echo "--- User #{$u->id} ---" . PHP_EOL;
    echo "  Name: {$u->name}" . PHP_EOL;
    echo "  WA: {$u->wa_number}" . PHP_EOL;
    echo "  Role (raw): " . $u->getRawOriginal('role') . PHP_EOL;
    echo "  Status (raw): " . $u->getRawOriginal('status') . PHP_EOL;
    echo "  Password (first 15): " . substr($u->password, 0, 15) . PHP_EOL;
    echo "  Password length: " . strlen($u->password) . PHP_EOL;
    echo "  Is bcrypt hash: " . (str_starts_with($u->password, '$2y$') || str_starts_with($u->password, '$2a$') ? 'YES' : 'NO') . PHP_EOL;
    echo "  Hash::check('password'): " . (Hash::check('password', $u->password) ? 'PASS ✅' : 'FAIL ❌') . PHP_EOL;

    // Test status enum cast
    try {
        $status = $u->status;
        echo "  Status cast: " . (is_object($status) ? get_class($status) . "::{$status->value}" : $status) . PHP_EOL;
    } catch (\Throwable $e) {
        echo "  Status cast ERROR: " . $e->getMessage() . PHP_EOL;
    }

    echo PHP_EOL;
}

// Test the exact login logic
echo "=== SIMULATING LOGIN ===" . PHP_EOL;
$testWa = '081234567890';
$testPwd = 'password';

$user = User::where('wa_number', $testWa)->first();
if (!$user) {
    echo "FAIL: User with wa_number={$testWa} NOT FOUND" . PHP_EOL;
} else {
    echo "User found: {$user->name}" . PHP_EOL;
    $hashOk = Hash::check($testPwd, $user->password);
    echo "Hash::check result: " . ($hashOk ? 'PASS ✅' : 'FAIL ❌') . PHP_EOL;

    if (!$hashOk) {
        echo PHP_EOL . "ROOT CAUSE: Password in database is NOT a valid bcrypt hash of 'password'" . PHP_EOL;
        echo "Stored hash: {$user->password}" . PHP_EOL;
        echo "Expected: bcrypt hash starting with \$2y\$" . PHP_EOL;

        // Check if it was double-hashed
        echo PHP_EOL . "Checking if DOUBLE HASHED..." . PHP_EOL;
        $freshHash = Hash::make('password');
        echo "Fresh hash of 'password': {$freshHash}" . PHP_EOL;
        $doubleCheck = Hash::check($freshHash, $user->password);
        echo "Is double-hashed: " . ($doubleCheck ? 'YES - password was hashed twice!' : 'NO') . PHP_EOL;
    }

    // Test status check
    try {
        echo "Status value: " . $user->status->value . PHP_EOL;
        echo "Status is inactive: " . ($user->status->value === 'inactive' ? 'YES' : 'NO') . PHP_EOL;
    } catch (\Throwable $e) {
        echo "Status check ERROR: " . $e->getMessage() . PHP_EOL;
    }
}

echo PHP_EOL . "=== DONE ===" . PHP_EOL;
