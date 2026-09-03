<?php

namespace App\Http\Controllers\Api;

use App\Clients\FlittClient;
use App\Http\Controllers\Controller;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlittWebhookController extends Controller
{
    public function __construct(
        private readonly FlittClient $flitt,
        private readonly SubscriptionService $subscriptionService,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $payload = $request->input('response', $request->all());

        if (! $this->flitt->verifySignature($payload)) {
            return response()->json(['message' => 'invalid signature'], 401);
        }

        $this->subscriptionService->handleCallback($payload);

        return response()->json(['message' => 'ok']);
    }
}
