<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadTempPhotoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    // POST /api/uploads/temp
    // Step 3 drag&drop — ფაილი ინახება temp/ -ში, token ბრუნდება
    public function temp(UploadTempPhotoRequest $request): JsonResponse
    {
        $file = $request->file('photo');
        $token = Str::uuid()->toString();
        $ext = $file->getClientOriginalExtension();
        $path = "temp/{$token}.{$ext}";

        Storage::disk('public')->put($path, file_get_contents($file));

        return response()->json([
            'token' => $token,
            'url' => Storage::url($path),
        ], 201);
    }
}
