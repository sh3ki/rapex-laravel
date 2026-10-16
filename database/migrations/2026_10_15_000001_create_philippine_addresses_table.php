<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Retained as a migration-history placeholder. The normalized hierarchy
        // is created by the following migration.
    }

    public function down(): void
    {
        Schema::dropIfExists('philippine_addresses');
    }
};
