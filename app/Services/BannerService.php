<?php

namespace App\Services;

use App\Models\SiteSettings;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class BannerService
{
    public function get(): SiteSettings
    {
        return SiteSettings::instance();
    }

    public function update(array $data, ?UploadedFile $image = null): SiteSettings
    {
        $settings = SiteSettings::instance();

        if ($image) {
            // Delete old banner image if exists
            if ($settings->banner_image) {
                Storage::disk('public')->delete($settings->banner_image);
            }

            $data['banner_image'] = $image->store('banner', 'public');
        }

        $settings->update($data);

        return $settings->fresh();
    }
}
