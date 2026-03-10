<?php

use App\Http\Controllers\Api\Admin\AdminListingController;
use App\Http\Controllers\Api\Admin\BannerController;
use App\Http\Controllers\Api\Admin\SupportMessageController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ClientSavedListingController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProviderSettingsController;
use App\Http\Controllers\Api\PublicListingController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

// Public routes (no auth)
Route::get('categories', [CategoryController::class, 'index']);
Route::get('listings', [PublicListingController::class, 'index']);
Route::get('listings/{id}', [PublicListingController::class, 'show']);

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('password', [ProfileController::class, 'changePassword']);
    });
});

Route::get('listings/vip', [ListingController::class, 'vip']);

// Shared authenticated routes (all roles)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);

    // Temp photo upload — Step 3 drag&drop (before listing is created)
    Route::post('uploads/temp', [UploadController::class, 'temp']);
});

// Provider-only routes
Route::middleware(['auth:sanctum', 'role:provider'])->prefix('provider')->group(function () {
    Route::get('listings', [ListingController::class, 'index']);
    Route::post('listings', [ListingController::class, 'store']);
    Route::put('listings/{id}', [ListingController::class, 'update']);
    Route::delete('listings/{id}', [ListingController::class, 'destroy']);
    Route::post('listings/{id}/photos', [ListingController::class, 'uploadPhoto']);
    Route::delete('listings/{id}/photos/{index}', [ListingController::class, 'removePhoto']);

    Route::get('settings', [ProviderSettingsController::class, 'show']);
    Route::put('settings', [ProviderSettingsController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'role:client'])->prefix('client')->group(function () {
    Route::get('saved-listings', [ClientSavedListingController::class, 'index']);
    Route::post('saved-listings/{listingId}', [ClientSavedListingController::class, 'store']);
    Route::delete('saved-listings/{listingId}', [ClientSavedListingController::class, 'destroy']);
});

// Admin-only routes
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Listings
    Route::get('listings', [AdminListingController::class, 'index']);
    Route::put('listings/{id}', [AdminListingController::class, 'update']);
    Route::delete('listings/{id}', [AdminListingController::class, 'destroy']);

    // Support Messages
    Route::get('support/messages', [SupportMessageController::class, 'conversations']);
    Route::get('support/messages/{conversationId}', [SupportMessageController::class, 'show']);
    Route::post('support/reply', [SupportMessageController::class, 'reply']);

    // Banner
    Route::get('banner', [BannerController::class, 'show']);
    Route::post('banner', [BannerController::class, 'update']);
});
