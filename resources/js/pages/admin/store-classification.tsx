import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import FilterModal from '@/components/filter-modal';
import { ImageUpload } from '@/components/image-upload';
import Pagination from '@/components/pagination';
import SearchBar from '@/components/search-bar';
import StatusTabs, { type StatusTab } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatAdminDateTime } from '@/lib/date-format';

type Category = { id: number; name: string; description?: string | null; image_url?: string | null; types_count: number; status: string; created_at?: string | null; updated_at?: string | null; deleted_at?: string | null };
type StoreType = { id: number; name: string; image_url?: string | null; store_category_id: number; category_name?: string | null; status: string; created_at?: string | null; updated_at?: string | null; deleted_at?: string | null };
type Props = { categories: Category[]; types: StoreType[] };
type Tab = 'categories' | 'types';

const date = (value?: string | null) => value ? <div><div>{formatAdminDateTime(value).date}</div><div className="text-muted-foreground text-xs">{formatAdminDateTime(value).time}</div></div> : '—';
const statusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        deleted: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };
    return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${colors[status] ?? 'bg-muted text-muted-foreground'}`}>{statusLabel(status)}</span>;
}

export default function StoreClassification({ categories, types }: Props) {
    const [tab, setTab] = useState<Tab>('categories');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number[]>([]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingType, setEditingType] = useState<StoreType | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formImage, setFormImage] = useState<File | null>(null);
    const [formImagePreview, setFormImagePreview] = useState('');

    const tabs: StatusTab[] = [
        { value: 'categories', label: 'Categories', count: categories.filter((item) => item.status !== 'deleted').length },
        { value: 'types', label: 'Store Types', count: types.filter((item) => item.status !== 'deleted').length },
    ];
    const filteredCategories = useMemo(() => categories.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [categories, search]);
    const filteredTypes = useMemo(() => types.filter((item) => (selectedCategoryId.length === 0 || selectedCategoryId.includes(item.store_category_id)) && `${item.name} ${item.category_name ?? ''}`.toLowerCase().includes(search.toLowerCase())), [types, search, selectedCategoryId]);
    const rows = tab === 'categories' ? filteredCategories : filteredTypes;
    const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

    const openCreate = () => { setEditingCategory(null); setEditingType(null); setFormName(''); setFormDescription(''); setFormCategory(categories.find((item) => item.status !== 'deleted')?.id.toString() ?? ''); setFormImage(null); setFormImagePreview(''); setFormOpen(true); };
    const openEditCategory = (item: Category) => { setEditingCategory(item); setEditingType(null); setFormName(item.name); setFormDescription(item.description ?? ''); setFormCategory(''); setFormImage(null); setFormImagePreview(item.image_url ?? ''); setFormOpen(true); };
    const openEditType = (item: StoreType) => { setEditingType(item); setEditingCategory(null); setFormName(item.name); setFormDescription(''); setFormCategory(String(item.store_category_id)); setFormImage(null); setFormImagePreview(item.image_url ?? ''); setFormOpen(true); };
    const closeForm = () => { setFormOpen(false); setEditingCategory(null); setEditingType(null); };
    const submit = () => {
        if (!formName.trim()) return;
        const data = editingCategory || tab === 'categories' ? { name: formName, description: formDescription, image: formImage } : { name: formName, store_category_id: Number(formCategory), image: formImage };
        const options = { preserveScroll: true, forceFormData: true, onSuccess: closeForm };
        if (editingCategory) router.post(`/store-management/classification/categories/${editingCategory.id}`, { ...data, _method: 'patch' }, options);
        else if (editingType) router.post(`/store-management/classification/types/${editingType.id}`, { ...data, _method: 'patch' }, options);
        else if (tab === 'categories') router.post('/store-management/classification/categories', data, options);
        else router.post('/store-management/classification/types', data, options);
    };
    const remove = (kind: Tab, id: number, name: string) => { if (window.confirm(`Delete ${name}? This will be a soft delete.`)) router.delete(`/store-management/classification/${kind}/${id}`, { preserveScroll: true }); };
    const restore = (kind: Tab, id: number) => router.post(`/store-management/classification/${kind}/${id}/restore`, {}, { preserveScroll: true });
    const imageCell = (url: string | null | undefined, alt: string) => url ? <img src={url} alt={alt} className="size-10 rounded-md object-cover" /> : <span className="text-muted-foreground">-</span>;
    const categoryColumns: DataTableColumn<Category>[] = [
        { key: 'image_url', label: 'Image', value: (item) => item.image_url ?? '', render: (item) => imageCell(item.image_url, item.name) },
        { key: 'name', label: 'Category', sortable: true, value: (item) => item.name },
        { key: 'description', label: 'Description', value: (item) => item.description ?? '', render: (item) => <span className="line-clamp-2 max-w-sm">{item.description || '-'}</span> },
        { key: 'types_count', label: 'Store Types', sortable: true, value: (item) => item.types_count },
        { key: 'status', label: 'Status', sortable: true, value: (item) => item.status, render: (item) => <StatusBadge status={item.status} /> },
        { key: 'created_at', label: 'Created At', sortable: true, value: (item) => item.created_at ?? '', render: (item) => date(item.created_at) },
        { key: 'updated_at', label: 'Updated At', sortable: true, value: (item) => item.updated_at ?? '', render: (item) => date(item.updated_at) },
    ];
    const typeColumns: DataTableColumn<StoreType>[] = [
        { key: 'name', label: 'Store Type', sortable: true, value: (item) => item.name },
        { key: 'category_name', label: 'Category', sortable: true, value: (item) => item.category_name ?? '' },
        { key: 'status', label: 'Status', sortable: true, value: (item) => item.status, render: (item) => <StatusBadge status={item.status} /> },
        { key: 'created_at', label: 'Created At', sortable: true, value: (item) => item.created_at ?? '', render: (item) => date(item.created_at) },
        { key: 'updated_at', label: 'Updated At', sortable: true, value: (item) => item.updated_at ?? '', render: (item) => date(item.updated_at) },
    ];
    const isTypeForm = tab === 'types' || editingType !== null;

    return <>
        <Head title="Store Classification" />
        <main className="space-y-6 p-6">
            <div><h1 className="text-2xl font-semibold">Store Classification</h1><p className="text-muted-foreground">Manage store categories and store types.</p></div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><StatusTabs tabs={tabs} value={tab} onChange={(value) => { setTab(value as Tab); setSearch(''); setSelectedCategoryId([]); setPage(1); setSelectedIds([]); }} /><Button onClick={openCreate}><Plus className="size-4" />Add {tab === 'categories' ? 'Store Category' : 'Store Type'}</Button></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex w-full items-center gap-2"><SearchBar className="flex-1 sm:flex-none" value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={`Search ${tab === 'categories' ? 'categories' : 'store types'}...`} />{tab === 'types' && <FilterModal value={selectedCategoryId.map(String)} options={categories.filter((item) => item.status !== 'deleted').map((item) => ({ value: String(item.id), label: item.name }))} onApply={(value) => { setSelectedCategoryId(value.map(Number)); setPage(1); setSelectedIds([]); }} label="Filter store types" />}</div><Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></div>
            {tab === 'categories' ? <DataTable rows={pagedRows as Category[]} columns={categoryColumns} getRowId={(item) => item.id} selectedIds={selectedIds} onSelectionChange={setSelectedIds} onRowClick={(item) => { setTab('types'); setSelectedCategoryId([item.id]); setSearch(''); setPage(1); setSelectedIds([]); }} actions={(item) => <>{item.status === 'deleted' ? <DropdownMenuItem onSelect={() => restore('categories', item.id)}><RotateCcw className="size-4" />Restore</DropdownMenuItem> : <><DropdownMenuItem onSelect={() => openEditCategory(item)}><Pencil className="size-4" />Edit</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => remove('categories', item.id, item.name)}><Trash2 className="size-4" />Delete</DropdownMenuItem></>}</>} emptyMessage="No store categories match your filters." /> : <DataTable rows={pagedRows as StoreType[]} columns={typeColumns} getRowId={(item) => item.id} selectedIds={selectedIds} onSelectionChange={setSelectedIds} actions={(item) => <>{item.status === 'deleted' ? <DropdownMenuItem onSelect={() => restore('types', item.id)}><RotateCcw className="size-4" />Restore</DropdownMenuItem> : <><DropdownMenuItem onSelect={() => openEditType(item)}><Pencil className="size-4" />Edit</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => remove('types', item.id, item.name)}><Trash2 className="size-4" />Delete</DropdownMenuItem></>}</>} emptyMessage="No store types match your filters." />}
        </main>
        <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}><DialogContent><DialogHeader><DialogTitle>{editingCategory || editingType ? 'Edit' : 'Add'} {editingType ? 'Store Type' : tab === 'types' ? 'Store Type' : 'Category'}</DialogTitle><DialogDescription>{editingCategory || editingType ? 'Update the classification details.' : 'Add a new store classification.'}</DialogDescription></DialogHeader><div className="grid gap-4">{isTypeForm && <div className="grid w-full gap-2"><Label htmlFor="classification-category">Category</Label><Select value={formCategory} onValueChange={setFormCategory}><SelectTrigger id="classification-category" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.filter((item) => item.status !== 'deleted').map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>}<div className="grid gap-2"><Label htmlFor="classification-name">Name</Label><Input id="classification-name" value={formName} onChange={(event) => setFormName(event.target.value)} /></div>{!isTypeForm && <div className="grid gap-2"><Label htmlFor="classification-description">Description</Label><Textarea id="classification-description" value={formDescription} onChange={(event) => setFormDescription(event.target.value)} placeholder="Describe the products and businesses in this category in Taglish." /></div>}<div className="grid gap-2"><Label>Image</Label><ImageUpload value={formImage} initialPreview={formImagePreview} onChange={setFormImage} label="classification image" /></div></div><DialogFooter><Button type="button" variant="outline" onClick={closeForm}>Cancel</Button><Button type="button" onClick={submit} disabled={!formName.trim() || (isTypeForm && !formCategory)}>Save</Button></DialogFooter></DialogContent></Dialog>
    </>;
}

StoreClassification.layout = { breadcrumbs: [{ title: 'Store Classification', href: '/store-management/classification' }] };
