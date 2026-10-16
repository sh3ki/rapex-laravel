<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $regionId = DB::table('philippine_regions')->where('psgc_code', '1300000000')->value('id');
        if ($regionId) {
            DB::table('philippine_provinces')->updateOrInsert(
                ['psgc_code' => '1300000000'],
                ['region_id' => $regionId, 'name' => 'National Capital Region (NCR)', 'created_at' => now(), 'updated_at' => now()]
            );
        }

        $cityProvinceMap = [
            '0330100000' => '0305400000', '0331400000' => '0307100000', '0431200000' => '0405600000',
            '0631000000' => '0603000000', '0730600000' => '0702200000', '0731100000' => '0702200000',
            '0731300000' => '0702200000', '0831600000' => '0803700000', '0931700000' => '0907300000',
            '0990101000' => '1900700000', '1030500000' => '1004300000', '1030900000' => '1003500000',
            '1130700000' => '1102400000', '1230800000' => '1206300000',
            '1430300000' => '1401100000', '1630400000' => '1600200000', '1731500000' => '1705300000',
            '1830200000' => '1804500000',
        ];

        foreach ($cityProvinceMap as $cityCode => $provinceCode) {
            DB::table('philippine_cities')->where('psgc_code', $cityCode)->update([
                'province_id' => DB::table('philippine_provinces')->where('psgc_code', $provinceCode)->value('id'),
            ]);
        }
        DB::table('philippine_cities')->where('region_id', $regionId)->update([
            'province_id' => DB::table('philippine_provinces')->where('psgc_code', '1300000000')->value('id'),
        ]);
        DB::table('philippine_municipalities')->whereNull('province_id')->update([
            'province_id' => DB::table('philippine_provinces')->where('psgc_code', '1300000000')->value('id'),
        ]);

        $cityProvinceIds = DB::table('philippine_cities')->pluck('province_id', 'id');
        $municipalityProvinceIds = DB::table('philippine_municipalities')->pluck('province_id', 'id');
        DB::table('philippine_barangays')->whereNull('province_id')->orderBy('id')->chunkById(500, function ($rows) use ($cityProvinceIds, $municipalityProvinceIds): void {
            foreach ($rows as $row) {
                $provinceId = $row->city_id ? $cityProvinceIds[$row->city_id] ?? null : ($municipalityProvinceIds[$row->municipality_id] ?? null);
                if ($provinceId) DB::table('philippine_barangays')->where('id', $row->id)->update(['province_id' => $provinceId]);
            }
        });

        $dropForeignKey = static function (string $table, string $constraint): void {
            if (DB::table('information_schema.KEY_COLUMN_USAGE')->where('CONSTRAINT_SCHEMA', DB::getDatabaseName())->where('TABLE_NAME', $table)->where('CONSTRAINT_NAME', $constraint)->exists()) {
                DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY {$constraint}");
            }
        };
        $dropForeignKey('philippine_cities', 'philippine_cities_province_id_foreign');
        $dropForeignKey('philippine_municipalities', 'philippine_municipalities_province_id_foreign');
        $dropForeignKey('philippine_barangays', 'philippine_barangays_province_id_foreign');
        DB::statement('ALTER TABLE philippine_cities MODIFY province_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE philippine_municipalities MODIFY province_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE philippine_barangays MODIFY province_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE philippine_cities ADD CONSTRAINT philippine_cities_province_id_foreign FOREIGN KEY (province_id) REFERENCES philippine_provinces(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE philippine_municipalities ADD CONSTRAINT philippine_municipalities_province_id_foreign FOREIGN KEY (province_id) REFERENCES philippine_provinces(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE philippine_barangays ADD CONSTRAINT philippine_barangays_province_id_foreign FOREIGN KEY (province_id) REFERENCES philippine_provinces(id) ON DELETE CASCADE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE philippine_cities DROP FOREIGN KEY philippine_cities_province_id_foreign');
        DB::statement('ALTER TABLE philippine_municipalities DROP FOREIGN KEY philippine_municipalities_province_id_foreign');
        DB::statement('ALTER TABLE philippine_barangays DROP FOREIGN KEY philippine_barangays_province_id_foreign');
        DB::statement('ALTER TABLE philippine_barangays MODIFY province_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE philippine_municipalities MODIFY province_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE philippine_cities MODIFY province_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE philippine_cities ADD CONSTRAINT philippine_cities_province_id_foreign FOREIGN KEY (province_id) REFERENCES philippine_provinces(id) ON DELETE SET NULL');
        DB::statement('ALTER TABLE philippine_municipalities ADD CONSTRAINT philippine_municipalities_province_id_foreign FOREIGN KEY (province_id) REFERENCES philippine_provinces(id) ON DELETE SET NULL');
        DB::statement('ALTER TABLE philippine_barangays ADD CONSTRAINT philippine_barangays_province_id_foreign FOREIGN KEY (province_id) REFERENCES philippine_provinces(id) ON DELETE SET NULL');
    }
};
