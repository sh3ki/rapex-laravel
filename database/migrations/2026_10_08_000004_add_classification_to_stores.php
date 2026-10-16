<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store', function (Blueprint $table): void {
            $table->foreignId('store_category_id')->after('merchant_id')->constrained('store_categories')->restrictOnDelete();
            $table->foreignId('store_type_id')->after('store_category_id')->constrained('store_types')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('store', function (Blueprint $table): void {
            $table->dropForeign(['store_type_id']);
            $table->dropForeign(['store_category_id']);
            $table->dropColumn(['store_type_id', 'store_category_id']);
        });
    }
};
