<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportMessageResource;
use App\Services\SupportMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportChatController extends Controller
{
    public function __construct(
        private readonly SupportMessageService $supportMessageService,
    ) {}

    // POST /api/support/send
    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['sometimes', 'nullable', 'string'],
        ]);

        $message = $this->supportMessageService->sendMessage(
            $request->user()->id,
            $request->message,
            $request->conversation_id,
        );

        return response()->json(new SupportMessageResource($message), 201);
    }

    // GET /api/support/history
    public function history(Request $request): JsonResponse
    {
        $conversationId = $this->supportMessageService->getUserConversation($request->user()->id);

        if (! $conversationId) {
            return response()->json(['messages' => [], 'conversation_id' => null]);
        }

        $messages = $this->supportMessageService->getMessages($conversationId);

        return response()->json([
            'conversation_id' => $conversationId,
            'messages' => SupportMessageResource::collection($messages),
        ]);
    }
}
