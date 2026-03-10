<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->boolean('notification_listing_updates')->default(true)->after('languages');
            $table->boolean('notification_new_messages')->default(true)->after('notification_listing_updates');
            $table->boolean('notification_promotions')->default(true)->after('notification_new_messages');
        });
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'notification_listing_updates',
                'notification_new_messages',
                'notification_promotions',
            ]);
        });
    }
};
