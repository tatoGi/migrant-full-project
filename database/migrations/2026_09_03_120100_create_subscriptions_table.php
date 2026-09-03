<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('plan', ['standard', 'vip']);
            $table->unsignedInteger('amount');
            $table->string('currency', 3)->default('GEL');
            $table->string('flitt_order_id')->unique();
            $table->string('flitt_payment_id')->nullable();
            $table->enum('status', ['pending', 'trialing', 'active', 'past_due', 'cancelled'])->default('pending');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
