<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class Merchant extends RoleUser
{
    protected $table = 'merchant';

    public function onboardingApplication(): HasOne
    {
        return $this->hasOne(MerchantOnboardingApplication::class);
    }

    public function getAvatarAttribute(): ?string
    {
        if ($this->profile_image && Storage::disk('local')->exists($this->profile_image)) {
            return route('merchant.onboarding.media', [
                'field' => 'profile_image',
            ]);
        }

        return parent::getAvatarAttribute();
    }
}
