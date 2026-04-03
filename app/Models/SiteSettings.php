<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SiteSettings extends Model
{
    protected $fillable = [
        'logo',
        'banner_image',
        'banner_title',
        'banner_subtitle',
        'banner_cta_text',
    ];

    // Always use a single row (singleton pattern)
    public static function instance(): self
    {
        return self::firstOrCreate(['id' => 1]);
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? url(Storage::url($this->logo)) : null;
    }

    public function getBannerImageUrlAttribute(): ?string
    {
        return $this->banner_image ? url(Storage::url($this->banner_image)) : null;
    }
}