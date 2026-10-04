<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['superadmins', 'admins', 'merchants', 'riders'] as $tableName) {
            Schema::create('password_reset_tokens_'.$tableName, function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['riders', 'merchants', 'admins', 'superadmins'] as $tableName) {
            Schema::dropIfExists('password_reset_tokens_'.$tableName);
        }
    }
};
