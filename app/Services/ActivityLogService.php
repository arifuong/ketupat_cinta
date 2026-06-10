<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivityLogService
{
    /**
     * Log an admin action.
     */
    public function log(User $admin, string $action, Model $target, ?array $extraNewValues = null): ActivityLog
    {
        $oldValues = $target->getOriginal();
        $newValues = $extraNewValues ?? $target->getChanges();

        return ActivityLog::create([
            'admin_id' => $admin->id,
            'action' => $action,
            'target_model' => get_class($target),
            'target_id' => $target->getKey(),
            'old_values' => !empty($oldValues) ? $oldValues : null,
            'new_values' => !empty($newValues) ? $newValues : null,
            'ip_address' => request()->ip(),
        ]);
    }
}
