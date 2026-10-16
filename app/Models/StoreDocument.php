<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreDocument extends Model
{
    public $timestamps = false;

    protected $table = 'store_document';

    protected $fillable = [
        'store_id', 'document_type', 'file_path', 'original_file_name', 'mime_type',
        'file_size', 'disk', 'status', 'is_required', 'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'is_required' => 'boolean',
            'uploaded_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
