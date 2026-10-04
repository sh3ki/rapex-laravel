<?php

namespace App\Http\Controllers;

use App\Models\StoreCategory;
use App\Models\StoreType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StoreClassificationController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeReviewer($request);

        return Inertia::render('admin/store-classification', [
            'categories' => StoreCategory::withTrashed()->withCount('types')->orderBy('sort_order')->orderBy('name')->get()->map(fn (StoreCategory $category): array => $this->categoryData($category)),
            'types' => StoreType::withTrashed()->with('category:id,name')->orderBy('store_category_id')->orderBy('sort_order')->orderBy('name')->get()->map(fn (StoreType $type): array => $this->typeData($type)),
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $data = $request->validate(['name' => ['required', 'string', 'max:255', 'unique:store_categories,name']]);
        StoreCategory::create(['name' => $data['name'], 'slug' => Str::slug($data['name']), 'sort_order' => (int) StoreCategory::withTrashed()->max('sort_order') + 1, 'status' => 'active', 'created_by' => $request->user()->getKey(), 'updated_by' => $request->user()->getKey()]);

        return $this->success('Store category created.');
    }

    public function updateCategory(Request $request, string $role, StoreCategory $category): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $data = $request->validate(['name' => ['required', 'string', 'max:255', Rule::unique('store_categories', 'name')->ignore($category->id)]]);
        $category->forceFill(['name' => $data['name'], 'slug' => Str::slug($data['name']), 'updated_by' => $request->user()->getKey()])->save();

        return $this->success('Store category updated.');
    }

    public function deleteCategory(Request $request, string $role, StoreCategory $category): RedirectResponse
    {
        $this->authorizeReviewer($request);
        if ($category->types()->withTrashed()->exists()) {
            return back()->withErrors(['category' => 'This category cannot be deleted because it has store types.']);
        }
        $category->forceFill(['status_changed_by' => $request->user()->getKey()])->save();
        $category->delete();

        return $this->success('Store category deleted.');
    }

    public function restoreCategory(Request $request, string $role, int $category): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $record = StoreCategory::withTrashed()->findOrFail($category);
        $record->restore();
        $record->forceFill(['status' => 'active', 'status_changed_by' => $request->user()->getKey(), 'updated_by' => $request->user()->getKey()])->save();

        return $this->success('Store category restored.');
    }

    public function storeType(Request $request): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $data = $request->validate(['name' => ['required', 'string', 'max:255', 'unique:store_types,name'], 'store_category_id' => ['required', 'integer', Rule::exists('store_categories', 'id')->whereNull('deleted_at')]]);
        StoreType::create(['name' => $data['name'], 'slug' => Str::slug($data['name']), 'store_category_id' => $data['store_category_id'], 'sort_order' => (int) StoreType::where('store_category_id', $data['store_category_id'])->withTrashed()->max('sort_order') + 1, 'status' => 'active', 'created_by' => $request->user()->getKey(), 'updated_by' => $request->user()->getKey()]);

        return $this->success('Store type created.');
    }

    public function updateType(Request $request, string $role, StoreType $type): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $data = $request->validate(['name' => ['required', 'string', 'max:255', Rule::unique('store_types', 'name')->ignore($type->id)], 'store_category_id' => ['required', 'integer', Rule::exists('store_categories', 'id')->whereNull('deleted_at')]]);
        $type->forceFill(['name' => $data['name'], 'slug' => Str::slug($data['name']), 'store_category_id' => $data['store_category_id'], 'updated_by' => $request->user()->getKey()])->save();

        return $this->success('Store type updated.');
    }

    public function deleteType(Request $request, string $role, StoreType $type): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $type->forceFill(['status_changed_by' => $request->user()->getKey()])->save();
        $type->delete();

        return $this->success('Store type deleted.');
    }

    public function restoreType(Request $request, string $role, int $type): RedirectResponse
    {
        $this->authorizeReviewer($request);
        $record = StoreType::withTrashed()->findOrFail($type);
        $record->restore();
        $record->forceFill(['status' => 'active', 'status_changed_by' => $request->user()->getKey(), 'updated_by' => $request->user()->getKey()])->save();

        return $this->success('Store type restored.');
    }

    private function categoryData(StoreCategory $category): array
    {
        return ['id' => $category->id, 'name' => $category->name, 'types_count' => $category->types_count, 'status' => $category->trashed() ? 'deleted' : $category->status, 'created_at' => $category->created_at?->toISOString(), 'updated_at' => $category->updated_at?->toISOString(), 'deleted_at' => $category->deleted_at?->toISOString(), 'created_by' => $category->created_by, 'updated_by' => $category->updated_by, 'status_changed_by' => $category->status_changed_by];
    }

    private function typeData(StoreType $type): array
    {
        return ['id' => $type->id, 'name' => $type->name, 'store_category_id' => $type->store_category_id, 'category_name' => $type->category?->name, 'status' => $type->trashed() ? 'deleted' : $type->status, 'created_at' => $type->created_at?->toISOString(), 'updated_at' => $type->updated_at?->toISOString(), 'deleted_at' => $type->deleted_at?->toISOString(), 'created_by' => $type->created_by, 'updated_by' => $type->updated_by, 'status_changed_by' => $type->status_changed_by];
    }

    private function authorizeReviewer(Request $request): void
    {
        abort_unless(in_array((string) ($request->route('role') ?: str($request->getHost())->before('.localhost')->toString()), ['admin', 'superadmin'], true), 403);
    }

    private function success(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
