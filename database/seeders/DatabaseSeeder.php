<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Customer;
use App\Models\Merchant;
use App\Models\Rider;
use App\Models\Superadmin;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
            ],
        );

        Admin::updateOrCreate(
            ['email' => 'admin1@rapex.com.ph'],
            [
                'name' => 'Administrator 1',
                'password' => 'password',
            ],
        );

        Superadmin::updateOrCreate(
            ['email' => 'superadmin1@rapex.com.ph'],
            [
                'name' => 'Super Administrator 1',
                'password' => 'password',
            ],
        );

        Merchant::updateOrCreate(
            ['email' => 'merchant1@rapex.com.ph'],
            [
                'name' => 'Merchant 1',
                'password' => 'password',
            ],
        );

        Rider::updateOrCreate(
            ['email' => 'rider1@rapex.com.ph'],
            [
                'name' => 'Rider 1',
                'password' => 'password',
            ],
        );

        Customer::updateOrCreate(
            ['email' => 'customer1@rapex.com.ph'],
            [
                'name' => 'Customer 1',
                'password' => 'password',
            ],
        );

        $this->call(StoreClassificationSeeder::class);
    }
}
