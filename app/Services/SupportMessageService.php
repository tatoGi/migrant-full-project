<?php

namespace App\Services;

use App\Models\SupportMessage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupportMessageService
{
    public function getConversations(): Collection
    {
        // Group messages by conversation_id, return latest message per conversation
        return SupportMessage::with('user')
            ->select('conversation_id', 'user_id',
                DB::raw('MAX(created_at) as last_date'),
                DB::raw('SUM(CASE WHEN is_read = 0 AND is_admin_reply = 0 THEN 1 ELSE 0 END) as unread_count')
            )
            ->groupBy('conversation_id', 'user_id')
            ->orderByDesc('last_date')
            ->get()
            ->map(function ($row) {
                $lastMessage = SupportMessage::where('conversation_id', $row->conversation_id)
                    ->latest()
                    ->first();

                return [
                    'conversation_id' => $row->conversation_id,
                    'user_id' => $row->user_id,
                    'user_email' => $row->user?->email,
                    'last_message' => $lastMessage?->message,
                    'last_date' => $row->last_date,
                    'unread_count' => (int) $row->unread_count,
                ];
            });
    }

    public function getMessages(string $conversationId): Collection
    {
        $messages = SupportMessage::with('user')
            ->where('conversation_id', $conversationId)
            ->orderBy('created_at')
            ->get();

        // Mark user messages as read
        SupportMessage::where('conversation_id', $conversationId)
            ->where('is_admin_reply', false)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $messages;
    }

    public function reply(string $conversationId, int $userId, string $message): SupportMessage
    {
        return SupportMessage::create([
            'conversation_id' => $conversationId,
            'user_id' => $userId,
            'message' => $message,
            'is_admin_reply' => true,
            'is_read' => true,
        ]);
    }

    public function startConversation(int $userId, string $message): SupportMessage
    {
        return SupportMessage::create([
            'conversation_id' => Str::uuid()->toString(),
            'user_id' => $userId,
            'message' => $message,
            'is_admin_reply' => false,
            'is_read' => false,
        ]);
    }

    public function sendMessage(int $userId, string $message, ?string $conversationId = null): SupportMessage
    {
        // Continue existing conversation or start new one
        if ($conversationId) {
            return SupportMessage::create([
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'message' => $message,
                'is_admin_reply' => false,
                'is_read' => false,
            ]);
        }

        return $this->startConversation($userId, $message);
    }

    public function getUserConversation(int $userId): ?string
    {
        return SupportMessage::where('user_id', $userId)
            ->value('conversation_id');
    }
}
