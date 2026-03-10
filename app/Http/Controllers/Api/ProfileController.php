<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserProfileResource;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profileService,
    ) {}

    // GET /api/profile
    public function show(Request $request): JsonResponse
    {
        $profile = $this->profileService->getProfile($request->user());

        $profile->setRelation('user', $request->user());

        return response()->json(new UserProfileResource($profile));
    }

    // PUT /api/profile
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $profile = $this->profileService->updateProfile($request->user(), $request->validated());

        $profile->setRelation('user', $request->user());

        return response()->json(new UserProfileResource($profile));
    }

    // PUT /api/auth/password
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->profileService->changePassword($request->user(), $request->password);

        return response()->json(['message' => 'პაროლი წარმატებით განახლდა.']);
    }
}
