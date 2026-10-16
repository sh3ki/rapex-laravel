<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Merchant;
use App\Models\MerchantProfileEditRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        if ($request->user() instanceof Merchant) {
            $merchant = $request->user()->load('onboardingApplication');
            return Inertia::render('settings/profile', [
                'merchantProfile' => [
                    'merchant' => $merchant->only(['id', 'first_name', 'middle_name', 'last_name', 'email', 'phone_number']),
                    'application' => $merchant->onboardingApplication,
                    'idType' => $merchant->onboardingApplication?->id_type,
                    'media' => collect(['profile_image', 'id_front_image', 'id_back_image', 'selfie_image'])
                        ->mapWithKeys(fn (string $field): array => [$field => ($field === 'profile_image' ? ($merchant->profile_image ?: $merchant->onboardingApplication?->{$field}) : $merchant->onboardingApplication?->{$field}) ? "/onboarding/media/{$field}" : null])
                        ->all(),
                    'pendingEdits' => $merchant->profileEditRequests()->where('status', 'pending')->get(['field', 'requested_at']),
                ],
                'mustVerifyEmail' => false,
                'status' => $request->session()->get('status'),
            ]);
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        if ($request->user() instanceof Merchant) {
            $merchant = $request->user();
            $application = $merchant->onboardingApplication;
            $data = $request->validated();
            $fields = ['first_name', 'middle_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'gender', 'nationality', 'house_unit_building', 'street', 'barangay', 'city_municipality', 'province', 'region', 'zip_code', 'latitude', 'longitude', 'id_type'];
            $source = array_merge($merchant->only(['first_name', 'middle_name', 'last_name', 'email', 'phone_number']), $application?->only(array_slice($fields, 5)) ?? []);
            $files = ['profile_image', 'id_front_image', 'id_back_image', 'selfie_image'];
            foreach ($files as $field) {
                if ($request->hasFile($field)) {
                    $data[$field] = $request->file($field)->storeAs('merchant-profile-edits/'.$merchant->getKey(), Str::uuid().'.'.$request->file($field)->extension(), 'local');
                    $source[$field] = $application?->{$field} ?? $merchant->{$field};
                }
            }
            if ($merchant->profileEditRequests()->where('status', 'pending')->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages(['profile' => 'You already have a profile edit request pending admin approval.']);
            }
            $changed = collect(array_merge($fields, $files))->filter(fn (string $field): bool => array_key_exists($field, $data) && (string) ($data[$field] ?? '') !== (string) ($source[$field] ?? ''));
            if ($changed->isEmpty()) {
                return back();
            }
            $requestKey = (string) Str::uuid();
            DB::transaction(function () use ($merchant, $data, $source, $changed, $requestKey): void {
                foreach ($changed as $field) {
                    MerchantProfileEditRequest::create([
                        'merchant_id' => $merchant->getKey(), 'request_key' => $requestKey, 'field' => $field,
                        'from_value' => $source[$field] ?? null, 'to_value' => $data[$field] ?? null,
                        'status' => 'pending', 'requested_at' => now(),
                    ]);
                }
            });
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Your profile changes were submitted for admin approval.']);
            return to_route('profile.edit');
        }

        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
