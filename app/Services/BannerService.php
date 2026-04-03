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

    public function deleteImage(): SiteSettings
    {
        $settings = SiteSettings::instance();

        if ($settings->banner_image) {
            Storage::disk('public')->delete($settings->banner_image);
            $settings->update(['banner_image' => null]);
        }

        return $settings->fresh();
    }

    public function deleteLogo(): SiteSettings
    {
        $settings = SiteSettings::instance();

        if ($settings->logo) {
            Storage::disk('public')->delete($settings->logo);
            $settings->update(['logo' => null]);
        }

        return $settings->fresh();
    }

    public function update(array $data, ?UploadedFile $image = null, ?UploadedFile $logo = null): SiteSettings
    {
        $settings = SiteSettings::instance();

        if ($image) {
            // Delete old banner image if exists
            if ($settings->banner_image) {
                Storage::disk('public')->delete($settings->banner_image);
            }

            $data['banner_image'] = $image->store('banner', 'public');
        }

        if ($logo) {
            // Delete old logo if exists
            if ($settings->logo) {
                Storage::disk('public')->delete($settings->logo);
            }

            $data['logo'] = $logo->store('site', 'public');
        }

        $settings->update($data);

        return $settings->fresh();
    }
}
