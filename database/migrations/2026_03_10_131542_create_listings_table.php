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
        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Step 1 — Basic Info
            $table->string('provider_name');
            $table->string('phone');
            $table->string('nationality');
            $table->json('languages');

            // Step 2 — Service Details
            $table->string('profession');
            $table->string('country');
            $table->string('city');
            $table->text('description');
            $table->enum('listing_type', ['standard', 'vip'])->default('standard');

            // Step 3 — Price & Photos
            $table->enum('price_type', ['fixed', 'hourly', 'negotiable']);
            $table->decimal('price_value', 10, 2)->nullable();
            $table->json('photos')->nullable();

            // Extra
            $table->string('email')->nullable();
            $table->enum('booking_mode', ['request', 'calendar'])->default('request');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('views_count')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
