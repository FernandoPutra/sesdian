<?php

namespace App\Http\Controllers;

use App\Http\Resources\AssetResource;
use App\Models\AuditTrail;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $q = Asset::visible();

        if ($request->ownership) {
            $q->where('ownership', $request->ownership);
        }
        if ($request->category) {
            $q->where('category', $request->category);
        }
        if ($request->location) {
            $q->where('location', $request->location);
        }
        if ($request->status) {
            $q->where('status', $request->status);
        }
        if ($request->search) {
            $q->where(function ($sub) use ($request) {
                $sub->where('name', 'like', "%{$request->search}%")
                    ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        return AssetResource::collection($q->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code'             => 'required|unique:assets,code',
            'name'             => 'required|string',
            'type'             => 'required|in:consumable,fixed',
            'status'           => 'required|in:available,repair',
            'description'      => 'nullable|string',
            'stock'            => 'required_if:type,consumable|integer|min:1',
            'location'         => 'nullable|string',
            'category'         => 'nullable|string',
            'brand'            => 'nullable|string',
            'acquisition_year' => 'nullable|integer|min:1990|max:2030',
            'condition'        => 'nullable|in:baik,rusak_ringan,rusak_berat',
            'ownership'        => 'required|in:BMN,Non-BMN',
            'photo'            => 'nullable|image|max:5120',
        ]);

        // Handle photo
        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('assets', 'public');
        }

        // Generate QR code URL
        $qrUrl = url("/qr/{$data['code']}");
        $data['qr_code'] = $qrUrl;

        $asset = Asset::create($data);

        AuditTrail::log(
            $request->user()->id, 'create_asset', 'Asset',
            $asset->id, null, $asset->toArray(), $request->ip()
        );

        return response()->json(new AssetResource($asset), 201);
    }

    public function update(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'name'             => 'sometimes|string',
            'status'           => 'sometimes|in:available,borrowed,repair,reserved',
            'description'      => 'sometimes|nullable|string',
            'stock'            => 'sometimes|integer|min:0',
            'location'         => 'sometimes|nullable|string',
            'category'         => 'sometimes|nullable|string',
            'brand'            => 'sometimes|nullable|string',
            'acquisition_year' => 'sometimes|nullable|integer',
            'condition'        => 'sometimes|in:baik,rusak_ringan,rusak_berat',
            'ownership'        => 'sometimes|in:BMN,Non-BMN',
            'photo'            => 'sometimes|nullable|image|max:5120',
        ]);

        if ($request->hasFile('photo')) {
            if ($asset->photo) Storage::disk('public')->delete($asset->photo);
            $data['photo'] = $request->file('photo')->store('assets', 'public');
        }

        $old = $asset->toArray();
        $asset->update($data);

        AuditTrail::log(
            $request->user()->id, 'update_asset', 'Asset',
            $asset->id, $old, $asset->fresh()->toArray(), $request->ip()
        );

        return response()->json(new AssetResource($asset->fresh()));
    }

    public function destroy(Request $request, Asset $asset)
    {
        if ($asset->photo) Storage::disk('public')->delete($asset->photo);

        AuditTrail::log(
            $request->user()->id, 'delete_asset', 'Asset',
            $asset->id, $asset->toArray(), null, $request->ip()
        );

        $asset->delete();
        return response()->json(['message' => 'Asset deleted.']);
    }

    public function publicQr($code)
    {
        $asset = Asset::visible()->where('code', $code)->firstOrFail();
        return response()->json(new AssetResource($asset));
    }

public function publicQrRoom($location)
{
    $assets = Asset::visible()
        ->where('location', $location)
        ->get();

    if ($assets->isEmpty()) {
        return response()->json(['message' => 'Tidak ada aset di ruangan ini.'], 404);
    }

    return response()->json(AssetResource::collection($assets));
}

    // GET /api/reports/assets?period=monthly&month=2024-05&ownership=BMN
    public function report(Request $request)
    {
        $q = Asset::with(['borrowings' => fn($b) => $b->with('user')]);
        if ($request->ownership) $q->where('ownership', $request->ownership);

        $assets = $q->get();

        $totalStock     = $assets->sum('stock');
        $borrowedQty    = $assets->sum(fn($a) =>
            $a->borrowings->whereIn('status', ['pending','approved','borrowed'])->sum('quantity')
        );

        return response()->json([
            'total'           => $assets->count(),
            'bmn'             => $assets->where('ownership','BMN')->count(),
            'non_bmn'         => $assets->where('ownership','Non-BMN')->count(),
            'available'       => $assets->where('status','available')->count(),
            'borrowed'        => $assets->whereIn('status',['borrowed','reserved'])->count(),
            'repair'          => $assets->where('status','repair')->count(),
            'total_stock'     => $totalStock,
            'stock_borrowed'  => $borrowedQty,
            'stock_available' => max(0, $totalStock - $borrowedQty),
            'assets'          => AssetResource::collection($assets),
        ]);
    }
}