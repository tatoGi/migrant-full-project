<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'banner_image_url' => $this->banner_image_url,
            'banner_title' => $this->banner_title,
            'banner_subtitle' => $this->banner_subtitle,
            'banner_cta_text' => $this->banner_cta_text,
        ];
    }
}
