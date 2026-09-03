<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('flitt_payment_id')->nullable();
            $table->string('order_status');
            $table->json('payload');
            $table->timestamps();

            $table->unique(['subscription_id', 'flitt_payment_id', 'order_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_events');
    }
};
