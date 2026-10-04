<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('merchant', 'is_admin_verified')) {
            Schema::table('merchant', function (Blueprint $table): void {
                $table->dropColumn('is_admin_verified');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('merchant', 'is_admin_verified')) {
            Schema::table('merchant', function (Blueprint $table): void {
                $table->boolean('is_admin_verified')->default(false)->after('phone_number');
            });
        }
    }
};
