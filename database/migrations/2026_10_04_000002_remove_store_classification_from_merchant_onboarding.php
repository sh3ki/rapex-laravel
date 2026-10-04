<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('merchant_onboarding_applications', 'store_category_id')) {
            return;
        }

        Schema::table('merchant_onboarding_applications', function (Blueprint $table): void {
            $table->dropForeign(['store_type_id']);
            $table->dropForeign(['store_category_id']);
            $table->dropColumn(['store_type_id', 'store_category_id']);
        });
    }

    public function down(): void
    {
        // Classification data remains independent of merchant onboarding.
    }
};
