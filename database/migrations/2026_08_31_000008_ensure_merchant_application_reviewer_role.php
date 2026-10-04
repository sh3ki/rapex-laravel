<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('merchant_onboarding_applications', 'reviewed_by_role')) {
            Schema::table('merchant_onboarding_applications', function (Blueprint $table): void {
                $table->string('reviewed_by_role', 30)->nullable()->after('reviewed_by');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('merchant_onboarding_applications', 'reviewed_by_role')) {
            Schema::table('merchant_onboarding_applications', function (Blueprint $table): void {
                $table->dropColumn('reviewed_by_role');
            });
        }
    }
};
