<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['customers', 'merchant', 'rider'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->string('first_name', 100)->nullable()->after('name');
                $table->string('middle_name', 100)->nullable()->after('first_name');
                $table->string('last_name', 100)->nullable()->after('middle_name');
            });
        }
    }

    public function down(): void
    {
        foreach (['customers', 'merchant', 'rider'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropColumn(['first_name', 'middle_name', 'last_name']);
            });
        }
    }
};
