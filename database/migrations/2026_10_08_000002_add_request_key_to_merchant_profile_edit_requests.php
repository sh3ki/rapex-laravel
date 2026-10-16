<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('merchant_profile_edit_requests', 'request_key')) {
            Schema::table('merchant_profile_edit_requests', function (Blueprint $table): void {
                $table->uuid('request_key')->nullable()->index()->after('merchant_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('merchant_profile_edit_requests', 'request_key')) {
            Schema::table('merchant_profile_edit_requests', function (Blueprint $table): void {
                $table->dropColumn('request_key');
            });
        }
    }
};
