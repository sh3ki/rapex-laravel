<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhilippineMunicipality extends Model
{
    protected $table = 'philippine_municipalities';
    protected $guarded = [];

    public function region(): BelongsTo { return $this->belongsTo(PhilippineRegion::class, 'region_id'); }
    public function province(): BelongsTo { return $this->belongsTo(PhilippineProvince::class, 'province_id'); }
    public function barangays(): HasMany { return $this->hasMany(PhilippineBarangay::class, 'municipality_id'); }
}
