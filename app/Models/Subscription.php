<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'listing_id',
        'user_id',
        'plan',
        'amount',
        'currency',
        'flitt_order_id',
        'flitt_payment_id',
        'status',
        'trial_ends_at',
        'current_period_ends_at',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_ends_at' => 'datetime',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(SubscriptionEvent::class);
    }
}
