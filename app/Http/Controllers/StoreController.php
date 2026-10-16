<?php

namespace App\Http\Controllers;

use App\Models\Merchant;
use App\Models\Store;
use App\Models\StoreCategory;
use App\Models\StoreDocument;
use App\Models\StoreType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    private const BUSINESS_STRUCTURES = ['sole-proprietorship', 'opc', 'partnership', 'corporation', 'cooperative'];
    private const BUSINESS_REGISTRATIONS = ['unregistered-microseller', 'non-vat-registration', 'vat-registration'];
    private const ID_TYPES = ['National ID (PhilSys)', "Driver's License", 'Passport', 'UMID', 'Postal ID', 'SSS ID', 'PhilHealth ID', 'PRC ID', 'TIN ID', "Voter's ID", 'NBI Clearance', 'Other Government-Issued ID'];

    public function applications(Request $request): Response
    {
        $this->authorizeReviewer($request);

        return Inertia::render('admin/store-applications', [
            'applications' => Store::with(['merchant:id,first_name,middle_name,last_name,email,phone_number', 'category:id,name', 'type:id,name', 'documents'])
                ->whereIn('status', ['pending', 'rejected'])
                ->latest('submitted_at')
                ->get()
                ->map(fn (Store $store): array => $this->applicationPayload($store, (string) ($request->route('role') ?: str($request->getHost())->before('.localhost')->toString())))
                ->values(),
        ]);
    }

    public function review(Request $request, string $role, mixed $store): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $store = $this->resolveStore($store);
        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:2000'],
        ]);
        $approved = $data['status'] === 'approved';
        $reviewerRole = $request->user()?->getTable() === 'superadmin' ? 'superadmin' : 'admin';
        $store->forceFill([
            'status' => $data['status'],
            'rejection_reason' => $approved ? null : $data['rejection_reason'],
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->getKey(),
            'reviewed_by_role' => $reviewerRole,
        ])->save();

        Inertia::flash('toast', [
            'type' => $approved ? 'success' : 'warning',
            'message' => $approved ? 'Store application approved.' : 'Store application rejected.',
        ]);

        return back();
    }

    public function applicationMedia(Request $request, string $role, mixed $store, string $field): mixed
    {
        $this->authorizeReviewer($request);
        $store = $this->resolveStore($store);
        abort_unless(in_array($field, ['profile_image', 'banner_image'], true), 404);
        $disk = Storage::disk('public')->exists($store->{$field}) ? Storage::disk('public') : Storage::disk('local');
        abort_unless($store->{$field} && $disk->exists($store->{$field}), 404);

        return $disk->response($store->{$field});
    }

    public function applicationDocumentMedia(Request $request, string $role, mixed $store, mixed $document): mixed
    {
        $this->authorizeReviewer($request);
        $store = $this->resolveStore($store);
        $document = $document instanceof StoreDocument ? $document : StoreDocument::query()->findOrFail($document);
        abort_unless($document->store_id === $store->getKey(), 404);
        $disk = Storage::disk($document->disk ?: 'local');
        abort_unless($disk->exists($document->file_path), 404);

        return $disk->response($document->file_path, $document->original_file_name, ['Content-Type' => $document->mime_type]);
    }

    private function applicationPayload(Store $store, string $role): array
    {
        $merchant = $store->merchant;

        return [
            'id' => $store->getKey(),
            'status' => $store->status,
            'name' => $store->name,
            'tagline' => $store->tagline,
            'description' => $store->description,
            'rejection_reason' => $store->rejection_reason,
            'submitted_at' => $store->submitted_at?->toISOString(),
            'reviewed_at' => $store->reviewed_at?->toISOString(),
            'profile_image' => $store->profile_image ? '/store-management/applications/'.$store->getKey().'/media/profile_image' : null,
            'banner_image' => $store->banner_image ? '/store-management/applications/'.$store->getKey().'/media/banner_image' : null,
            'category_name' => $store->category?->name,
            'type_name' => $store->type?->name,
            'business_structure' => $store->business_structure,
            'business_registration' => $store->business_registration,
            'valid_id_type' => $store->valid_id_type,
            'contact_email' => $store->contact_email,
            'contact_mobile_phone' => $store->contact_mobile_phone,
            'contact_telephone' => $store->contact_telephone,
            'house_unit_building' => $store->house_unit_building,
            'street' => $store->street,
            'barangay' => $store->barangay,
            'city_municipality' => $store->city_municipality,
            'province' => $store->province,
            'region' => $store->region,
            'zip_code' => $store->zip_code,
            'latitude' => $store->latitude,
            'longitude' => $store->longitude,
            'merchant' => $merchant ? [
                'name' => collect([$merchant->first_name, $merchant->middle_name, $merchant->last_name])->filter()->implode(' '),
                'email' => $merchant->email,
                'phone_number' => $merchant->phone_number,
            ] : null,
            'documents' => $store->documents->map(fn (StoreDocument $document): array => [
                'id' => $document->getKey(),
                'type' => $document->document_type,
                'name' => $document->original_file_name,
                'mime_type' => $document->mime_type,
                'url' => '/store-management/applications/'.$store->getKey().'/documents/'.$document->getKey().'/media',
            ])->values()->all(),
        ];
    }

    private function authorizeReviewer(Request $request): void
    {
        abort_unless(in_array((string) ($request->route('role') ?: str($request->getHost())->before('.localhost')->toString()), ['admin', 'superadmin'], true), 403);
    }

    private function resolveStore(mixed $store): Store
    {
        return $store instanceof Store ? $store : Store::query()->findOrFail($store);
    }

    public function index(Request $request): Response
    {
        $merchant = $request->user();
        abort_unless($merchant instanceof Merchant, 403);

        return Inertia::render('merchant/store-list', [
            'stores' => $merchant->stores()->oldest()->get()->values()->map(fn (Store $store, int $index): array => [
                'id' => $store->getKey(),
                'slot' => $index + 1,
                'name' => $store->name,
                'status' => $store->status,
                'profile_image' => $store->profile_image ? route('merchant.stores.media', ['store' => $store->getKey(), 'field' => 'profile_image']) : null,
                'banner_image' => $store->banner_image ? route('merchant.stores.media', ['store' => $store->getKey(), 'field' => 'banner_image']) : null,
            ]),
            'googleMapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }

    public function show(Request $request, Store $store): Response
    {
        abort_unless($store->merchant_id === $request->user()?->getKey(), 403);
        $store->load(['category:id,name,description', 'type:id,name,store_category_id', 'documents']);

        return Inertia::render('merchant/store-detail', [
            'store' => [
                'id' => $store->getKey(),
                'name' => $store->name,
                'tagline' => $store->tagline,
                'description' => $store->description,
                'status' => $store->status,
                'store_category_id' => $store->store_category_id,
                'store_type_id' => $store->store_type_id,
                'category_name' => $store->category?->name,
                'type_name' => $store->type?->name,
                'business_structure' => $store->business_structure,
                'business_registration' => $store->business_registration,
                'valid_id_type' => $store->valid_id_type,
                'contact_email' => $store->contact_email,
                'contact_mobile_phone' => $store->contact_mobile_phone,
                'contact_telephone' => $store->contact_telephone,
                'house_unit_building' => $store->house_unit_building,
                'street' => $store->street,
                'barangay' => $store->barangay,
                'city_municipality' => $store->city_municipality,
                'province' => $store->province,
                'region' => $store->region,
                'zip_code' => $store->zip_code,
                'latitude' => $store->latitude,
                'longitude' => $store->longitude,
                'profile_image' => $store->profile_image ? route('merchant.stores.media', ['store' => $store->getKey(), 'field' => 'profile_image']) : null,
                'banner_image' => $store->banner_image ? route('merchant.stores.media', ['store' => $store->getKey(), 'field' => 'banner_image']) : null,
                'documents' => $store->documents->map(fn (StoreDocument $document): array => [
                    'id' => $document->getKey(),
                    'type' => $document->document_type,
                    'name' => $document->original_file_name,
                    'mime_type' => $document->mime_type,
                    'url' => route('merchant.stores.documents.media', ['store' => $store->getKey(), 'document' => $document->getKey()]),
                ])->values(),
            ],
            'googleMapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }

    public function create(Request $request): Response
    {
        $merchant = $request->user();
        abort_unless($merchant instanceof Merchant, 403);
        abort_if($merchant->stores()->withTrashed()->count() >= 2, 403, 'Your two currently unlocked store slots are already in use.');

        return Inertia::render('merchant/store-create', [
            'merchantId' => $merchant->getKey(),
            'categories' => StoreCategory::available()->orderBy('sort_order')->orderBy('name')->get()->map(fn (StoreCategory $category): array => [
                'id' => $category->getKey(), 'name' => $category->name, 'description' => $category->description,
                'image_url' => $category->image ? route('merchant.stores.classification.media', ['kind' => 'categories', 'id' => $category->getKey()]) : null,
            ]),
            'types' => StoreType::available()->orderBy('sort_order')->orderBy('name')->get()->map(fn (StoreType $type): array => [
                'id' => $type->getKey(), 'name' => $type->name, 'store_category_id' => $type->store_category_id,
                'image_url' => $type->image ? route('merchant.stores.classification.media', ['kind' => 'types', 'id' => $type->getKey()]) : null,
            ]),
            'merchantEmail' => $merchant->email,
            'merchantPhone' => $merchant->phone_number,
            'merchantAddress' => $merchant->onboardingApplication?->only([
                'house_unit_building', 'street', 'barangay', 'city_municipality', 'province', 'region', 'zip_code', 'latitude', 'longitude',
            ]),
            'storeNames' => $merchant->stores()->withTrashed()->pluck('name')->values()->all(),
            'googleMapsApiKey' => config('services.google.maps_api_key'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $merchant = $request->user();
        abort_unless($merchant instanceof Merchant, 403);

        if ($merchant->stores()->withTrashed()->count() >= 2) {
            return back()->withErrors(['store' => 'Your two currently unlocked store slots are already in use.']);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:30', 'unique:store,name'],
            'store_category_id' => ['required', 'integer', Rule::exists('store_categories', 'id')->where(fn ($query) => $query->where('status', 'active')->whereNull('deleted_at'))],
            'store_type_id' => ['required', 'integer', Rule::exists('store_types', 'id')->where(fn ($query) => $query->where('status', 'active')->whereNull('deleted_at'))],
            'tagline' => ['required', 'string', 'max:80'],
            'description' => ['required', 'string', 'max:500'],
            'profile_image' => ['required', 'image', 'max:1024'],
            'banner_image' => ['required', 'image', 'max:1024'],
            'business_structure' => ['required', Rule::in(self::BUSINESS_STRUCTURES)],
            'business_registration' => ['required', Rule::in(self::BUSINESS_REGISTRATIONS)],
            'valid_id_type' => ['required', Rule::in(self::ID_TYPES)],
            'valid_id_front' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'valid_id_back' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'selfie' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'store_capture' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'documents' => ['nullable', 'array'],
            'documents.barangay_permit' => ['required_if:business_registration,non-vat-registration,vat-registration', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:3072'],
            'documents.business_certificate' => ['required_if:business_registration,non-vat-registration,vat-registration', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:3072'],
            'documents.proof_of_business_address' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:3072'],
            'documents.bir_certificate' => ['required_if:business_registration,vat-registration', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:3072'],
            'documents.mayors_business_permit' => ['required_if:business_registration,vat-registration', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:3072'],
            'documents.other_supporting_documents' => ['prohibited'],
            'other_documents' => ['nullable', 'array', 'max:3'],
            'other_documents.*' => ['file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:3072'],
            'contact_email' => ['required', 'email', 'max:255'],
            'contact_mobile_phone' => ['required', 'regex:/^\+639\d{9}$/'],
            'contact_telephone' => ['nullable', 'string', 'max:30'],
            'house_unit_building' => ['required', 'string', 'max:150'],
            'street' => ['required', 'string', 'max:150'],
            'barangay' => ['required', 'string', 'max:100'],
            'city_municipality' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'region' => ['required', 'string', 'max:100'],
            'zip_code' => ['required', 'string', 'max:20'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'terms_accepted' => ['accepted'],
        ]);

        $slug = Str::slug($data['name']);
        abort_unless(StoreType::available()->whereKey($data['store_type_id'])->where('store_category_id', $data['store_category_id'])->exists(), 422, 'The selected store type does not belong to the selected category.');
        $data['profile_image'] = $request->file('profile_image')->storeAs('stores/'.$merchant->getKey(), Str::uuid().'.'.$request->file('profile_image')->extension(), 'public');
        $data['banner_image'] = $request->file('banner_image')->storeAs('stores/'.$merchant->getKey(), Str::uuid().'.'.$request->file('banner_image')->extension(), 'public');

        $documentFiles = collect($request->file('documents', []))->filter();
        $otherFiles = collect($request->file('other_documents', []))->filter();
        $storeData = $data;
        unset($storeData['valid_id_front'], $storeData['valid_id_back'], $storeData['selfie'], $storeData['store_capture'], $storeData['documents'], $storeData['other_documents']);

        $store = Store::create([
            ...$storeData,
            'merchant_id' => $merchant->getKey(),
            'slug' => $slug,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        $requiredBusinessDocuments = $data['business_registration'] === 'vat-registration'
            ? ['barangay_permit', 'business_certificate', 'proof_of_business_address', 'bir_certificate', 'mayors_business_permit']
            : ($data['business_registration'] === 'non-vat-registration' ? ['barangay_permit', 'business_certificate', 'proof_of_business_address'] : ['proof_of_business_address']);
        $privateDocuments = collect([
            'valid_id_front' => [$request->file('valid_id_front'), true],
            'valid_id_back' => [$request->file('valid_id_back'), true],
            'selfie' => [$request->file('selfie'), true],
            'store_capture' => [$request->file('store_capture'), true],
        ])->merge($documentFiles->mapWithKeys(fn ($file, $type): array => [$type => [$file, in_array($type, $requiredBusinessDocuments, true)] ]));
        foreach ($otherFiles as $file) {
            $privateDocuments->push([$file, false, 'other_supporting_document']);
        }
        foreach ($privateDocuments as $type => $entry) {
            [$file, $required, $forcedType] = array_pad($entry, 3, null);
            if (!$file) continue;
            $documentType = $forcedType ?: $type;
            if ($documentType === 'business_certificate') {
                $documentType = match ($data['business_structure']) {
                    'sole-proprietorship' => 'dti_certificate',
                    'cooperative' => 'cda_certificate',
                    default => 'sec_certificate',
                };
            }
            $path = $file->storeAs('stores/'.$merchant->getKey().'/'.$store->getKey().'/documents', Str::uuid().'.'.$file->extension(), 'local');
            $store->documents()->create([
                'document_type' => $documentType,
                'file_path' => $path,
                'original_file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'disk' => 'local',
                'status' => 'pending',
                'is_required' => (bool) $required,
                'uploaded_at' => now(),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your store has been submitted and is pending admin review.']);

        return to_route('merchant.stores');
    }

    public function media(Request $request, Store $store, string $field): mixed
    {
        abort_unless($store->merchant_id === $request->user()?->getKey(), 403);
        abort_unless(in_array($field, ['profile_image', 'banner_image'], true), 404);
        $disk = Storage::disk('public')->exists($store->{$field}) ? Storage::disk('public') : Storage::disk('local');
        abort_unless($store->{$field} && $disk->exists($store->{$field}), 404);

        return $disk->response($store->{$field});
    }

    public function documentMedia(Request $request, Store $store, StoreDocument $document): mixed
    {
        abort_unless($store->merchant_id === $request->user()?->getKey() && $document->store_id === $store->getKey(), 403);
        $disk = Storage::disk($document->disk ?: 'local');
        abort_unless($disk->exists($document->file_path), 404);

        return $disk->response($document->file_path, $document->original_file_name, ['Content-Type' => $document->mime_type]);
    }

    public function classificationMedia(Request $request, string $kind, int $id): mixed
    {
        abort_unless(in_array($kind, ['categories', 'types'], true), 404);
        $model = $kind === 'categories' ? StoreCategory::available()->findOrFail($id) : StoreType::available()->findOrFail($id);
        abort_unless($model->image && Storage::disk('local')->exists($model->image), 404);

        return Storage::disk('local')->response($model->image);
    }
}
