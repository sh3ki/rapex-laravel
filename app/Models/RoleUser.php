<?php

namespace App\Models;

use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;

#[Fillable(['name', 'first_name', 'middle_name', 'last_name', 'email', 'password', 'profile_image', 'phone_number', 'onboarding_completed', 'onboarding_completed_at', 'onboarding_admin_verified', 'onboarding_admin_verified_at', 'status', 'status_reason', 'suspended_at', 'deactivated_at', 'banned_at', 'status_changed_by'])]
#[Hidden(['password', 'remember_token', 'email_verification_code_hash'])]
abstract class RoleUser extends Authenticatable implements CanResetPasswordContract, MustVerifyEmail
{
    use CanResetPassword, Notifiable, SoftDeletes;

    public const STATUSES = [
        'pending', 'active', 'inactive', 'suspended', 'banned', 'deactivated', 'rejected', 'deleted',
    ];

    protected $appends = ['avatar'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'onboarding_completed' => 'boolean',
            'onboarding_completed_at' => 'datetime',
            'onboarding_admin_verified' => 'boolean',
            'onboarding_admin_verified_at' => 'datetime',
            'is_email_verified' => 'boolean',
            'email_verification_expires_at' => 'datetime',
            'suspended_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'banned_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function hasVerifiedEmail(): bool
    {
        // Keep legacy accounts with a verified timestamp compatible while all
        // new verification paths set both fields.
        return ((bool) $this->is_email_verified || $this->email_verified_at !== null)
            && $this->email_verified_at !== null;
    }

    public function markEmailAsVerified(): void
    {
        $verifiedAt = now();
        $attributes = ['email_verified_at' => $verifiedAt];

        if (Schema::hasColumn($this->getTable(), 'is_email_verified')) {
            $attributes += [
                'is_email_verified' => true,
                'email_verification_code_hash' => null,
                'email_verification_expires_at' => null,
            ];
        }

        $this->forceFill($attributes)->save();
    }

    public function role(): string
    {
        return $this->getTable() === 'customers' ? 'customer' : $this->getTable();
    }

    public function getAvatarAttribute(): ?string
    {
        return $this->profile_image;
    }
}
