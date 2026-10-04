<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_onboarding_applications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('merchant_id')->unique()->constrained('merchant')->cascadeOnDelete();
            $table->date('date_of_birth');
            $table->string('gender', 30);
            $table->string('nationality', 100)->default('Filipino');
            $table->string('profile_image')->nullable();
            $table->string('house_unit_building', 150);
            $table->string('street', 150);
            $table->string('barangay', 100);
            $table->string('city_municipality', 100);
            $table->string('province', 100);
            $table->string('region', 100);
            $table->string('postal_code', 20);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('id_type', 100);
            $table->string('id_front_image');
            $table->string('id_back_image');
            $table->string('selfie_image');
            $table->string('status', 30)->default('pending')->index();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->string('reviewed_by_role', 30)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_onboarding_applications');
    }
};
