<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['customers', 'rider'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                if (! Schema::hasColumn($table->getTable(), 'phone_number')) {
                    $table->string('phone_number', 13)->nullable()->after('email');
                }

                if (! Schema::hasColumn($table->getTable(), 'is_admin_verified')) {
                    $table->boolean('is_admin_verified')->default(false)->after('phone_number');
                }
            });

            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE `{$tableName}` MODIFY `phone_number` VARCHAR(13) NULL");
            }

            // Existing accounts received an empty string when this migration
            // previously added the column. Empty strings cannot be unique.
            DB::table($tableName)->where('phone_number', '')->update(['phone_number' => null]);

            $hasPhoneUniqueIndex = collect(Schema::getIndexes($tableName))
                ->contains(fn (array $index): bool => $index['name'] === $tableName.'_phone_number_unique');

            if (! $hasPhoneUniqueIndex) {
                Schema::table($tableName, function (Blueprint $table): void {
                    $table->unique('phone_number');
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['customers', 'rider'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropUnique(['phone_number']);
                $table->dropColumn(['phone_number', 'is_admin_verified']);
            });
        }
    }
};
