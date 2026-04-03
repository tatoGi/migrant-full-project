<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Laravel\Scout\Searchable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Listing extends Model implements HasMedia
{
    use HasFactory, HasSlug, InteractsWithMedia, LogsActivity, Searchable;

    protected $fillable = [
        'user_id',
        'slug',
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
        'booking_mode',
        'status',
        'views_count',
    ];

    protected $casts = [
        'languages' => 'array',
    ];

    // --- Sluggable ---

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom(['provider_name', 'profession'])
            ->saveSlugsTo('slug');
    }

    // --- MediaLibrary ---

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photos');
    }

    // --- ActivityLog ---

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'listing_type', 'profession', 'country', 'city', 'price_type', 'price_value'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    // --- Scout ---

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'provider_name' => $this->provider_name,
            'profession' => $this->profession,
            'city' => $this->city,
            'country' => $this->country,
            'description' => $this->description,
            'nationality' => $this->nationality,
            'languages' => $this->languages,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'active';
    }

    // --- Relations ---

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
