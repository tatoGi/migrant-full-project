<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function create(array $data): User;

    public function findByEmail(string $email): ?User;

    public function findById(int $id): ?User;

    public function getAllForAdmin(?string $search = null): LengthAwarePaginator;

    public function update(User $user, array $data): User;

    public function delete(User $user): void;

    public function countByRole(string $role): int;
}
