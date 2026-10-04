<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = (string) ($request->route('role') ?: str($request->getHost())->before('.localhost')->toString() ?: 'customer');
        $role = $role === 'localhost' ? 'customer' : $role;
        if (! in_array($role, ['superadmin', 'admin', 'merchant', 'rider', 'customer'], true)) {
            abort(403);
        }
        if (! auth($role === 'customer' ? 'web' : $role)->check()) {
            return redirect()->route($role === 'customer' ? 'login' : 'role.login', $role === 'customer' ? [] : ['role' => $role]);
        }

        $guard = $role === 'customer' ? 'web' : $role;
        $request->setUserResolver(fn (?string $requestedGuard = null) => auth($requestedGuard ?: $guard)->user());

        return $next($request);
    }
}
