<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateBannerRequest;
use App\Http\Resources\SiteSettingsResource;
use App\Services\BannerService;
use Illuminate\Http\JsonResponse;

class BannerController extends Controller
{
    public function __construct(
        private readonly BannerService $bannerService,
    ) {}

    // GET /api/admin/banner
    public function show(): JsonResponse
    {
        return response()->json(new SiteSettingsResource($this->bannerService->get()));
    }

    // DELETE /api/admin/site-settings/logo
    public function deleteLogo(): JsonResponse
    {
        return response()->json(new SiteSettingsResource($this->bannerService->deleteLogo()));
    }

    // DELETE /api/admin/site-settings/banner-image
    public function deleteImage(): JsonResponse
    {
        return response()->json(new SiteSettingsResource($this->bannerService->deleteImage()));
    }

    // POST /api/admin/site-settings  (multipart/form-data)
    public function update(UpdateBannerRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['banner_image', 'logo']);

        $settings = $this->bannerService->update(
            $data,
            $request->hasFile('banner_image') ? $request->file('banner_image') : null,
            $request->hasFile('logo') ? $request->file('logo') : null,
        );

        return response()->json(new SiteSettingsResource($settings));
    }
}
