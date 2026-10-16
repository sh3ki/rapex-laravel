<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_document', function (Blueprint $table): void {
            $table->string('disk', 30)->default('local')->after('file_path');
            $table->boolean('is_required')->default(false)->after('status');
            $table->index(['store_id', 'document_type']);
        });
    }

    public function down(): void
    {
        Schema::table('store_document', function (Blueprint $table): void {
            $table->dropIndex(['store_id', 'document_type']);
            $table->dropColumn(['disk', 'is_required']);
        });
    }
};
