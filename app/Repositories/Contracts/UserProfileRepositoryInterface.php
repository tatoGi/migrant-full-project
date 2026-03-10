<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use App\Models\UserProfile;

interface UserProfileRepositoryInterface
{
    public function findOrCreateByUser(User $user): UserProfile;

    public function update(UserProfile $profile, array $data): UserProfile;
}
