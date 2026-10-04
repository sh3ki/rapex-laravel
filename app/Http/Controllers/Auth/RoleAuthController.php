<?php

namespace App\Http\Controllers\Auth;

use App\Models\Admin;
use App\Models\Merchant;
use App\Models\RoleUser;
use App\Models\Rider;
use App\Models\Superadmin;
use App\Models\User;
use App\Mail\EmailVerificationCodeMail;
use Illuminate\Auth\Events\Verified;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleAuthController
{
    private const MODELS = [
        'customer' => User::class,
        'superadmin' => Superadmin::class,
        'admin' => Admin::class,
        'merchant' => Merchant::class,
        'rider' => Rider::class,
    ];

    public function loginPage(Request $request): Response
    {
        return Inertia::render($this->page($request, 'login'), [
            'role' => $this->role($request),
            'canResetPassword' => true,
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $role = $this->role($request);
        $throttleKey = md5('login'.implode('|', [$request->input('email'), $request->ip()]));
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            abort(429);
        }
        $credentials = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);

        if (! Auth::guard($this->guard($role))->attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey, 60);

            return back()->withErrors(['email' => 'These credentials do not match our records.'])->onlyInput('email');
        }

        $request->session()->regenerate();

        if (! $user = Auth::guard($this->guard($role))->user()) {
            return redirect()->intended($this->dashboardRoute($request));
        }

        if ($this->usesCodeVerification($role) && ! $user->hasVerifiedEmail()) {
            $this->sendEmailVerificationCode($user);
        }

        return ! $this->usesCodeVerification($role) || $user->hasVerifiedEmail()
            ? redirect()->intended($this->authenticatedRoute($request, $user))
            : redirect()->route($role === 'customer' ? 'verification.notice' : 'role.verification.notice', $role === 'customer' ? [] : ['role' => $role]);
    }

    public function googleRedirect(Request $request): RedirectResponse
    {
        $role = $this->role($request);
        abort_unless(in_array($role, ['customer', 'merchant', 'rider'], true), 404);
        abort_if(! config('services.google.client_id') || ! config('services.google.client_secret'), 503, 'Google sign-in is not configured.');

        $state = Str::random(40);
        $request->session()->put('google_oauth_state', ['value' => $state, 'role' => $role]);

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => $this->googleCallbackUrl($request),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'online',
            'state' => $state,
        ]));
    }

    public function googleCallback(Request $request): RedirectResponse
    {
        $oauthState = $request->session()->pull('google_oauth_state');
        abort_unless(is_array($oauthState) && isset($oauthState['value'], $oauthState['role']) && is_string($request->input('state')) && hash_equals($oauthState['value'], $request->input('state')), 403, 'Invalid Google sign-in state.');
        abort_unless($oauthState['role'] === $this->role($request), 403, 'Invalid Google sign-in role.');
        abort_if($request->filled('error') || ! $request->filled('code'), 422, 'Google sign-in was cancelled.');

        $token = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'code' => $request->string('code')->toString(),
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => $this->googleCallbackUrl($request),
            'grant_type' => 'authorization_code',
        ])->throw()->json();

        $profile = Http::withToken($token['access_token'] ?? '')->get('https://openidconnect.googleapis.com/v1/userinfo')->throw()->json();
        abort_unless(($profile['email_verified'] ?? false) === true && filter_var($profile['email'] ?? null, FILTER_VALIDATE_EMAIL), 422, 'Google did not provide a verified email address.');

        $role = $this->role($request);
        $model = self::MODELS[$role];
        $existingUser = collect(self::MODELS)
            ->except($role)
            ->first(fn (string $otherModel): bool => $otherModel::where('email', $profile['email'])->exists());
        if ($existingUser) {
            throw ValidationException::withMessages(['email' => 'This email address is already registered for another role.']);
        }

        $user = $model::firstOrCreate(
            ['email' => $profile['email']],
            ['name' => $profile['name'] ?? $profile['email'], 'password' => Str::random(64), 'profile_image' => $profile['picture'] ?? null, 'email_verified_at' => now(), 'is_email_verified' => true]
        );
        $user->forceFill([
            'name' => $profile['name'] ?? $user->name,
            'profile_image' => $profile['picture'] ?? $user->profile_image,
            'email_verified_at' => now(),
            'is_email_verified' => true,
        ])->save();

        Auth::guard($this->guard($role))->login($user);
        $request->session()->regenerate();

        return redirect()->intended($this->authenticatedRoute($request, $user));
    }

    public function registerPage(Request $request): Response
    {
        abort_unless(in_array($this->role($request), ['customer', 'merchant', 'rider'], true), 404);

        return Inertia::render($this->page($request, 'register'), [
            'role' => $this->role($request),
            'passwordRules' => PasswordRule::min(8)->mixedCase()->numbers()->symbols()->toPasswordRulesString(),
        ]);
    }

    public function register(Request $request): RedirectResponse
    {
        $role = $this->role($request);
        abort_unless(in_array($role, ['customer', 'merchant', 'rider'], true), 404);

        $rules = [
            'email' => ['required', 'string', 'email', 'max:255', function (string $attribute, mixed $value, \Closure $fail): void {
                if (collect(self::MODELS)->contains(fn (string $model): bool => $model::where('email', $value)->exists())) {
                    $fail('This email address is already registered.');
                }
            }],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ];

        if (in_array($role, ['customer', 'merchant', 'rider'], true)) {
            $rules['first_name'] = ['required', 'string', 'max:100'];
            $rules['middle_name'] = ['nullable', 'string', 'max:100'];
            $rules['last_name'] = ['required', 'string', 'max:100'];
        }

        if (in_array($role, ['customer', 'merchant', 'rider'], true)) {
            $rules['phone_number'] = [
                'required',
                'digits:10',
                'regex:/^9\d{9}$/',
            ];

            if ($role !== 'merchant') {
                $rules['phone_number'][] = function (string $attribute, mixed $value, \Closure $fail) use ($role): void {
                    $model = self::MODELS[$role];
                    if ($model::where('phone_number', '+63'.$value)->exists()) {
                        $fail('This mobile number is already registered.');
                    }
                };
            }
        }

        $data = $request->validate($rules);

        if (in_array($role, ['customer', 'merchant', 'rider'], true)) {
            $data['name'] = collect([$data['first_name'], $data['middle_name'] ?? null, $data['last_name']])
                ->filter()
                ->implode(' ');
        }

        if (in_array($role, ['customer', 'merchant', 'rider'], true)) {
            $data['phone_number'] = '+63'.$data['phone_number'];
        }

        if ($role === 'merchant') {
            $data['status'] = 'pending';
        }

        $model = self::MODELS[$role];
        try {
            $user = $model::create($data);
        } catch (QueryException $exception) {
            if ($role !== 'merchant' && (string) $exception->getCode() === '23000') {
                throw ValidationException::withMessages([
                    'phone_number' => 'This mobile number is already registered.',
                ]);
            }

            throw $exception;
        }
        $this->sendEmailVerificationCode($user);
        Auth::guard($this->guard($role))->login($user);
        $request->session()->regenerate();

        return redirect()->route($role === 'customer' ? 'verification.notice' : 'role.verification.notice', $role === 'customer' ? [] : ['role' => $role]);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard($this->guard($this->role($request)))->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    public function forgotPage(Request $request): Response
    {
        return Inertia::render($this->page($request, 'forgot-password'), ['role' => $this->role($request)]);
    }

    public function forgot(Request $request): RedirectResponse
    {
        $role = $this->role($request);
        $request->validate(['email' => ['required', 'email']]);
        $model = self::MODELS[$role];
        if ($user = $model::where('email', $request->input('email'))->first()) {
            $token = Password::broker($role.'s')->createToken($user);
            $user->sendPasswordResetNotification($token);
        }

        Inertia::flash('toast', ['type' => 'info', 'message' => 'If an account exists, a password reset link has been sent.']);

        return back();
    }

    public function resetPage(Request $request, string $token): Response
    {
        return Inertia::render($this->page($request, 'reset-password'), [
            'role' => $this->role($request), 'token' => $token, 'email' => $request->email,
            'passwordRules' => PasswordRule::defaults()->toPasswordRulesString(),
        ]);
    }

    public function reset(Request $request): RedirectResponse
    {
        $role = $this->role($request);
        $data = $request->validate(['token' => ['required'], 'email' => ['required', 'email'], 'password' => ['required', 'confirmed', PasswordRule::defaults()]]);
        $status = Password::broker($role.'s')->reset($data, function ($user) use ($data) {
            $user->forceFill(['password' => Hash::make($data['password']), 'remember_token' => null])->save();
        });

        if ($status !== Password::PASSWORD_RESET) {
            return back()->withErrors(['email' => __($status)]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __($status)]);

        return redirect()->route($role === 'customer' ? 'login' : 'role.login', $role === 'customer' ? [] : ['role' => $role]);
    }

    public function verificationNotice(Request $request): Response|RedirectResponse
    {
        if (Auth::guard($this->guard($this->role($request)))->user()?->hasVerifiedEmail()) {
            return redirect()->to($this->authenticatedRoute($request, Auth::guard($this->guard($this->role($request)))->user()));
        }

        return Inertia::render($this->page($request, 'verify-email'), [
            'email' => Auth::guard($this->guard($this->role($request)))->user()?->email,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function verifyCode(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'digits:6']]);
        $user = Auth::guard($this->guard($this->role($request)))->user();

        abort_unless($user, 401);

        if (! $user->email_verification_code_hash || ! $user->email_verification_expires_at || now()->greaterThan($user->email_verification_expires_at)) {
            return back()->withErrors(['code' => 'This verification code has expired. Please request a new code.']);
        }

        if (! Hash::check($request->string('code')->toString(), $user->email_verification_code_hash)) {
            return back()->withErrors(['code' => 'The verification code is incorrect.']);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return redirect()->to($this->authenticatedRoute($request, $user));
    }

    public function sendVerification(Request $request): RedirectResponse
    {
        $role = $this->role($request);
        $user = Auth::guard($this->guard($this->role($request)))->user();
        if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            if ($this->usesCodeVerification($role)) {
                $this->sendEmailVerificationCode($user);
            } else {
                $user->sendEmailVerificationNotification();
            }
        } elseif ($user?->hasVerifiedEmail()) {
            return redirect()->to($this->authenticatedRoute($request, $user));
        }

        Inertia::flash('toast', ['type' => 'info', 'message' => 'A new verification code has been sent.']);

        return back();
    }

    private function sendEmailVerificationCode(RoleUser $user): void
    {
        $code = (string) random_int(100000, 999999);
        $user->forceFill([
            'is_email_verified' => false,
            'email_verification_code_hash' => Hash::make($code),
            'email_verification_expires_at' => now()->addMinutes(15),
        ])->save();

        Mail::to($user->email)->send(new EmailVerificationCodeMail($code));
    }

    private function usesCodeVerification(string $role): bool
    {
        return in_array($role, ['customer', 'merchant', 'rider'], true);
    }

    public function verify(Request $request): RedirectResponse
    {
        $user = Auth::guard($this->guard($this->role($request)))->user();
        abort_unless($user && (string) $request->route('id') === (string) $user->getKey() && hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification())), 403);

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect()->to($this->authenticatedRoute($request, $user).'?verified=1');
    }

    private function role(Request $request): string
    {
        $role = (string) ($request->route('role') ?: str($request->getHost())->before('.localhost')->toString() ?: 'customer');

        return $role === 'localhost' ? 'customer' : $role;
    }

    private function guard(string $role): string
    {
        return $role === 'customer' ? 'web' : $role;
    }

    private function page(Request $request, string $page): string
    {
        return $this->role($request).'/auth/'.$page;
    }

    private function dashboardName(Request $request): string
    {
        return $this->role($request) === 'customer' ? 'dashboard' : 'role.dashboard';
    }

    private function dashboardRoute(Request $request): string
    {
        return $this->role($request) === 'customer'
            ? route('dashboard')
            : route('role.dashboard', ['role' => $this->role($request)]);
    }

    private function authenticatedRoute(Request $request, ?RoleUser $user): string
    {
        if ($this->role($request) !== 'merchant' || ! $user instanceof Merchant) {
            return $this->dashboardRoute($request);
        }

        if (! $user->onboarding_admin_verified || in_array($user->onboardingApplication?->status, [null, 'pending', 'rejected'], true)) {
            return url('/onboarding');
        }

        return $this->dashboardRoute($request);
    }

    private function googleCallbackUrl(Request $request): string
    {
        return route($this->role($request) === 'customer' ? 'google.callback' : 'role.google.callback', $this->role($request) === 'customer' ? [] : ['role' => $this->role($request)]);
    }
}
