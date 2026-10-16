<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $descriptions = [
            'FOOD & BEVERAGES' => 'Ready ka na ba ibenta ang iyong specialty na panglasang Pinoy? Piliin ang pinakamalapit na uri ng food business mo.',
            'DAILY ESSENTIALS & GENERAL MERCHANDISE' => 'Para sa araw-araw na pangangailangan—grocery, wet market, sari-sari, health essentials, at iba pang mabilis hanapin ng customer.',
            'GENERAL RETAIL, LIFESTYLE & SPECIALTY' => 'Marketplace para sa gadgets, gaming, fashion, hobbies, pre-loved goods, at iba pang special listings.',
            'BUSINESS, INDUSTRIAL & COMMERCIAL SUPPLIES' => 'Para sa hardware, construction, industrial supply, office supply, at iba pang pang-negosyong produkto at kagamitan.',
            'AGRICULTURE, FARM & ANIMAL SUPPLY' => 'Para sa poultry, pet shop, farms, piggery, machines, pest control, fertilizer, rice, seeds, at lahat ng pang-agriculture.',
        ];

        foreach ($descriptions as $name => $description) {
            DB::table('store_categories')
                ->where('name', $name)
                ->where(function ($query): void {
                    $query->whereNull('description')->orWhere('description', '');
                })
                ->update(['description' => $description]);
        }
    }

    public function down(): void
    {
        // Do not remove descriptions that may have been edited after the migration.
    }
};
