<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Merchant extends RoleUser
{
    protected $table = 'merchant';

    public function onboardingApplication(): HasOne
    {
        return $this->hasOne(MerchantOnboardingApplication::class);
    }

    public function profileEditRequests(): HasMany
    {
        return $this->hasMany(MerchantProfileEditRequest::class);
    }

    public function stores(): HasMany
    {
        return $this->hasMany(Store::class);
    }

    public function getAvatarAttribute(): ?string
    {
        if ($this->profile_image && Storage::disk('local')->exists($this->profile_image)) {
            return route('merchant.onboarding.media', [
                'field' => 'profile_image',
            ]);
        }

        // During onboarding the submitted image belongs to the application
        // until an admin approves it. Keep it available to the merchant UI
        // while the merchant's onboarding_admin_verified flag is still false.
        $onboardingImage = $this->onboardingApplication?->profile_image;

        if ($onboardingImage && Storage::disk('local')->exists($onboardingImage)) {
            return route('merchant.onboarding.media', [
                'field' => 'profile_image',
            ]);
        }

        return parent::getAvatarAttribute();
    }
}
