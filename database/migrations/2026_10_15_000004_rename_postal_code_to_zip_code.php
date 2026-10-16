<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('philippine_barangays', function (Blueprint $table): void {
            $table->renameColumn('postal_code', 'zip_code');
        });

        Schema::table('merchant_onboarding_applications', function (Blueprint $table): void {
            $table->renameColumn('postal_code', 'zip_code');
        });

        Schema::table('store', function (Blueprint $table): void {
            $table->renameColumn('postal_code', 'zip_code');
        });
    }

    public function down(): void
    {
        Schema::table('store', function (Blueprint $table): void {
            $table->renameColumn('zip_code', 'postal_code');
        });

        Schema::table('merchant_onboarding_applications', function (Blueprint $table): void {
            $table->renameColumn('zip_code', 'postal_code');
        });

        Schema::table('philippine_barangays', function (Blueprint $table): void {
            $table->renameColumn('zip_code', 'postal_code');
        });
    }
};
