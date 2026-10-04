<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant', function (Blueprint $table): void {
            $table->string('phone_number', 13)->unique()->after('email');
            $table->boolean('is_admin_verified')->default(false)->after('phone_number');
        });
    }

    public function down(): void
    {
        Schema::table('merchant', function (Blueprint $table): void {
            $table->dropUnique(['phone_number']);
            $table->dropColumn(['phone_number', 'is_admin_verified']);
        });
    }
};
