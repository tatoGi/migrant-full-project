<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadTempPhotoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

class UploadController extends Controller
{
    // POST /api/uploads/temp
    // Step 3 drag&drop — ფაილი ინახება temp/-ში, token ბრუნდება
    public function temp(UploadTempPhotoRequest $request): JsonResponse
    {
        $file = $request->file('photo');
        $token = Str::uuid()->toString();
        $path = "temp/{$token}.jpg";

        $encoded = Image::read($file)
            ->scaleDown(width: 1200)
            ->toJpeg(quality: 85);

        Storage::disk('public')->put($path, $encoded);

        return response()->json([
            'token' => $token,
            'url' => Storage::url($path),
        ], 201);
    }
}
