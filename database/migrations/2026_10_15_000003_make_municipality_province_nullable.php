<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('philippine_municipalities', function (Blueprint $table) {
            $table->dropForeign(['province_id']);
            $table->foreignId('province_id')->nullable()->change();
            $table->foreign('province_id')->references('id')->on('philippine_provinces')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('philippine_municipalities', function (Blueprint $table) {
            $table->dropForeign(['province_id']);
            $table->foreignId('province_id')->nullable(false)->change();
            $table->foreign('province_id')->references('id')->on('philippine_provinces')->cascadeOnDelete();
        });
    }
};
