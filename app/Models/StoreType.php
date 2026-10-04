<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StoreType extends Model
{
    use SoftDeletes;

    protected $fillable = ['store_category_id', 'name', 'slug', 'sort_order', 'status', 'created_by', 'updated_by', 'status_changed_by'];

    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(StoreCategory::class, 'store_category_id');
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', 'active')->whereNull('deleted_at');
    }
}
