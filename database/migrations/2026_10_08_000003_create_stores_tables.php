<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('merchant_id')->constrained('merchant')->cascadeOnDelete();
            $table->string('name', 30)->unique();
            $table->string('profile_image')->nullable();
            $table->string('banner_image')->nullable();
            $table->string('tagline', 80);
            $table->string('slug', 30)->unique();
            $table->text('description');
            $table->string('contact_email')->nullable();
            $table->string('contact_mobile_phone', 20)->nullable();
            $table->string('contact_telephone', 30)->nullable();
            $table->string('business_structure', 30);
            $table->string('business_registration', 30);
            $table->string('house_unit_building', 150);
            $table->string('street', 150);
            $table->string('barangay', 100);
            $table->string('city_municipality', 100);
            $table->string('province', 100);
            $table->string('region', 100);
            $table->string('postal_code', 20);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('status', 30)->default('pending')->index();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->string('reviewed_by_role', 30)->nullable();
            $table->timestamps();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamp('banned_at')->nullable();
            $table->unsignedBigInteger('status_changed_by')->nullable();
            $table->timestamp('status_changed_at')->nullable();
            $table->softDeletes();
            $table->index(['merchant_id', 'status']);
        });

        Schema::create('store_document', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('store')->cascadeOnDelete();
            $table->string('document_type', 100);
            $table->string('file_path');
            $table->string('original_file_name');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->string('status', 30)->default('pending')->index();
            $table->timestamp('uploaded_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_document');
        Schema::dropIfExists('store');
    }
};
