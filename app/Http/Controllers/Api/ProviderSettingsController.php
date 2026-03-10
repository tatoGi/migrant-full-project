<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provider\UpdateProviderSettingsRequest;
use App\Http\Resources\ProviderSettingsResource;
use App\Services\ProviderSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProviderSettingsController extends Controller
{
    public function __construct(
        private readonly ProviderSettingsService $settingsService,
    ) {}

    // GET /api/provider/settings
    public function show(Request $request): JsonResponse
    {
        $settings = $this->settingsService->getSettings($request->user());

        return response()->json(new ProviderSettingsResource($settings));
    }

    // PUT /api/provider/settings
    public function update(UpdateProviderSettingsRequest $request): JsonResponse
    {
        $settings = $this->settingsService->updateSettings($request->user(), $request->validated());

        return response()->json(new ProviderSettingsResource($settings));
    }
}
