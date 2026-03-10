<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'phone',
        'country',
        'city',
        'nationality',
        'languages',
        'notification_listing_updates',
        'notification_new_messages',
        'notification_promotions',
    ];

    protected $casts = [
        'languages' => 'array',
        'notification_listing_updates' => 'boolean',
        'notification_new_messages' => 'boolean',
        'notification_promotions' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
