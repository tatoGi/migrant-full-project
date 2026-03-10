<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderSettings extends Model
{
    protected $fillable = [
        'user_id',
        'default_profession',
        'default_price_type',
        'default_price_value',
        'service_mode',
        'booking_mode',
        'working_days',
        'working_hours_start',
        'working_hours_end',
        'slot_duration_minutes',
        'notify_bookings',
        'notify_messages',
        'notify_reviews',
        'notify_promotions',
    ];

    protected $casts = [
        'working_days' => 'array',
        'notify_bookings' => 'boolean',
        'notify_messages' => 'boolean',
        'notify_reviews' => 'boolean',
        'notify_promotions' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
