<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\BorrowingController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public
Route::get('assets/qr/{code}', [AssetController::class, 'publicQr']);

// Auth
Route::post('register', [AuthController::class, 'register']);
Route::post('login',    [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'inactivity'])->group(function (): void {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', fn(Request $request) => response()->json($request->user()));

    // User & Admin
    Route::get('assets',            [AssetController::class, 'index']);
    Route::get('borrowings',        [BorrowingController::class, 'index']);
    Route::get('borrowings/{id}',   [BorrowingController::class, 'show']);
    Route::post('borrowings/batch', [BorrowingController::class, 'batchRequest']);
    Route::get('admins',            [UserController::class, 'admins']);

    // Reports
    Route::get('reports/assets',     [AssetController::class, 'report']);
    Route::get('reports/borrowings', [BorrowingController::class, 'report']);

    // Admin only
    Route::middleware('role:admin')->group(function (): void {
        // Asset
        Route::post('assets',           [AssetController::class, 'store']);
        Route::post('assets/{asset}',   [AssetController::class, 'update']);
        Route::delete('assets/{asset}', [AssetController::class, 'destroy']);

        // Borrowing actions
        Route::post('borrowings/{id}/approve', [BorrowingController::class, 'approve']);
        Route::post('borrowings/{id}/reject',  [BorrowingController::class, 'reject']);
        Route::post('borrowings/{id}/checkin', [BorrowingController::class, 'checkin']);

        // Users
        Route::get('users',                        [UserController::class, 'index']);
        Route::get('users/{user}',                 [UserController::class, 'show']);
        Route::put('users/{user}',                 [UserController::class, 'update']);
        Route::delete('users/{user}',              [UserController::class, 'destroy']);
        Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword']);
        // Public
        Route::get('assets/qr/{code}', [AssetController::class, 'publicQr']);
        Route::get('assets/qr-room/{location}', [AssetController::class, 'publicQrRoom']); // ← tambah
                });
});