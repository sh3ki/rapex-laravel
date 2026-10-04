<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchantOnboardingApplication extends Model
{
    protected $fillable = [
        'merchant_id', 'date_of_birth', 'gender', 'nationality', 'profile_image',
        'house_unit_building', 'street', 'barangay', 'city_municipality', 'province',
        'region', 'postal_code', 'latitude', 'longitude', 'id_type', 'id_front_image',
        'id_back_image', 'selfie_image', 'status', 'rejection_reason', 'submitted_at',
        'reviewed_at', 'reviewed_by',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date:Y-m-d',
            'latitude' => 'float',
            'longitude' => 'float',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }
}
