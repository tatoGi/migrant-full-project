<?php

namespace App\Services;

use App\Models\ProviderSettings;
use App\Models\User;
use App\Repositories\Contracts\ProviderSettingsRepositoryInterface;

class ProviderSettingsService
{
    public function __construct(
        private readonly ProviderSettingsRepositoryInterface $settingsRepository,
    ) {}

    public function getSettings(User $user): ProviderSettings
    {
        return $this->settingsRepository->findOrCreateByUser($user);
    }

    public function updateSettings(User $user, array $data): ProviderSettings
    {
        $settings = $this->settingsRepository->findOrCreateByUser($user);

        return $this->settingsRepository->update($settings, $data);
    }
}
