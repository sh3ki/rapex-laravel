<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['customers', 'superadmin', 'admin', 'merchant', 'rider'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->string('status', 30)->default('active')->index();
                $table->text('status_reason')->nullable();
                $table->timestamp('suspended_at')->nullable();
                $table->timestamp('deactivated_at')->nullable();
                $table->timestamp('banned_at')->nullable();
                $table->unsignedBigInteger('status_changed_by')->nullable()->index();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        foreach (['customers', 'superadmin', 'admin', 'merchant', 'rider'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropSoftDeletes();
                $table->dropColumn([
                    'status', 'status_reason', 'suspended_at', 'deactivated_at',
                    'banned_at', 'status_changed_by',
                ]);
            });
        }
    }
};
