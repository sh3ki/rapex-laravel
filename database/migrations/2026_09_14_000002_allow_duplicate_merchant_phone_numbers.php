<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant', function (Blueprint $table): void {
            $table->dropUnique('merchant_phone_number_unique');
        });
    }

    public function down(): void
    {
        Schema::table('merchant', function (Blueprint $table): void {
            $table->unique('phone_number');
        });
    }
};
