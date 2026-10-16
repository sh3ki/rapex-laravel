<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhilippineBarangay extends Model
{
    protected $table = 'philippine_barangays';
    protected $guarded = [];

    public function region(): BelongsTo { return $this->belongsTo(PhilippineRegion::class, 'region_id'); }
    public function province(): BelongsTo { return $this->belongsTo(PhilippineProvince::class, 'province_id'); }
    public function city(): BelongsTo { return $this->belongsTo(PhilippineCity::class, 'city_id'); }
    public function municipality(): BelongsTo { return $this->belongsTo(PhilippineMunicipality::class, 'municipality_id'); }
}
