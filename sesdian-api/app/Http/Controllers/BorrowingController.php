<?php

namespace App\Http\Controllers;

use App\Http\Resources\BorrowingResource;
use App\Models\Asset;
use App\Models\AuditTrail;
use App\Models\Borrowing;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BorrowingController extends Controller
{
    public function __construct(private WhatsAppService $wa) {}

    public function index(Request $request)
    {
        $q = Borrowing::with(['asset', 'user']);

        if ($request->user()->role !== 'admin') {
            $q->where('user_id', $request->user()->id);
        }

        if ($request->status) $q->where('status', $request->status);
        if ($request->month) {
            $q->whereYear('created_at',  substr($request->month, 0, 4))
              ->whereMonth('created_at', substr($request->month, 5, 2));
        }

        return BorrowingResource::collection($q->latest()->paginate(50));
    }

    public function show($id)
    {
        $borrowing = Borrowing::with(['user', 'asset', 'approvedBy', 'waLogs'])->findOrFail($id);

        if (request()->user()->role !== 'admin'
            && $borrowing->user_id !== request()->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(new BorrowingResource($borrowing));
    }

    public function batchRequest(Request $request)
    {
        $data = $request->validate([
            'asset_ids'    => 'required|array|min:1',
            'asset_ids.*'  => 'exists:assets,id',
            'quantities'   => 'nullable|array',
            'quantities.*' => 'integer|min:1',
            'return_due'   => 'required|date|after:today',
            'notes'        => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $borrowings = [];

            foreach ($data['asset_ids'] as $index => $assetId) {
                $asset    = Asset::findOrFail($assetId);
                $quantity = $data['quantities'][$index] ?? 1;

                if (!$asset->isAvailable()) {
                    DB::rollBack();
                    return response()->json(['message' => "Aset {$asset->name} tidak tersedia."], 422);
                }

                if ($asset->stock < $quantity) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Stok {$asset->name} tidak mencukupi. Tersisa: {$asset->stock} unit."
                    ], 422);
                }

                // Kurangi stok
                $newStock = $asset->stock - $quantity;
                $asset->update([
                    'stock'  => $newStock,
                    'status' => $newStock <= 0 ? 'borrowed' : 'available',
                ]);

                $b = Borrowing::create([
                    'user_id'          => $request->user()->id,
                    'asset_id'         => $assetId,
                    'quantity'         => $quantity,
                    'return_due'       => $data['return_due'],
                    'notes'            => $data['notes'] ?? null,
                    'status'           => Borrowing::STATUS_PENDING,
                    'requested_at'     => now(),
                    'condition_before' => $asset->condition,
                ]);

                $borrowings[] = $b;
                AuditTrail::log(
                    $request->user()->id, 'borrow_request', 'Borrowing',
                    $b->id, null, $b->toArray(), $request->ip()
                );
            }

            DB::commit();
            return response()->json(['message' => 'Borrow request submitted.', 'data' => $borrowings], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function approve(Request $request, $id)
    {
        $borrowing = Borrowing::with(['user', 'asset'])->findOrFail($id);
        $old       = $borrowing->toArray();
        $qty       = $borrowing->quantity ?? 1;

        $borrowing->update([
            'status'      => Borrowing::STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        // Tandai reserved jika stok habis
        if ($borrowing->asset->stock <= 0) {
            $borrowing->asset->update(['status' => 'reserved']);
        }

        $this->wa->send(
            $borrowing->user->phone,
            "✅ *SESDIAN* - Peminjaman *{$borrowing->asset->name}* (x{$qty}) Anda telah *DISETUJUI*.\n📅 Harap dikembalikan sebelum: {$borrowing->return_due}\n\nSilakan ambil barang ke petugas.",
            $borrowing->id, 'approval'
        );

        AuditTrail::log(
            $request->user()->id, 'approve_borrowing', 'Borrowing',
            $borrowing->id, $old, $borrowing->fresh()->toArray(), $request->ip()
        );

        return response()->json([
            'message' => 'Approved.',
            'data'    => new BorrowingResource($borrowing->load('user', 'asset'))
        ]);
    }

    public function reject(Request $request, $id)
    {
        $data = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $borrowing = Borrowing::with(['user', 'asset'])->findOrFail($id);
        $old       = $borrowing->toArray();
        $qty       = $borrowing->quantity ?? 1;

        $borrowing->update([
            'status'           => Borrowing::STATUS_REJECTED,
            'rejection_reason' => $data['rejection_reason'],
        ]);

        // Kembalikan stok yang sudah dikurangi saat request
        $newStock = $borrowing->asset->stock + $qty;
        $borrowing->asset->update([
            'stock'  => $newStock,
            'status' => 'available',
        ]);

        $this->wa->send(
            $borrowing->user->phone,
            "❌ *SESDIAN* - Peminjaman *{$borrowing->asset->name}* Anda *DITOLAK*.\n\n📝 *Alasan:* {$data['rejection_reason']}\n\nHubungi admin untuk info lebih lanjut.",
            $borrowing->id, 'approval'
        );

        AuditTrail::log(
            $request->user()->id, 'reject_borrowing', 'Borrowing',
            $borrowing->id, $old, $borrowing->fresh()->toArray(), $request->ip()
        );

        return response()->json([
            'message' => 'Rejected.',
            'data'    => new BorrowingResource($borrowing->load('user', 'asset'))
        ]);
    }

    public function checkin(Request $request, $id)
    {
        $data = $request->validate([
            'condition_after' => 'nullable|in:baik,rusak_ringan,rusak_berat',
        ]);

        $borrowing = Borrowing::with(['user', 'asset'])->findOrFail($id);
        $old       = $borrowing->toArray();
        $qty       = $borrowing->quantity ?? 1;

        $borrowing->update([
            'status'          => Borrowing::STATUS_RETURNED,
            'returned_at'     => now(),
            'condition_after' => $data['condition_after'] ?? $borrowing->asset->condition,
        ]);

        // Kembalikan stok
        $newStock = $borrowing->asset->stock + $qty;
        $borrowing->asset->update([
            'stock'     => $newStock,
            'status'    => 'available',
            'condition' => $data['condition_after'] ?? $borrowing->asset->condition,
        ]);

        $this->wa->send(
            $borrowing->user->phone,
            "📦 *SESDIAN* - Aset *{$borrowing->asset->name}* (x{$qty}) telah berhasil dikembalikan.\n✅ Terima kasih telah menjaga aset dengan baik!",
            $borrowing->id, 'returned'
        );

        AuditTrail::log(
            $request->user()->id, 'checkin', 'Borrowing',
            $borrowing->id, $old, $borrowing->fresh()->toArray(), $request->ip()
        );

        return response()->json([
            'message' => 'Check-in recorded.',
            'data'    => new BorrowingResource($borrowing->load('user', 'asset'))
        ]);
    }

    public function report(Request $request)
    {
        $q = Borrowing::with(['user', 'asset']);

        if ($request->month) {
            $q->whereYear('created_at',  substr($request->month, 0, 4))
              ->whereMonth('created_at', substr($request->month, 5, 2));
        }
        if ($request->status) $q->where('status', $request->status);

        $list = $q->get();

        return response()->json([
            'total_transactions' => $list->count(),
            'total_pending'      => $list->where('status', 'pending')->count(),
            'total_approved'     => $list->where('status', 'approved')->count(),
            'total_returned'     => $list->where('status', 'returned')->count(),
            'total_rejected'     => $list->where('status', 'rejected')->count(),
            'data'               => BorrowingResource::collection($list),
        ]);
    }
}