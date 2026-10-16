<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_profile_edit_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('merchant_id')->constrained('merchant')->cascadeOnDelete();
            $table->uuid('request_key')->nullable()->index();
            $table->string('field', 100);
            $table->text('from_value')->nullable();
            $table->text('to_value')->nullable();
            $table->string('status', 30)->default('pending')->index();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->string('approved_by_role', 30)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_profile_edit_requests');
    }
};
