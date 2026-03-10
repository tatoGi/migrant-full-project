<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\UserProfile;
use App\Repositories\Contracts\UserProfileRepositoryInterface;

class UserProfileRepository implements UserProfileRepositoryInterface
{
    public function findOrCreateByUser(User $user): UserProfile
    {
        return UserProfile::firstOrCreate(
            ['user_id' => $user->id],
        );
    }

    public function update(UserProfile $profile, array $data): UserProfile
    {
        $profile->update($data);

        return $profile->fresh();
    }
}
