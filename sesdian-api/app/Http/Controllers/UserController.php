<?php

namespace App\Http\Controllers;

use App\Models\AuditTrail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->when($request->search, fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('nip', 'like', "%{$request->search}%")
            )
            ->when($request->role, fn($q) => $q->where('role', $request->role))
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    public function admins()
    {
        $admins = User::where('role', 'admin')
            ->whereNotNull('phone')
            ->select('id', 'name', 'phone')
            ->get();

        return response()->json($admins);
    }

    public function show(User $user)
    {
        return response()->json($user->load('borrowings.asset'));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'role'  => 'sometimes|in:user,admin',
            'phone' => 'sometimes|nullable|string|max:20',
        ]);

        $old = $user->toArray();
        $user->update($data);

        AuditTrail::log(
            $request->user()->id,
            'update_user',
            'User',
            $user->id,
            $old,
            $user->fresh()->toArray(),
            $request->ip()
        );

        return response()->json(['message' => 'User updated.', 'data' => $user->fresh()]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }

        AuditTrail::log(
            $request->user()->id,
            'delete_user',
            'User',
            $user->id,
            $user->toArray(),
            null,
            $request->ip()
        );

        $user->delete();
        return response()->json(['message' => 'User deleted.']);
    }

    public function resetPassword(Request $request, User $user)
    {
        $request->validate(['password' => 'required|min:8|confirmed']);

        $user->update(['password' => Hash::make($request->password)]);

        AuditTrail::log(
            $request->user()->id,
            'reset_password',
            'User',
            $user->id,
            null,
            null,
            $request->ip()
        );

        return response()->json(['message' => 'Password berhasil direset.']);
    }
}