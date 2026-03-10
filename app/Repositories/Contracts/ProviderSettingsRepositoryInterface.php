<?php

namespace App\Repositories\Contracts;

use App\Models\ProviderSettings;
use App\Models\User;

interface ProviderSettingsRepositoryInterface
{
    public function findOrCreateByUser(User $user): ProviderSettings;

    public function update(ProviderSettings $settings, array $data): ProviderSettings;
}
