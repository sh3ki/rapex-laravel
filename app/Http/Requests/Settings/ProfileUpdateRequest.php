<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use App\Models\Merchant;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        if ($this->user() instanceof Merchant) {
            return [
                'first_name' => ['required', 'string', 'max:100'], 'middle_name' => ['nullable', 'string', 'max:100'], 'last_name' => ['required', 'string', 'max:100'],
                'email' => ['required', 'email', 'max:255'], 'phone_number' => ['required', 'regex:/^\\+639\\d{9}$/'],
                'date_of_birth' => ['nullable', 'date', 'before:today'], 'gender' => ['nullable', 'string', 'max:30'], 'nationality' => ['nullable', 'string', 'max:100'],
                'house_unit_building' => ['nullable', 'string', 'max:150'], 'street' => ['nullable', 'string', 'max:150'], 'barangay' => ['nullable', 'string', 'max:100'],
                'city_municipality' => ['nullable', 'string', 'max:100'], 'province' => ['nullable', 'string', 'max:100'], 'region' => ['nullable', 'string', 'max:100'], 'zip_code' => ['nullable', 'string', 'max:20'],
                'latitude' => ['nullable', 'numeric', 'between:-90,90'], 'longitude' => ['nullable', 'numeric', 'between:-180,180'], 'id_type' => ['nullable', 'string', 'max:100'],
                'profile_image' => ['nullable', 'image', 'max:1024'], 'id_front_image' => ['nullable', 'image', 'max:1024'], 'id_back_image' => ['nullable', 'image', 'max:1024'], 'selfie_image' => ['nullable', 'image', 'max:1024'],
            ];
        }

        return $this->profileRules($this->user()->id);
    }
}
