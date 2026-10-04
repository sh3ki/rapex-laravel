<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Merchant;
use App\Models\MerchantOnboardingApplication;
use App\Models\Rider;
use App\Models\Superadmin;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MerchantOnboardingController extends Controller
{
    private const IMAGE_FIELDS = ['profile_image', 'id_front_image', 'id_back_image', 'selfie_image'];

    public function show(Request $request): Response|RedirectResponse
    {
        $merchant = $request->user();
        abort_unless($merchant instanceof Merchant, 403);
        $application = $merchant->onboardingApplication;

        if ($merchant->onboarding_admin_verified && $application?->status === 'approved') {
            return to_route('role.dashboard', ['role' => 'merchant']);
        }

        return Inertia::render('merchant/onboarding', [
            'merchant' => $merchant->only(['id', 'first_name', 'middle_name', 'last_name', 'email', 'phone_number']),
            'application' => $application,
            'googleMapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }

    public function submit(Request $request): RedirectResponse
    {
        $merchant = $request->user();
        abort_unless($merchant instanceof Merchant, 403);
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'], 'middle_name' => ['nullable', 'string', 'max:100'], 'last_name' => ['required', 'string', 'max:100'],
            'date_of_birth' => ['required', 'date', 'before:today'], 'gender' => ['required', Rule::in(['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'])], 'nationality' => ['required', 'string', 'max:100'],
            'house_unit_building' => ['required', 'string', 'max:150'], 'street' => ['required', 'string', 'max:150'], 'barangay' => ['required', 'string', 'max:100'],
            'city_municipality' => ['required', 'string', 'max:100'], 'province' => ['required', 'string', 'max:100'], 'region' => ['required', 'string', 'max:100'], 'postal_code' => ['required', 'string', 'max:20'],
            'latitude' => ['required', 'numeric', 'between:-90,90'], 'longitude' => ['required', 'numeric', 'between:-180,180'],
            'id_type' => ['required', Rule::in(['National ID (PhilSys)', "Driver's License", 'Passport', 'UMID', 'Postal ID', 'SSS ID', 'PhilHealth ID', 'PRC ID', 'TIN ID', "Voter's ID", 'NBI Clearance', 'Other Government-Issued ID'])],
            'profile_image' => ['nullable', 'image', 'max:1024'], 'id_front_image' => ['required', 'image', 'max:1024'], 'id_back_image' => ['required', 'image', 'max:1024'], 'selfie_image' => ['required', 'image', 'max:1024'],
        ]);

        $application = $merchant->onboardingApplication;
        foreach (self::IMAGE_FIELDS as $field) {
            if ($request->hasFile($field)) {
                if ($application?->{$field}) {
                    Storage::disk('local')->delete($application->{$field});
                }
                $data[$field] = $request->file($field)->storeAs('merchant-onboarding/'.$merchant->getKey(), Str::uuid().'.'.$request->file($field)->extension(), 'local');
            } elseif ($field === 'profile_image') {
                if ($application?->profile_image) {
                    Storage::disk('local')->delete($application->profile_image);
                }
                $data[$field] = null;
            }
        }

        DB::transaction(function () use ($merchant, $data): void {
            $merchant->forceFill([
                'first_name' => $data['first_name'], 'middle_name' => $data['middle_name'] ?? null, 'last_name' => $data['last_name'],
                'name' => collect([$data['first_name'], $data['middle_name'] ?? null, $data['last_name']])->filter()->implode(' '),
                'onboarding_completed' => true, 'onboarding_completed_at' => now(), 'onboarding_admin_verified' => false, 'onboarding_admin_verified_at' => null, 'status' => 'pending',
            ])->save();
            $application = $merchant->onboardingApplication()->updateOrCreate(['merchant_id' => $merchant->getKey()], [...$data, 'status' => 'pending', 'rejection_reason' => null, 'submitted_at' => now()]);
            $application->forceFill(['status' => 'pending', 'rejection_reason' => null, 'reviewed_at' => null, 'reviewed_by' => null, 'reviewed_by_role' => null])->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your merchant application has been submitted and is pending admin review.']);

        return redirect('/onboarding');
    }

    public function media(Request $request, string $field): mixed
    {
        $merchant = auth('merchant')->user();
        abort_unless($merchant instanceof Merchant && in_array($field, self::IMAGE_FIELDS, true), 403);
        $path = $merchant->onboardingApplication?->{$field};
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }

    public function applicationMedia(Request $request, string $role, MerchantOnboardingApplication $application, string $field): mixed
    {
        $this->authorizeReviewer($request);
        abort_unless(in_array($field, self::IMAGE_FIELDS, true), 404);
        abort_unless(Storage::disk('local')->exists($application->{$field}), 404);

        return Storage::disk('local')->response($application->{$field});
    }

    public function applications(Request $request): Response
    {
        $this->authorizeReviewer($request);

        return Inertia::render('admin/merchant-applications', [
            'applications' => MerchantOnboardingApplication::with('merchant:id,first_name,middle_name,last_name,email,phone_number')
                ->where('status', 'pending')
                ->whereHas('merchant', fn ($query) => $query->where('onboarding_completed', true))
                ->latest('submitted_at')
                ->get()
                ->map(fn (MerchantOnboardingApplication $application): array => [
                    'id' => $application->getKey(),
                    'status' => $application->status,
                    'submitted_at' => $application->submitted_at?->toISOString(),
                    'profile_image' => $application->profile_image ? "/merchant-management/applications/{$application->getKey()}/media/profile_image" : null,
                    'id_front_image' => $application->id_front_image ? "/merchant-management/applications/{$application->getKey()}/media/id_front_image" : null,
                    'id_back_image' => $application->id_back_image ? "/merchant-management/applications/{$application->getKey()}/media/id_back_image" : null,
                    'selfie_image' => $application->selfie_image ? "/merchant-management/applications/{$application->getKey()}/media/selfie_image" : null,
                    'date_of_birth' => $application->date_of_birth?->format('Y-m-d'),
                    'gender' => $application->gender,
                    'nationality' => $application->nationality,
                    'house_unit_building' => $application->house_unit_building,
                    'street' => $application->street,
                    'barangay' => $application->barangay,
                    'city_municipality' => $application->city_municipality,
                    'province' => $application->province,
                    'region' => $application->region,
                    'postal_code' => $application->postal_code,
                    'latitude' => $application->latitude,
                    'longitude' => $application->longitude,
                    'id_type' => $application->id_type,
                    'merchant' => [
                        'first_name' => $application->merchant->first_name,
                        'middle_name' => $application->merchant->middle_name,
                        'last_name' => $application->merchant->last_name,
                        'email' => $application->merchant->email,
                        'phone_number' => $application->merchant->phone_number,
                    ],
                ]),
        ]);
    }

    public function accounts(Request $request): Response
    {
        $this->authorizeReviewer($request);

        return Inertia::render('admin/merchant-accounts', [
            'accounts' => Merchant::withTrashed()->where('onboarding_completed', true)->with('onboardingApplication')->latest()->get()->map(fn (Merchant $merchant): array => [
                'id' => $merchant->getKey(),
                'first_name' => $merchant->first_name,
                'middle_name' => $merchant->middle_name,
                'last_name' => $merchant->last_name,
                'name' => collect([$merchant->first_name, $merchant->middle_name, $merchant->last_name])->filter()->implode(' ') ?: $merchant->name,
                'email' => $merchant->email,
                'phone_number' => $merchant->phone_number,
                'status' => $merchant->status,
                'profile_image' => $merchant->profile_image
                    ? "/merchant-management/accounts/{$merchant->getKey()}/media/profile"
                    : null,
                'registered_at' => $merchant->created_at?->toISOString(),
                'application_id' => $merchant->onboardingApplication?->getKey(),
                'date_of_birth' => $merchant->onboardingApplication?->date_of_birth?->format('Y-m-d'),
                'gender' => $merchant->onboardingApplication?->gender,
                'nationality' => $merchant->onboardingApplication?->nationality,
                'house_unit_building' => $merchant->onboardingApplication?->house_unit_building,
                'street' => $merchant->onboardingApplication?->street,
                'barangay' => $merchant->onboardingApplication?->barangay,
                'city_municipality' => $merchant->onboardingApplication?->city_municipality,
                'province' => $merchant->onboardingApplication?->province,
                'region' => $merchant->onboardingApplication?->region,
                'postal_code' => $merchant->onboardingApplication?->postal_code,
                'latitude' => $merchant->onboardingApplication?->latitude,
                'longitude' => $merchant->onboardingApplication?->longitude,
                'id_type' => $merchant->onboardingApplication?->id_type,
                'onboarding_profile_image' => $this->applicationMediaUrl($merchant, 'profile_image'),
                'id_front_image' => $this->applicationMediaUrl($merchant, 'id_front_image'),
                'id_back_image' => $this->applicationMediaUrl($merchant, 'id_back_image'),
                'selfie_image' => $this->applicationMediaUrl($merchant, 'selfie_image'),
            ]),
        ]);
    }

    private function applicationMediaUrl(Merchant $merchant, string $field): ?string
    {
        return $merchant->onboardingApplication?->{$field}
            ? "/merchant-management/applications/{$merchant->onboardingApplication->getKey()}/media/{$field}"
            : null;
    }

    public function updateAccount(Request $request, string $role, Merchant $merchant): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', function (string $attribute, mixed $value, \Closure $fail) use ($merchant): void {
                foreach ([User::class, Admin::class, Superadmin::class, Rider::class, Merchant::class] as $model) {
                    if ($model::where('email', $value)->where('id', '!=', $merchant->getKey())->exists()) {
                        $fail('This email address is already registered.');

                        return;
                    }
                }
            }],
            'phone_number' => ['required', 'regex:/^\+639\d{9}$/'],
            'profile_image' => ['nullable', 'image', 'max:1024'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'])],
            'nationality' => ['nullable', 'string', 'max:100'],
            'house_unit_building' => ['nullable', 'string', 'max:150'], 'street' => ['nullable', 'string', 'max:150'], 'barangay' => ['nullable', 'string', 'max:100'],
            'city_municipality' => ['nullable', 'string', 'max:100'], 'province' => ['nullable', 'string', 'max:100'], 'region' => ['nullable', 'string', 'max:100'], 'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'], 'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'id_type' => ['nullable', Rule::in(['National ID (PhilSys)', "Driver's License", 'Passport', 'UMID', 'Postal ID', 'SSS ID', 'PhilHealth ID', 'PRC ID', 'TIN ID', "Voter's ID", 'NBI Clearance', 'Other Government-Issued ID'])],
            'id_front_image' => ['nullable', 'image', 'max:1024'], 'id_back_image' => ['nullable', 'image', 'max:1024'], 'selfie_image' => ['nullable', 'image', 'max:1024'],
            'status' => ['required', Rule::in(Merchant::STATUSES)],
            'status_reason' => ['nullable', 'string', 'max:2000'],
        ]);
        if ($data['status'] === 'active' && ! ($merchant->onboarding_admin_verified && $merchant->onboardingApplication?->status === 'approved')) {
            throw ValidationException::withMessages([
                'status' => 'A merchant can only become active after onboarding approval.',
            ]);
        }
        $status = $data['status'];
        if ($request->hasFile('profile_image')) {
            if ($merchant->profile_image) {
                Storage::disk('local')->delete($merchant->profile_image);
            }
            $data['profile_image'] = $request->file('profile_image')->storeAs(
                'merchant-profiles/'.$merchant->getKey(),
                Str::uuid().'.'.$request->file('profile_image')->extension(),
                'local',
            );
        }
        $application = $merchant->onboardingApplication;
        if ($application) {
            $applicationData = collect(['date_of_birth', 'gender', 'nationality', 'house_unit_building', 'street', 'barangay', 'city_municipality', 'province', 'region', 'postal_code', 'latitude', 'longitude', 'id_type'])
                ->filter(fn (string $field): bool => array_key_exists($field, $data))
                ->mapWithKeys(fn (string $field): array => [$field => $data[$field]])
                ->all();
            foreach (['profile_image', 'id_front_image', 'id_back_image', 'selfie_image'] as $field) {
                if ($request->hasFile($field)) {
                    if ($application->{$field}) {
                        Storage::disk('local')->delete($application->{$field});
                    }
                    $applicationData[$field] = $request->file($field)->storeAs('merchant-onboarding/'.$merchant->getKey(), Str::uuid().'.'.$request->file($field)->extension(), 'local');
                    if ($field === 'profile_image') {
                        $data['profile_image'] = $applicationData[$field];
                    }
                }
            }
            $application->forceFill($applicationData)->save();
        }
        $merchant->forceFill([
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'name' => collect([$data['first_name'], $data['middle_name'] ?? null, $data['last_name']])->filter()->implode(' '),
            'email' => $data['email'],
            'phone_number' => $data['phone_number'],
            'profile_image' => $data['profile_image'] ?? $merchant->profile_image,
            'status' => $status,
            'status_reason' => $data['status_reason'] ?? $merchant->status_reason,
            'suspended_at' => $status === 'suspended' ? ($merchant->suspended_at ?? now()) : null,
            'banned_at' => $status === 'banned' ? ($merchant->banned_at ?? now()) : null,
            'deactivated_at' => $status === 'deactivated' ? ($merchant->deactivated_at ?? now()) : null,
            'status_changed_by' => $request->user()->getKey(),
        ])->save();

        if ($status === 'deleted') {
            $merchant->delete();
        } elseif ($merchant->trashed()) {
            $merchant->restore();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Merchant account status updated.']);

        return back();
    }

    public function profileMedia(Request $request, string $role, Merchant $merchant): mixed
    {
        $this->authorizeReviewer($request);
        abort_unless($merchant->profile_image && Storage::disk('local')->exists($merchant->profile_image), 404);

        return Storage::disk('local')->response($merchant->profile_image);
    }

    public function changePassword(Request $request, string $role, Merchant $merchant): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);
        $merchant->forceFill(['password' => Hash::make($data['password'])])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Merchant password updated.']);

        return back();
    }

    public function deleteAccount(Request $request, string $role, Merchant $merchant): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $merchant->forceFill([
            'status' => 'deleted',
            'status_changed_by' => $request->user()->getKey(),
        ])->save();
        $merchant->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Merchant account deleted.']);

        return back();
    }

    public function review(Request $request, string $role, MerchantOnboardingApplication $application): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $data = $request->validate(['status' => ['required', Rule::in(['approved', 'rejected'])], 'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:2000']]);
        $approved = $data['status'] === 'approved';
        $reviewerRole = $request->user()?->getTable() === 'superadmin' ? 'superadmin' : 'admin';
        $application->forceFill(['status' => $data['status'], 'rejection_reason' => $approved ? null : $data['rejection_reason'], 'reviewed_at' => now(), 'reviewed_by' => $request->user()->getKey(), 'reviewed_by_role' => $reviewerRole])->save();
        $merchantAttributes = [
            'status' => $approved ? 'active' : 'pending',
            'onboarding_admin_verified' => $approved,
            'onboarding_admin_verified_at' => $approved ? now() : null,
            'onboarding_completed' => $approved,
            'onboarding_completed_at' => $approved ? now() : null,
        ];

        if ($approved) {
            $merchantAttributes['profile_image'] = $application->profile_image;
        }

        $application->merchant()->update($merchantAttributes);

        Inertia::flash('toast', [
            'type' => $approved ? 'success' : 'warning',
            'message' => $approved ? 'Merchant application approved.' : 'Merchant application rejected.',
        ]);

        return back();
    }

    private function authorizeReviewer(Request $request): void
    {
        abort_unless(in_array($this->role($request), ['admin', 'superadmin'], true), 403);
    }

    private function role(Request $request): string
    {
        return (string) ($request->route('role') ?: str($request->getHost())->before('.localhost')->toString());
    }
}
