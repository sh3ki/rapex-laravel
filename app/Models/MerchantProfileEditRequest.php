<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class MerchantProfileEditRequest extends Model
{
    protected $fillable = ['merchant_id', 'request_key', 'field', 'from_value', 'to_value', 'status', 'requested_at', 'approved_at', 'approved_by', 'approved_by_role'];

    protected function casts(): array
    {
        return ['requested_at' => 'datetime', 'approved_at' => 'datetime'];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }
}
