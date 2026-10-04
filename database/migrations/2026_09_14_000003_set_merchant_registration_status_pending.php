<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant', function (Blueprint $table): void {
            $table->string('status', 30)->default('pending')->change();
        });

        DB::table('merchant')
            ->whereIn('status', ['active', 'inactive'])
            ->where(function ($query): void {
                $query->whereNull('onboarding_admin_verified')
                    ->orWhere('onboarding_admin_verified', false);
            })
            ->update(['status' => 'pending']);
    }

    public function down(): void
    {
        Schema::table('merchant', function (Blueprint $table): void {
            $table->string('status', 30)->default('active')->change();
        });
    }
};
