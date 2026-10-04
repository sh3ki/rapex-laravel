<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['customers', 'merchant', 'rider', 'admin', 'superadmin'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->string('profile_image')->nullable()->after('email');
            });
        }
    }

    public function down(): void
    {
        foreach (['customers', 'merchant', 'rider', 'admin', 'superadmin'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropColumn('profile_image');
            });
        }
    }
};
