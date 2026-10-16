<?php

use App\Http\Controllers\Auth\RoleAuthController;
use App\Http\Controllers\MerchantOnboardingController;
use App\Http\Controllers\StoreClassificationController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\AddressLookupController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

$registerRoleRoutes = function (): void {
    Route::get('login', [RoleAuthController::class, 'loginPage'])->name('login');
    Route::post('login', [RoleAuthController::class, 'login'])->name('login.store');
    Route::get('auth/google', [RoleAuthController::class, 'googleRedirect'])->name('google.redirect');
    Route::get('auth/google/callback', [RoleAuthController::class, 'googleCallback'])->name('google.callback');
    Route::get('register', [RoleAuthController::class, 'registerPage'])->name('register');
    Route::post('register', [RoleAuthController::class, 'register'])->name('register.store');
    Route::get('forgot-password', [RoleAuthController::class, 'forgotPage'])->name('password.request');
    Route::post('forgot-password', [RoleAuthController::class, 'forgot'])->name('password.email');
    Route::get('reset-password/{token}', [RoleAuthController::class, 'resetPage'])->name('password.reset');
    Route::post('reset-password', [RoleAuthController::class, 'reset'])->name('password.update');
    Route::get('email/verify', [RoleAuthController::class, 'verificationNotice'])->middleware('role')->name('verification.notice');
    Route::post('email/verify-code', [RoleAuthController::class, 'verifyCode'])->middleware('role')->name('verification.code');
    Route::post('email/verification-notification', [RoleAuthController::class, 'sendVerification'])->middleware('role')->name('verification.send');
    Route::get('email/verify/{id}/{hash}', [RoleAuthController::class, 'verify'])->middleware(['role', 'signed'])->name('verification.verify');
    Route::post('logout', [RoleAuthController::class, 'logout'])->middleware('role')->name('logout');

    Route::middleware(['role'])->group(function () {
        Route::get('address-options', AddressLookupController::class)->name('address.options');
        Route::get('dashboard', function () {
            $role = (string) (request()->route('role') ?: 'customer');
            $user = auth($role === 'customer' ? 'web' : $role)->user();

            return Inertia\Inertia::render($role.'/dashboard', [
                'merchantOnboardingStatus' => $role === 'merchant' ? $user?->onboardingApplication?->status : null,
                'merchantRejectionReason' => $role === 'merchant' ? $user?->onboardingApplication?->rejection_reason : null,
            ]);
        })->name('dashboard');
    });
};

Route::domain('customer.localhost')->group($registerRoleRoutes);

Route::domain('{role}.localhost')->whereIn('role', ['superadmin', 'admin', 'merchant', 'rider'])
    ->name('role.')
    ->group($registerRoleRoutes);

Route::domain('{role}.localhost')->whereIn('role', ['admin', 'superadmin', 'merchant'])
    ->middleware(['role'])
    ->group(function (): void {
        Route::get('onboarding', [MerchantOnboardingController::class, 'show'])->name('merchant.onboarding');
        Route::post('onboarding', [MerchantOnboardingController::class, 'submit'])->name('merchant.onboarding.submit');
        Route::get('merchant-management/applications', [MerchantOnboardingController::class, 'applications'])->name('merchant.applications');
        Route::patch('merchant-management/applications/{application}', [MerchantOnboardingController::class, 'review'])->name('merchant.applications.review');
        Route::patch('merchant-management/profile-edit-requests/{editRequest}', [MerchantOnboardingController::class, 'reviewEditRequest'])->name('merchant.profile-edit-requests.review');
        Route::get('merchant-management/profile-edit-requests/{editRequest}/media/{side}', [MerchantOnboardingController::class, 'editRequestMedia'])->name('merchant.profile-edit-requests.media');
        Route::get('merchant-management/applications/{application}/media/{field}', [MerchantOnboardingController::class, 'applicationMedia'])->name('merchant.applications.media');
        Route::get('merchant-management/accounts', [MerchantOnboardingController::class, 'accounts'])->name('merchant.accounts');
        Route::get('merchant-management/accounts/{merchant}/media/profile', [MerchantOnboardingController::class, 'profileMedia'])->name('merchant.accounts.media.profile');
        Route::patch('merchant-management/accounts/{merchant}', [MerchantOnboardingController::class, 'updateAccount'])->name('merchant.accounts.update');
        Route::patch('merchant-management/accounts/{merchant}/password', [MerchantOnboardingController::class, 'changePassword'])->name('merchant.accounts.password');
        Route::delete('merchant-management/accounts/{merchant}', [MerchantOnboardingController::class, 'deleteAccount'])->name('merchant.accounts.delete');
        Route::get('store-management/applications', [StoreController::class, 'applications'])->name('store.applications');
        Route::patch('store-management/applications/{store}', [StoreController::class, 'review'])->name('store.applications.review');
        Route::get('store-management/applications/{store}/media/{field}', [StoreController::class, 'applicationMedia'])->name('store.applications.media');
        Route::get('store-management/applications/{store}/documents/{document}/media', [StoreController::class, 'applicationDocumentMedia'])->name('store.applications.documents.media');
        Route::get('store-management/classification', [StoreClassificationController::class, 'index'])->name('store.classification');
        Route::get('store-management/classification/categories/{category}/media', [StoreClassificationController::class, 'categoryMedia'])->name('store.categories.media');
        Route::post('store-management/classification/categories', [StoreClassificationController::class, 'storeCategory'])->name('store.categories.store');
        Route::patch('store-management/classification/categories/{category}', [StoreClassificationController::class, 'updateCategory'])->name('store.categories.update');
        Route::delete('store-management/classification/categories/{category}', [StoreClassificationController::class, 'deleteCategory'])->name('store.categories.delete');
        Route::post('store-management/classification/categories/{category}/restore', [StoreClassificationController::class, 'restoreCategory'])->name('store.categories.restore');
        Route::post('store-management/classification/types', [StoreClassificationController::class, 'storeType'])->name('store.types.store');
        Route::get('store-management/classification/types/{type}/media', [StoreClassificationController::class, 'typeMedia'])->name('store.types.media');
        Route::patch('store-management/classification/types/{type}', [StoreClassificationController::class, 'updateType'])->name('store.types.update');
        Route::delete('store-management/classification/types/{type}', [StoreClassificationController::class, 'deleteType'])->name('store.types.delete');
        Route::post('store-management/classification/types/{type}/restore', [StoreClassificationController::class, 'restoreType'])->name('store.types.restore');
    });

Route::domain('merchant.localhost')
    ->middleware(['auth:merchant'])
    ->group(function (): void {
        Route::get('store-management/stores', [StoreController::class, 'index'])->name('merchant.stores');
        Route::get('store-management/stores/create', [StoreController::class, 'create'])->name('merchant.stores.create');
        Route::post('store-management/stores', [StoreController::class, 'store'])->name('merchant.stores.store');
        Route::get('store-management/stores/{store}', [StoreController::class, 'show'])->name('merchant.stores.show');
        Route::get('store-management/stores/classification/{kind}/{id}/media', [StoreController::class, 'classificationMedia'])->name('merchant.stores.classification.media');
        Route::get('store-management/stores/{store}/media/{field}', [StoreController::class, 'media'])->name('merchant.stores.media');
        Route::get('store-management/stores/{store}/documents/{document}/media', [StoreController::class, 'documentMedia'])->name('merchant.stores.documents.media');
        Route::get('onboarding/media/{field}', [MerchantOnboardingController::class, 'media'])->name('merchant.onboarding.media');
    });

require __DIR__.'/settings.php';
