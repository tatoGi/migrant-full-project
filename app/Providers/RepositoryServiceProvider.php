<?php

namespace App\Providers;

use App\Repositories\Contracts\ListingRepositoryInterface;
use App\Repositories\Contracts\ProviderSettingsRepositoryInterface;
use App\Repositories\Contracts\SavedListingRepositoryInterface;
use App\Repositories\Contracts\UserProfileRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\ListingRepository;
use App\Repositories\ProviderSettingsRepository;
use App\Repositories\SavedListingRepository;
use App\Repositories\UserProfileRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(ListingRepositoryInterface::class, ListingRepository::class);
        $this->app->bind(UserProfileRepositoryInterface::class, UserProfileRepository::class);
        $this->app->bind(ProviderSettingsRepositoryInterface::class, ProviderSettingsRepository::class);
        $this->app->bind(SavedListingRepositoryInterface::class, SavedListingRepository::class);
    }
}
