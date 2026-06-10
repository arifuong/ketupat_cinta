<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'wa_number',
        'email',
        'password',
        'role',
        'is_trusted',
        'status',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'role' => UserRole::class,
        'status' => UserStatus::class,
        'is_trusted' => 'boolean',
    ];

    // ──── Relationships ────

    public function addresses(): HasMany
    {
        return $this->hasMany(UserAddress::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function resellerInvoices(): HasMany
    {
        return $this->hasMany(ResellerInvoice::class);
    }

    public function resellerApplications(): HasMany
    {
        return $this->hasMany(ResellerApplication::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'admin_id');
    }

    // ──── Scopes ────

    public function scopeCustomers($query)
    {
        return $query->where('role', UserRole::CUSTOMER);
    }

    public function scopeResellers($query)
    {
        return $query->where('role', UserRole::RESELLER);
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', UserRole::ADMIN);
    }

    public function scopeTrusted($query)
    {
        return $query->where('is_trusted', true);
    }

    public function scopeActive($query)
    {
        return $query->where('status', UserStatus::ACTIVE);
    }

    // ──── Accessors ────

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function isReseller(): bool
    {
        return $this->role === UserRole::RESELLER;
    }

    public function isCustomer(): bool
    {
        return $this->role === UserRole::CUSTOMER;
    }

    public function isTrustedReseller(): bool
    {
        return $this->isReseller() && $this->is_trusted;
    }

    public function getDefaultAddress()
    {
        return $this->addresses()->where('is_default', true)->first()
            ?? $this->addresses()->first();
    }

    public function getUnreadNotificationsCount(): int
    {
        return $this->notifications()->where('is_read', false)->count();
    }
}
