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

    // POST /api/admin/banner  (multipart/form-data — contains image file + text fields)
    public function update(UpdateBannerRequest $request): JsonResponse
    {
        $data = $request->safe()->except('banner_image');

        $settings = $this->bannerService->update(
            $data,
            $request->hasFile('banner_image') ? $request->file('banner_image') : null,
        );

        return response()->json(new SiteSettingsResource($settings));
    }
}
