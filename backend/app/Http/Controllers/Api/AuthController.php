<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Single Gateway Login:
     * Handles both Pengurus (Admin) and Mahasiswa via one single pipeline.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        $user = User::where('username', $credentials['username'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Username atau password salah.',
                'data' => null,
                'errors' => null,
            ], 401);
        }

        // Create Sanctum Bearer Token
        $token = $user->createToken('siperpu-auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'nim' => $user->nim,
                ],
            ],
            'errors' => null,
        ]);
    }

    /**
     * Student Registration:
     * Role is strictly locked to 'mahasiswa' (ROLE-GUARD mass assignment protection).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        // ROLE-GUARD: Role is hardcoded to 'mahasiswa'
        $user = User::create([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $data['username'].'@perpustakaan.ac.id',
            'nim' => $data['nim'],
            'password' => $data['password'],
            'role' => 'mahasiswa',
        ]);

        $token = $user->createToken('siperpu-auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi mahasiswa berhasil.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'nim' => $user->nim,
                ],
            ],
            'errors' => null,
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar',
            'data' => null,
            'errors' => null,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Data sesi pengguna.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'nim' => $user->nim,
                ],
            ],
            'errors' => null,
        ]);
    }
}
