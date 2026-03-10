<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'banner_image' => ['sometimes', 'nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'banner_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'banner_subtitle' => ['sometimes', 'nullable', 'string', 'max:500'],
            'banner_cta_text' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'banner_image.image' => 'ფაილი უნდა იყოს სურათი.',
            'banner_image.mimes' => 'დაშვებულია JPG, PNG, WEBP.',
            'banner_image.max' => 'სურათი მაქსიმუმ 10MB.',
        ];
    }
}
