<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTrustedReseller
{
    /**
     * Ensure the user is a trusted reseller (for tempo payment).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isTrustedReseller()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya reseller terpercaya yang dapat menggunakan fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}
