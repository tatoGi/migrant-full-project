<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('provider_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            // Tab 4 — Service Parameters
            $table->string('default_profession')->nullable();
            $table->enum('default_price_type', ['fixed', 'hourly', 'negotiable'])->default('negotiable');
            $table->decimal('default_price_value', 10, 2)->nullable();
            $table->enum('service_mode', ['online', 'onsite', 'both'])->default('onsite');
            $table->enum('booking_mode', ['request', 'calendar'])->default('request');

            // Tab 5 — Availability
            $table->json('working_days')->nullable();
            $table->string('working_hours_start', 5)->default('09:00');
            $table->string('working_hours_end', 5)->default('18:00');
            $table->unsignedSmallInteger('slot_duration_minutes')->default(60);

            // Tab 7 — Notifications
            $table->boolean('notify_bookings')->default(true);
            $table->boolean('notify_messages')->default(true);
            $table->boolean('notify_reviews')->default(true);
            $table->boolean('notify_promotions')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provider_settings');
    }
};
