<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PhilippineAddressSeeder extends Seeder
{
    private static function key(string $code): string
    {
        return "code:{$code}";
    }

    public function run(): void
    {
        $path = database_path('seeders/data/philippine_address_data.json');

        if (! is_file($path)) {
            throw new \RuntimeException("Philippine address dataset not found at {$path}.");
        }

        $payload = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        foreach (['cities', 'municipalities'] as $level) {
            foreach ($payload[$level] as $row) {
                if (empty($row['province_code'])) {
                    throw new \RuntimeException("Missing province relationship for {$level} PSGC {$row['psgc_code']}.");
                }
            }
        }
        foreach ($payload['barangays'] as $row) {
            if (empty($row['city_code']) && empty($row['municipality_code'])) {
                throw new \RuntimeException("Missing city/municipality relationship for barangay PSGC {$row['psgc_code']}.");
            }
            if (empty($row['province_code']) || empty($row['zip_code'])) {
                throw new \RuntimeException("Missing province or ZIP code for barangay PSGC {$row['psgc_code']}.");
            }
        }
        $now = now();
        DB::transaction(function () use ($payload, $now): void {
            DB::table('philippine_barangays')->delete();
            DB::table('philippine_municipalities')->delete();
            DB::table('philippine_cities')->delete();
            DB::table('philippine_provinces')->delete();
            DB::table('philippine_regions')->delete();

            foreach (array_chunk($payload['regions'], 500) as $chunk) {
                DB::table('philippine_regions')->insert(array_map(static fn (array $row): array => [
                    'psgc_code' => $row['psgc_code'], 'name' => $row['name'], 'created_at' => $now, 'updated_at' => $now,
                ], $chunk));
            }
            $regionIds = DB::table('philippine_regions')->get(['id', 'psgc_code'])->mapWithKeys(fn ($row) => [self::key((string) $row->psgc_code) => $row->id]);

            foreach (array_chunk($payload['provinces'], 500) as $chunk) {
                DB::table('philippine_provinces')->insert(array_map(static fn (array $row): array => [
                    'region_id' => $regionIds[self::key($row['region_code'])], 'psgc_code' => $row['psgc_code'], 'name' => $row['name'], 'created_at' => $now, 'updated_at' => $now,
                ], $chunk));
            }
            $provinceIds = DB::table('philippine_provinces')->get(['id', 'psgc_code'])->mapWithKeys(fn ($row) => [self::key((string) $row->psgc_code) => $row->id]);

            foreach (array_chunk($payload['cities'], 500) as $chunk) {
                DB::table('philippine_cities')->insert(array_map(static fn (array $row): array => [
                    'region_id' => $regionIds[self::key($row['region_code'])], 'province_id' => $provinceIds[self::key($row['province_code'])],
                    'psgc_code' => $row['psgc_code'], 'name' => $row['name'], 'city_class' => $row['city_class'], 'created_at' => $now, 'updated_at' => $now,
                ], $chunk));
            }
            $cityIds = DB::table('philippine_cities')->get(['id', 'psgc_code'])->mapWithKeys(fn ($row) => [self::key((string) $row->psgc_code) => $row->id]);

            foreach (array_chunk($payload['municipalities'], 500) as $chunk) {
                DB::table('philippine_municipalities')->insert(array_map(static fn (array $row): array => [
                    'region_id' => $regionIds[self::key($row['region_code'])], 'province_id' => $provinceIds[self::key($row['province_code'])],
                    'psgc_code' => $row['psgc_code'], 'name' => $row['name'], 'created_at' => $now, 'updated_at' => $now,
                ], $chunk));
            }
            $municipalityIds = DB::table('philippine_municipalities')->get(['id', 'psgc_code'])->mapWithKeys(fn ($row) => [self::key((string) $row->psgc_code) => $row->id]);

            foreach (array_chunk($payload['barangays'], 500) as $chunk) {
                DB::table('philippine_barangays')->insert(array_map(static fn (array $row): array => [
                    'region_id' => $regionIds[self::key($row['region_code'])], 'province_id' => $provinceIds[self::key($row['province_code'])],
                    'city_id' => $row['city_code'] ? $cityIds[self::key($row['city_code'])] : null, 'municipality_id' => $row['municipality_code'] ? $municipalityIds[self::key($row['municipality_code'])] : null,
                    'psgc_code' => $row['psgc_code'], 'name' => $row['name'], 'zip_code' => $row['zip_code'], 'created_at' => $now, 'updated_at' => $now,
                ], $chunk));
            }

        });

        Schema::dropIfExists('philippine_addresses');
    }
}
