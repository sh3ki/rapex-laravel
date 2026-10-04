<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['customers', 'merchant', 'rider'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->boolean('is_email_verified')->default(false)->after('email_verified_at');
                $table->string('email_verification_code_hash')->nullable()->after('is_email_verified');
                $table->timestamp('email_verification_expires_at')->nullable()->after('email_verification_code_hash');
            });

            DB::table($tableName)
                ->whereNotNull('email_verified_at')
                ->update(['is_email_verified' => true]);
        }
    }

    public function down(): void
    {
        foreach (['customers', 'merchant', 'rider'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropColumn([
                    'is_email_verified',
                    'email_verification_code_hash',
                    'email_verification_expires_at',
                ]);
            });
        }
    }
};
