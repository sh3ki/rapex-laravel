<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhilippineRegion extends Model
{
    protected $table = 'philippine_regions';
    protected $guarded = [];

    public function provinces(): HasMany { return $this->hasMany(PhilippineProvince::class, 'region_id'); }
    public function cities(): HasMany { return $this->hasMany(PhilippineCity::class, 'region_id'); }
    public function municipalities(): HasMany { return $this->hasMany(PhilippineMunicipality::class, 'region_id'); }
}
