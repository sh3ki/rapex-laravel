<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_categories', function (Blueprint $table): void {
            $table->text('description')->nullable()->after('name');
            $table->string('image')->nullable()->after('description');
        });

        Schema::table('store_types', function (Blueprint $table): void {
            $table->string('image')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('store_types', function (Blueprint $table): void {
            $table->dropColumn('image');
        });

        Schema::table('store_categories', function (Blueprint $table): void {
            $table->dropColumn(['description', 'image']);
        });
    }
};
