<?php

namespace App\Repositories;

use App\Models\ProviderSettings;
use App\Models\User;
use App\Repositories\Contracts\ProviderSettingsRepositoryInterface;

class ProviderSettingsRepository implements ProviderSettingsRepositoryInterface
{
    public function findOrCreateByUser(User $user): ProviderSettings
    {
        return ProviderSettings::firstOrCreate(
            ['user_id' => $user->id],
            [
                'working_days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            ],
        );
    }

    public function update(ProviderSettings $settings, array $data): ProviderSettings
    {
        $settings->update($data);

        return $settings->fresh();
    }
}
