<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\AdminUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminUserService $adminUserService,
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    // GET /api/admin/users?search=
    public function index(Request $request): JsonResponse
    {
        $users = $this->adminUserService->getAll($request->query('search'));

        return response()->json([
            'users' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    // POST /api/admin/users
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->adminUserService->create($request->validated());

        return response()->json(new UserResource($user), 201);
    }

    // PUT /api/admin/users/{id}
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);

        if (! $user) {
            return response()->json(['message' => 'მომხმარებელი ვერ მოიძებნა.'], 404);
        }

        $updated = $this->adminUserService->update($user, $request->validated());

        return response()->json(new UserResource($updated));
    }

    // DELETE /api/admin/users/{id}
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);

        if (! $user) {
            return response()->json(['message' => 'მომხმარებელი ვერ მოიძებნა.'], 404);
        }

        try {
            $this->adminUserService->delete($request->user(), $user);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'მომხმარებელი წაიშალა.']);
    }
}
