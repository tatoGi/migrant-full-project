<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class AdminUserService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function getAll(?string $search = null): LengthAwarePaginator
    {
        return $this->userRepository->getAllForAdmin($search);
    }

    public function create(array $data): User
    {
        $user = $this->userRepository->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $user->assignRole($data['role']);

        return $user;
    }

    public function update(User $user, array $data): User
    {
        $attributes = array_filter([
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'password' => $data['password'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        $updated = $this->userRepository->update($user, $attributes);

        if (! empty($data['role']) && ! $updated->hasRole($data['role'])) {
            $updated->syncRoles([$data['role']]);
        }

        return $updated->fresh('roles');
    }

    public function delete(User $actingUser, User $user): void
    {
        if ($actingUser->is($user)) {
            throw ValidationException::withMessages([
                'user' => 'საკუთარი ანგარიშის წაშლა არ შეიძლება.',
            ]);
        }

        if ($user->hasRole('admin') && $this->userRepository->countByRole('admin') <= 1) {
            throw ValidationException::withMessages([
                'user' => 'ბოლო ადმინისტრატორის წაშლა არ შეიძლება.',
            ]);
        }

        $this->userRepository->delete($user);
    }
}
