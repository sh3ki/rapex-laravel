<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhilippineProvince extends Model
{
    protected $table = 'philippine_provinces';
    protected $guarded = [];

    public function region(): BelongsTo { return $this->belongsTo(PhilippineRegion::class, 'region_id'); }
    public function cities(): HasMany { return $this->hasMany(PhilippineCity::class, 'province_id'); }
    public function municipalities(): HasMany { return $this->hasMany(PhilippineMunicipality::class, 'province_id'); }
}
