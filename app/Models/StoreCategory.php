<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StoreCategory extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'description', 'image', 'slug', 'sort_order', 'status', 'created_by', 'updated_by', 'status_changed_by'];

    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function types(): HasMany
    {
        return $this->hasMany(StoreType::class);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', 'active')->whereNull('deleted_at');
    }
}
