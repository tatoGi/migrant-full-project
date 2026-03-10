<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Listing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider_name',
        'phone',
        'email',
        'nationality',
        'languages',
        'profession',
        'country',
        'city',
        'description',
        'listing_type',
        'price_type',
        'price_value',
        'photos',
        'booking_mode',
        'status',
        'views_count',
    ];

    protected $casts = [
        'languages' => 'array',
        'photos' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function savedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'saved_listings')
            ->withTimestamps();
    }
}
