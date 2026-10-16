<?php

namespace Database\Seeders;

use App\Models\StoreCategory;
use App\Models\StoreType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StoreClassificationSeeder extends Seeder
{
    public function run(): void
    {
        $classifications = [
            'FOOD & BEVERAGES' => ['Restaurant', 'Fast Food', 'Carinderia / Eatery', 'Food Stall', 'Street Food Vendor', 'Snack House', 'Food Cart', 'Catering / Food Trays', 'BBQ / Grill Restaurant', 'Specialty Restaurant', 'Café / Coffee Shop', 'Milk Tea / Tea Shop', 'Juice / Shake / Beverage Shop', 'Liquor Store', 'Bakery', 'Cake / Pastry / Dessert Shop', 'Ice Cream / Gelato Shop', 'Confectionery / Candy Store', 'Specialty Food Store', 'Frozen Food Store', 'Meat / Poultry Store', 'Fish & Seafood Store', 'Deli / Cold Cuts Store', 'Rice & Grain Store', 'Food Ingredients Store', 'Snack Store'],
            'DAILY ESSENTIALS & GENERAL MERCHANDISE' => ['Sari-Sari Store', 'General Merchandise Store', 'Mini Mart', 'Convenience Store', 'Grocery Store', 'Supermarket', 'Department Store', 'Fresh Market Stall', 'Fruit & Vegetable Store', 'Water Refilling Station', 'Household Essentials Store', 'Housewares Store', 'Kitchenware & Plasticware Store', 'Cleaning & Laundry Supplies Store', 'Pharmacy / Drugstore', 'Health & Wellness Store', 'Medical Supplies Store', 'Personal Care Store', 'Optical Store', 'Baby & Maternity Store', 'School & Office Supplies Store', 'Pet Shop'],
            'GENERAL RETAIL, LIFESTYLE & SPECIALTY' => ['Gadget & Mobile Store', 'Computer & Electronics Store', 'Appliance Store', 'Gaming Store', 'Camera & Audio Store', 'CCTV & Security Store', 'Clothing & Fashion Store', 'Uniform Store', "Children's & Baby Clothing Store", 'Formal & Bridal Wear Store', 'Footwear Store', 'Bags & Luggage Store', 'Fashion Accessories Store', 'Beauty & Cosmetics Store', 'Beauty Supply Store', 'Jewelry & Watch Store', 'Furniture Store', 'Home & Living Store', 'Home Decor & Lighting Store', 'Toy & Hobby Store', 'Book & Stationery Store', 'Music & Musical Instruments Store', 'Collectibles & Trading Card Store', 'Gift & Souvenir Store', 'Arts & Crafts Store', 'Party Supplies Store', 'Sporting Goods Store', 'Outdoor & Camping Store', 'Fitness Equipment Store', 'Bicycle & Cycling Store', 'Fishing Store', 'Ukay-Ukay / Thrift Store', 'Preloved Shop', 'Surplus Store', 'Antique & Vintage Store', 'Imported Goods Store', 'Specialty Retail Store', 'Automotive Parts & Accessories Store', 'Motorcycle Parts & Accessories Store', 'E-Bike / Electric Scooter Store', 'Vape / E-Cigarette Store', 'Tobacco Store', 'Religious Goods Store', 'Novelty Store'],
            'BUSINESS, INDUSTRIAL & COMMERCIAL SUPPLIES' => ['Hardware & Construction Supply Store', 'Building Materials Store', 'Steel & Metal Supply Store', 'Lumber & Wood Supply Store', 'Roofing & Waterproofing Supply Store', 'Tile & Flooring Supply Store', 'Glass & Aluminum Supply Store', 'Paint & Finishing Supply Store', 'Electrical Supply Store', 'Plumbing & Water Supply Store', 'Tools & Equipment Store', 'Machinery & Industrial Equipment Store', 'Welding & Fabrication Supply Store', 'Automotive Parts Supply Store', 'Tires, Batteries & Lubricants Store', 'Workshop Equipment Store', 'Industrial Supply Store', 'Safety & PPE Store', 'Office & Commercial Supply Store', 'Packaging Supply Store', 'Printing Supply Store', 'Janitorial & Cleaning Supply Store', 'Restaurant & Commercial Kitchen Supply Store', 'Hotel & Hospitality Supply Store', 'Wholesale Store', 'Distributor / Supplier'],
            'AGRICULTURE, FARM & ANIMAL SUPPLY' => ['Agri-Supply Store', 'Seeds & Fertilizer Store', 'Organic Farming Supply Store', 'Animal Feeds & Supply Store', 'Veterinary Supply Store', 'Farm Equipment & Machinery Store', 'Irrigation & Agricultural Equipment Store', 'Plant Nursery', 'Garden & Landscaping Supply Store', 'Plant and Seeds Shop', 'Aquaculture & Fishery Supply Store', 'Farm Produce Store', 'Grain & Agricultural Products Store', 'Livestock & Poultry Trader', 'Seafood Wholesaler'],
        ];

        $descriptions = [
            'FOOD & BEVERAGES' => 'Ready ka na ba ibenta ang iyong specialty na panglasang Pinoy? Piliin ang pinakamalapit na uri ng food business mo.',
            'DAILY ESSENTIALS & GENERAL MERCHANDISE' => 'Para sa araw-araw na pangangailangan—grocery, wet market, sari-sari, health essentials, at iba pang mabilis hanapin ng customer.',
            'GENERAL RETAIL, LIFESTYLE & SPECIALTY' => 'Marketplace para sa gadgets, gaming, fashion, hobbies, pre-loved goods, at iba pang special listings.',
            'BUSINESS, INDUSTRIAL & COMMERCIAL SUPPLIES' => 'Para sa hardware, construction, industrial supply, office supply, at iba pang pang-negosyong produkto at kagamitan.',
            'AGRICULTURE, FARM & ANIMAL SUPPLY' => 'Para sa poultry, pet shop, farms, piggery, machines, pest control, fertilizer, rice, seeds, at lahat ng pang-agriculture.',
        ];

        $categoryOrder = 1;
        foreach ($classifications as $categoryName => $types) {
            $category = StoreCategory::withTrashed()->updateOrCreate(
                ['name' => $categoryName],
                ['description' => $descriptions[$categoryName], 'slug' => Str::slug($categoryName), 'sort_order' => $categoryOrder, 'status' => 'active'],
            );
            $categoryOrder++;
            if ($category->trashed()) {
                $category->restore();
            }
            foreach ($types as $typeOrder => $typeName) {
                $type = StoreType::withTrashed()->updateOrCreate(
                    ['name' => $typeName],
                    ['store_category_id' => $category->id, 'slug' => Str::slug($typeName), 'sort_order' => $typeOrder + 1, 'status' => 'active'],
                );
                if ($type->trashed()) {
                    $type->restore();
                }
            }
        }
    }
}
