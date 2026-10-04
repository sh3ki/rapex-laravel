<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $foreignKey = null;
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            $foreignKey = DB::selectOne(
                'select CONSTRAINT_NAME from information_schema.KEY_COLUMN_USAGE where TABLE_SCHEMA = DATABASE() and TABLE_NAME = ? and COLUMN_NAME = ? and REFERENCED_TABLE_NAME is not null limit 1',
                ['merchant_onboarding_applications', 'reviewed_by'],
            );
        }

        if ($foreignKey) {
            Schema::table('merchant_onboarding_applications', function (Blueprint $table) use ($foreignKey): void {
                $table->dropForeign((string) $foreignKey->CONSTRAINT_NAME);
            });
        }

        if (! Schema::hasColumn('merchant_onboarding_applications', 'reviewed_by_role')) {
            Schema::table('merchant_onboarding_applications', function (Blueprint $table): void {
                $table->string('reviewed_by_role', 30)->nullable()->after('reviewed_by');
            });
        }
    }

    public function down(): void
    {
        Schema::table('merchant_onboarding_applications', function (Blueprint $table): void {
            if (Schema::hasColumn('merchant_onboarding_applications', 'reviewed_by_role')) {
                $table->dropColumn('reviewed_by_role');
            }
        });
    }
};
