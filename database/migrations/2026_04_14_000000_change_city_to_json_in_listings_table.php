<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate existing string values to JSON arrays
        DB::table('listings')->get()->each(function ($listing) {
            $current = $listing->city;
            if ($current && ! str_starts_with($current, '[')) {
                DB::table('listings')
                    ->where('id', $listing->id)
                    ->update(['city' => json_encode([$current])]);
            }
        });

        Schema::table('listings', function (Blueprint $table) {
            $table->json('city')->change();
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->string('city')->change();
        });
    }
};
