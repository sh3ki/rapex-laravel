<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('philippine_regions', function (Blueprint $table) {
            $table->id();
            $table->string('psgc_code', 10)->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('philippine_provinces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained('philippine_regions')->cascadeOnDelete();
            $table->string('psgc_code', 10)->unique();
            $table->string('name');
            $table->timestamps();
            $table->index(['region_id', 'name']);
        });

        Schema::create('philippine_cities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained('philippine_regions')->cascadeOnDelete();
            $table->foreignId('province_id')->nullable()->constrained('philippine_provinces')->nullOnDelete();
            $table->string('psgc_code', 10)->unique();
            $table->string('name');
            $table->enum('city_class', ['HUC', 'ICC', 'CC']);
            $table->timestamps();
            $table->index(['region_id', 'name']);
            $table->index(['province_id', 'name']);
        });

        Schema::create('philippine_municipalities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained('philippine_regions')->cascadeOnDelete();
            $table->foreignId('province_id')->nullable()->constrained('philippine_provinces')->nullOnDelete();
            $table->string('psgc_code', 10)->unique();
            $table->string('name');
            $table->timestamps();
            $table->index(['region_id', 'name']);
            $table->index(['province_id', 'name']);
        });

        Schema::create('philippine_barangays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained('philippine_regions')->cascadeOnDelete();
            $table->foreignId('province_id')->nullable()->constrained('philippine_provinces')->nullOnDelete();
            $table->foreignId('city_id')->nullable()->constrained('philippine_cities')->cascadeOnDelete();
            $table->foreignId('municipality_id')->nullable()->constrained('philippine_municipalities')->cascadeOnDelete();
            $table->string('psgc_code', 10)->unique();
            $table->string('name');
            $table->string('zip_code', 4)->nullable();
            $table->timestamps();
            $table->index(['city_id', 'name']);
            $table->index(['municipality_id', 'name']);
            $table->index(['province_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('philippine_barangays');
        Schema::dropIfExists('philippine_municipalities');
        Schema::dropIfExists('philippine_cities');
        Schema::dropIfExists('philippine_provinces');
        Schema::dropIfExists('philippine_regions');
    }
};
