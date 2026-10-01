<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     * Enforces strict role authority (pengurus vs mahasiswa).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Autentikasi diperlukan. Silakan login terlebih dahulu.',
                'data' => null,
                'errors' => null,
            ], 401);
        }

        if (!in_array($user->role, $roles, true)) {
            $rolesList = implode(' atau ', array_map('ucfirst', $roles));
            return response()->json([
                'success' => false,
                'message' => "Akses ditolak (403 Forbidden). Fitur ini memiliki otoritas khusus untuk: {$rolesList}.",
                'data' => null,
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
