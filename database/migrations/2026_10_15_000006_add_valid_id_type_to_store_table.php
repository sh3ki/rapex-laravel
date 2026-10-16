<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store', function (Blueprint $table): void {
            $table->string('valid_id_type', 100)->nullable()->after('business_registration');
        });
    }

    public function down(): void
    {
        Schema::table('store', function (Blueprint $table): void {
            $table->dropColumn('valid_id_type');
        });
    }
};
