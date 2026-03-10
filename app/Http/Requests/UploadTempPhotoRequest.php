<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadTempPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'ფოტო სავალდებულოა.',
            'photo.image' => 'ფაილი უნდა იყოს სურათი.',
            'photo.mimes' => 'დაშვებულია მხოლოდ JPG და PNG.',
            'photo.max' => 'ფოტო მაქსიმუმ 5MB უნდა იყოს.',
        ];
    }
}
