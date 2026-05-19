<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'nip'      => 'required|string|unique:users,nip|regex:/^\d{18}$/',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'phone'    => 'nullable|string',
        ]);

        $user = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
            'role'     => 'user',
        ]);

        return response()->json(['message' => 'Registered successfully.', 'user' => $user], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'nip'      => 'required',
            'password' => 'required',
        ]);

        $user = User::where('nip', $data['nip'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $token = $user->createToken('sesdian')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }
}