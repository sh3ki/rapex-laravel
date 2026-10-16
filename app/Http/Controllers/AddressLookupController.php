<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressLookupController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $level = (string) $request->query('level');
        $query = trim((string) $request->query('q', ''));
        $limit = min(max((int) $request->query('limit', 25), 1), 50);

        $results = match ($level) {
            'region' => DB::table('philippine_regions')->select('id', 'name')->when($query !== '', fn ($builder) => $builder->where('name', 'like', "%{$query}%"))->orderBy('name')->limit($limit)->get()->map(fn ($row): array => ['id' => $row->id, 'name' => $row->name])->values(),
            'province' => DB::table('philippine_provinces')->select('id', 'name')->where('region_id', (int) $request->query('parent_id'))->when($query !== '', fn ($builder) => $builder->where('name', 'like', "%{$query}%"))->orderBy('name')->limit($limit)->get()->map(fn ($row): array => ['id' => $row->id, 'name' => $row->name])->values(),
            'locality' => $this->localities((int) $request->query('parent_id'), $query, $limit),
            'barangay' => $this->barangays((string) $request->query('parent_type'), (int) $request->query('parent_id'), $query, $limit),
            default => collect(),
        };

        return response()->json(['data' => $results]);
    }

    private function localities(int $provinceId, string $query, int $limit): array
    {
        $cities = DB::table('philippine_cities')->select('id', 'name')->where('province_id', $provinceId)->when($query !== '', fn ($builder) => $builder->where('name', 'like', "%{$query}%"))->get()->map(fn ($row): array => ['id' => $row->id, 'name' => $row->name, 'kind' => 'city'])->all();
        $municipalities = DB::table('philippine_municipalities')->select('id', 'name')->where('province_id', $provinceId)->when($query !== '', fn ($builder) => $builder->where('name', 'like', "%{$query}%"))->get()->map(fn ($row): array => ['id' => $row->id, 'name' => $row->name, 'kind' => 'municipality'])->all();

        return collect([...$cities, ...$municipalities])->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)->take($limit)->values()->all();
    }

    private function barangays(string $parentType, int $parentId, string $query, int $limit): array
    {
        $column = $parentType === 'municipality' ? 'municipality_id' : 'city_id';

        return DB::table('philippine_barangays')->select('id', 'name', 'zip_code')->where($column, $parentId)->when($query !== '', fn ($builder) => $builder->where('name', 'like', "%{$query}%"))->orderBy('name')->limit($limit)->get()->map(fn ($row): array => ['id' => $row->id, 'name' => $row->name, 'zip_code' => $row->zip_code])->values()->all();
    }
}
