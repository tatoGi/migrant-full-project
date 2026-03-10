<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminReplyRequest;
use App\Http\Resources\SupportMessageResource;
use App\Services\SupportMessageService;
use Illuminate\Http\JsonResponse;

class SupportMessageController extends Controller
{
    public function __construct(
        private readonly SupportMessageService $supportMessageService,
    ) {}

    // GET /api/admin/support/messages — all conversations
    public function conversations(): JsonResponse
    {
        $conversations = $this->supportMessageService->getConversations();

        return response()->json(['conversations' => $conversations]);
    }

    // GET /api/admin/support/messages/{conversationId}
    public function show(string $conversationId): JsonResponse
    {
        $messages = $this->supportMessageService->getMessages($conversationId);

        return response()->json([
            'messages' => SupportMessageResource::collection($messages),
        ]);
    }

    // POST /api/admin/support/reply
    public function reply(AdminReplyRequest $request): JsonResponse
    {
        $message = $this->supportMessageService->reply(
            $request->conversation_id,
            $request->user_id,
            $request->message,
        );

        $message->load('user');

        return response()->json(new SupportMessageResource($message), 201);
    }
}
