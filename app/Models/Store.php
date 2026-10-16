<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Store extends Model
{
    use SoftDeletes;

    public const STATUSES = ['pending', 'approved', 'rejected', 'active', 'suspended', 'deactivated', 'banned'];

    protected $table = 'store';

    protected $fillable = [
        'merchant_id', 'store_category_id', 'store_type_id', 'name', 'profile_image', 'banner_image', 'tagline', 'description', 'slug',
        'contact_email', 'contact_mobile_phone', 'contact_telephone', 'business_structure',
        'business_registration', 'valid_id_type', 'house_unit_building', 'street', 'barangay', 'city_municipality',
        'province', 'region', 'zip_code', 'latitude', 'longitude', 'status', 'rejection_reason',
        'submitted_at', 'reviewed_at', 'reviewed_by', 'reviewed_by_role', 'suspended_at',
        'deactivated_at', 'banned_at', 'status_changed_by', 'status_changed_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'suspended_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'banned_at' => 'datetime',
            'status_changed_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StoreDocument::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(StoreCategory::class, 'store_category_id');
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(StoreType::class, 'store_type_id');
    }
}
