<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant', function (Blueprint $table): void {
            $table->boolean('onboarding_completed')->default(false)->after('is_admin_verified');
            $table->timestamp('onboarding_completed_at')->nullable()->after('onboarding_completed');
            $table->boolean('onboarding_admin_verified')->default(false)->after('onboarding_completed_at');
            $table->timestamp('onboarding_admin_verified_at')->nullable()->after('onboarding_admin_verified');
        });
    }

    public function down(): void
    {
        Schema::table('merchant', function (Blueprint $table): void {
            $table->dropColumn([
                'onboarding_completed',
                'onboarding_completed_at',
                'onboarding_admin_verified',
                'onboarding_admin_verified_at',
            ]);
        });
    }
};
