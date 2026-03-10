<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserProfile;
use App\Repositories\Contracts\UserProfileRepositoryInterface;
use Illuminate\Support\Facades\Hash;

class ProfileService
{
    public function __construct(
        private readonly UserProfileRepositoryInterface $profileRepository,
    ) {}

    public function getProfile(User $user): UserProfile
    {
        return $this->profileRepository->findOrCreateByUser($user);
    }

    public function updateProfile(User $user, array $data): UserProfile
    {
        $profile = $this->profileRepository->findOrCreateByUser($user);

        return $this->profileRepository->update($profile, $data);
    }

    public function changePassword(User $user, string $newPassword): void
    {
        $user->update(['password' => Hash::make($newPassword)]);
    }
}
