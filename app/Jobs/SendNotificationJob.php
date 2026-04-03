<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\RateLimitedMiddleware\RateLimited;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly string $message,
    ) {}

    public function middleware(): array
    {
        // Max 30 notifications per minute across all workers
        return [
            (new RateLimited)->allow(30)->everySeconds(60),
        ];
    }

    public function handle(): void
    {
        // TODO: send push/email notification to $this->userId
    }
}
