<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'user_email' => $this->user?->email,
            'message' => $this->message,
            'is_admin_reply' => $this->is_admin_reply,
            'is_read' => $this->is_read,
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
