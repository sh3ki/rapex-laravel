import { Head, router } from '@inertiajs/react';
import { KeyRound, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import Pagination from '@/components/pagination';
import SearchBar from '@/components/search-bar';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import StatusTabs, { type StatusTab } from '@/components/status-tabs';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { notify } from '@/lib/toast';

type Account = {
    id: number;
    profile_image?: string | null;
    first_name?: string;
    middle_name?: string | null;
    last_name?: string;
    name: string;
    email: string;
    phone_number?: string | null;
    status: string;
    registered_at?: string;
    application_id?: number;
    date_of_birth?: string | null;
    gender?: string | null;
    nationality?: string | null;
    house_unit_building?: string | null;
    street?: string | null;
    barangay?: string | null;
    city_municipality?: string | null;
    province?: string | null;
    region?: string | null;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    id_type?: string | null;
    onboarding_profile_image?: string | null;
    id_front_image?: string | null;
    id_back_image?: string | null;
    selfie_image?: string | null;
};

type EditForm = {
    first_name: string; middle_name: string; last_name: string; email: string; phone_number: string;
    date_of_birth: string; gender: string; nationality: string; house_unit_building: string; street: string;
    barangay: string; city_municipality: string; province: string; region: string; postal_code: string;
    latitude: string; longitude: string; id_type: string; status: string;
};
type MediaField = 'profile_image' | 'id_front_image' | 'id_back_image' | 'selfie_image';
type ImagePreview = { src: string; label: string } | null;

const genderOptions = [['male', 'Male'], ['female', 'Female'], ['non-binary', 'Non-binary'], ['other', 'Other'], ['prefer-not-to-say', 'Prefer not to say']];
const idTypeOptions = ['National ID (PhilSys)', "Driver's License", 'Passport', 'UMID', 'Postal ID', 'SSS ID', 'PhilHealth ID', 'PRC ID', 'TIN ID', "Voter's ID", 'NBI Clearance', 'Other Government-Issued ID'];

function AccountDetails({ account, editing, form, setForm, previews, fileInputKeys, onFileChange, onImageClick }: {
    account: Account; editing: boolean; form: EditForm; setForm: Dispatch<SetStateAction<EditForm>>;
    previews: Record<MediaField, string>; fileInputKeys: Record<MediaField, number>; onFileChange: (field: MediaField, file: File | undefined) => void;
    onImageClick: (src: string, label: string) => void;
}) {
    const textField = (key: keyof EditForm, label: string, type = 'text') => editing ? (
        <div className="grid gap-2"><Label>{label}</Label><Input type={type} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></div>
    ) : <div className="min-w-0"><p className="text-muted-foreground text-sm">{label}</p><p className="truncate text-sm font-medium">{String(account[key as keyof Account] ?? '') || '—'}</p></div>;
    const value = (key: keyof Account) => String(account[key] ?? '') || '—';
    const image = (field: MediaField, label: string, src?: string | null) => {
        const preview = previews[field] || src;
        const isProfile = field === 'profile_image';
        const imageClass = isProfile ? 'mx-auto size-40 rounded-full' : 'h-40 w-full rounded-md';
        return <div className="grid gap-2"><p className="text-muted-foreground text-sm">{label}</p><div className="relative">{preview ? <button type="button" className={`bg-muted overflow-hidden border ${imageClass}`} onClick={() => onImageClick(preview, label)}><img src={preview} alt={label} className={`size-full ${isProfile ? 'object-cover' : 'object-contain'}`} /></button> : <div className={`bg-muted text-muted-foreground flex items-center justify-center border text-sm ${imageClass}`}>No image</div>}{editing && previews[field] && <button type="button" className="bg-background text-muted-foreground hover:text-foreground absolute top-2 right-2 rounded-full border p-1" onClick={() => onFileChange(field, undefined)} aria-label={`Remove replacement ${label}`}><X className="size-4" /></button>}</div>{editing && !isProfile && <Input key={`${field}-${fileInputKeys[field]}`} type="file" accept="image/*" onChange={(event) => onFileChange(field, event.target.files?.[0])} />}</div>;
    };
    const gender = editing ? <Select value={form.gender} onValueChange={(gender) => setForm((current) => ({ ...current, gender }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent>{genderOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select> : <p className="text-sm font-medium">{value('gender')}</p>;
    const status = editing ? <Select value={form.status} onValueChange={(status) => setForm((current) => ({ ...current, status }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{statuses.slice(1).map((status) => <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>)}</SelectContent></Select> : <div className="w-fit"><StatusBadge status={account.status} /></div>;
    const selectedIdType = idTypeOptions.find((option) => option.trim() === form.id_type.trim()) ?? form.id_type;
    const idType = editing ? <Select value={selectedIdType} onValueChange={(id_type) => setForm((current) => ({ ...current, id_type }))}><SelectTrigger className="w-fit min-w-56"><SelectValue placeholder="Select ID type" /></SelectTrigger><SelectContent>{selectedIdType && !idTypeOptions.includes(selectedIdType) && <SelectItem value={selectedIdType}>{selectedIdType}</SelectItem>}{idTypeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select> : <p className="text-sm font-medium">{value('id_type')}</p>;
    const profileImage = account.onboarding_profile_image ?? account.profile_image;
    const profileUploader = <ProfileImageUpload value={null} initialPreview={profileImage ?? ''} onChange={(file) => onFileChange('profile_image', file ?? undefined)} />;

    return <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-2">
        <section className="space-y-5 rounded-lg border p-5"><h3 className="border-b pb-3 text-base font-semibold">Profile information</h3><div className="grid gap-6 lg:grid-cols-[180px_1fr]"><div>{editing ? profileUploader : image('profile_image', 'Profile picture', profileImage)}</div><div className="grid gap-5"><div className="grid gap-5 sm:grid-cols-3">{textField('first_name', 'First name')}{textField('middle_name', 'Middle name')}{textField('last_name', 'Last name')}</div><div className="grid gap-5 sm:grid-cols-3">{textField('email', 'Email address', 'email')}{textField('phone_number', 'Mobile number')}<div className="grid gap-2"><Label>Status</Label>{status}</div></div><div className="grid gap-5 sm:grid-cols-3">{textField('date_of_birth', 'Birthdate', 'date')}<div className="grid gap-2"><Label>Gender</Label>{gender}</div>{textField('nationality', 'Nationality')}</div></div></div></section>
        <section className="space-y-5 rounded-lg border p-5"><h3 className="border-b pb-3 text-base font-semibold">Address and location</h3><div className="grid gap-5 sm:grid-cols-3">{textField('house_unit_building', 'House / Unit / Building no.')}{textField('street', 'Street')}{textField('barangay', 'Barangay')}{textField('city_municipality', 'City / Municipality')}{textField('province', 'Province')}{textField('region', 'Region')}{textField('postal_code', 'Postal code')}{textField('latitude', 'Latitude', 'number')}{textField('longitude', 'Longitude', 'number')}</div></section>
        <section className="space-y-5 rounded-lg border p-5"><h3 className="border-b pb-3 text-base font-semibold">ID and selfie verification</h3><div className="grid gap-2"><Label>ID type</Label>{idType}</div><div className="grid gap-5 sm:grid-cols-3">{image('id_front_image', 'Valid ID front', account.id_front_image)}{image('id_back_image', 'Valid ID back', account.id_back_image)}{image('selfie_image', 'Selfie capture', account.selfie_image)}</div></section>
        <div className="rounded-lg border p-5"><p className="text-muted-foreground text-sm">Registered date</p><p className="text-sm font-medium">{account.registered_at ? new Date(account.registered_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p></div>
    </div>;
}

function LegacyAccountDetails({ account, editing, form, setForm, previews, onFileChange, onImageClick }: {
    account: Account; editing: boolean; form: EditForm; setForm: Dispatch<SetStateAction<EditForm>>;
    previews: Record<MediaField, string>; onFileChange: (field: MediaField, file: File | undefined) => void;
    onImageClick: (src: string, label: string) => void;
}) {
    const textField = (key: keyof EditForm, label: string, type = 'text') => editing ? (
        <div className="grid gap-2"><Label>{label}</Label><Input type={type} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></div>
    ) : <div><p className="text-muted-foreground">{label}</p><p>{String(account[key as keyof Account] ?? '') || '—'}</p></div>;
    const value = (key: keyof Account) => String(account[key] ?? '') || '—';
    const image = (field: MediaField, label: string, src?: string | null) => {
        const preview = previews[field] || src;
        const isProfile = field === 'profile_image';
        const imageClass = isProfile ? 'mx-auto size-40 rounded-full' : 'h-40 w-full rounded-md';
        return <div className="grid gap-2"><p className="text-muted-foreground text-sm">{label}</p>{preview ? <button type="button" className={`bg-muted overflow-hidden border ${imageClass}`} onClick={() => onImageClick(preview, label)}><img src={preview} alt={label} className={`size-full ${isProfile ? 'object-cover' : 'object-contain'}`} /></button> : <div className={`bg-muted text-muted-foreground flex items-center justify-center border text-sm ${imageClass}`}>No image</div>}{editing && <Input type="file" accept="image/*" onChange={(event) => onFileChange(field, event.target.files?.[0])} />}</div>;
    };
    return <div className="max-h-[72vh] space-y-8 overflow-y-auto pr-2">
        <section className="space-y-4"><h3 className="font-medium">Profile information</h3><div className="grid gap-4 sm:grid-cols-2">{image('profile_image', 'Profile picture', account.onboarding_profile_image ?? account.profile_image)}{textField('first_name', 'First name')}{textField('middle_name', 'Middle name')}{textField('last_name', 'Last name')}{textField('date_of_birth', 'Birthdate', 'date')}{editing ? <div className="grid gap-2"><Label>Gender</Label><Select value={form.gender} onValueChange={(gender) => setForm((current) => ({ ...current, gender }))}><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent>{genderOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div> : <div><p className="text-muted-foreground">Gender</p><p>{value('gender')}</p></div>}{textField('nationality', 'Nationality')}{textField('email', 'Email address', 'email')}{textField('phone_number', 'Mobile number')}</div></section>
        <section className="space-y-4"><h3 className="font-medium">Address and location</h3><div className="grid gap-4 sm:grid-cols-3">{textField('house_unit_building', 'House / Unit / Building no.')}{textField('street', 'Street')}{textField('barangay', 'Barangay')}{textField('city_municipality', 'City / Municipality')}{textField('province', 'Province')}{textField('region', 'Region')}{textField('postal_code', 'Postal code')}{textField('latitude', 'Latitude', 'number')}{textField('longitude', 'Longitude', 'number')}</div></section>
        <section className="space-y-4"><h3 className="font-medium">ID and selfie verification</h3>{editing ? <div className="grid gap-2"><Label>ID type</Label><Select value={form.id_type} onValueChange={(id_type) => setForm((current) => ({ ...current, id_type }))}><SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger><SelectContent>{idTypeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div> : <div><p className="text-muted-foreground">ID type</p><p>{value('id_type')}</p></div>}<div className="grid gap-4 sm:grid-cols-3">{image('id_front_image', 'Valid ID front', account.id_front_image)}{image('id_back_image', 'Valid ID back', account.id_back_image)}{image('selfie_image', 'Selfie capture', account.selfie_image)}</div></section>
        <section className="grid gap-4 sm:grid-cols-2"><div><p className="text-muted-foreground">Status</p>{editing ? <Select value={form.status} onValueChange={(status) => setForm((current) => ({ ...current, status }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.slice(1).map((status) => <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>)}</SelectContent></Select> : <StatusBadge status={account.status} />}</div><div><p className="text-muted-foreground">Registered date</p><p>{account.registered_at ? new Date(account.registered_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p></div></section>
    </div>;
}

const statuses = ['all', 'pending', 'active', 'inactive', 'suspended', 'banned', 'deactivated', 'deleted'];
const statusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
        inactive: 'bg-muted text-muted-foreground',
        suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
        banned: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
        deactivated: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
        deleted: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };
    return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${colors[status] ?? colors.inactive}`}>{statusLabel(status)}</span>;
}

export default function MerchantAccounts({ accounts }: { accounts: Account[] }) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
    const [passwordAccount, setPasswordAccount] = useState<Account | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ first_name: '', middle_name: '', last_name: '', email: '', phone_number: '', date_of_birth: '', gender: '', nationality: '', house_unit_building: '', street: '', barangay: '', city_municipality: '', province: '', region: '', postal_code: '', latitude: '', longitude: '', id_type: '', status: 'pending' });
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [editFiles, setEditFiles] = useState<Record<MediaField, File | null>>({ profile_image: null, id_front_image: null, id_back_image: null, selfie_image: null });
    const [editPreviews, setEditPreviews] = useState<Record<MediaField, string>>({ profile_image: '', id_front_image: '', id_back_image: '', selfie_image: '' });
    const [fileInputKeys, setFileInputKeys] = useState<Record<MediaField, number>>({ profile_image: 0, id_front_image: 0, id_back_image: 0, selfie_image: 0 });
    const [zoomedImage, setZoomedImage] = useState<ImagePreview>(null);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    const tabs: StatusTab[] = statuses.map((value) => ({
        value,
        label: value === 'all' ? 'ALL' : statusLabel(value),
        count: value === 'all' ? accounts.length : accounts.filter((account) => account.status === value).length,
    }));
    const filteredAccounts = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        return accounts.filter((account) => {
            const matchesStatus = status === 'all' || account.status === status;
            const matchesSearch = !query || [account.name, account.email, account.phone_number].some((value) => value?.toLowerCase().includes(query));
            return matchesStatus && matchesSearch;
        });
    }, [accounts, debouncedSearch, status]);
    const pageAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);

    const openEdit = (account: Account) => {
        setEditingAccount(account);
        setEditFiles({ profile_image: null, id_front_image: null, id_back_image: null, selfie_image: null });
        setEditPreviews({ profile_image: '', id_front_image: '', id_back_image: '', selfie_image: '' });
        setFileInputKeys((current) => ({ ...current, id_front_image: current.id_front_image + 1, id_back_image: current.id_back_image + 1, selfie_image: current.selfie_image + 1 }));
        setEditForm({
            first_name: account.first_name ?? '',
            middle_name: account.middle_name ?? '',
            last_name: account.last_name ?? '',
            email: account.email,
            phone_number: account.phone_number ?? '',
            date_of_birth: account.date_of_birth ?? '', gender: account.gender ?? '', nationality: account.nationality ?? '',
            house_unit_building: account.house_unit_building ?? '', street: account.street ?? '', barangay: account.barangay ?? '', city_municipality: account.city_municipality ?? '', province: account.province ?? '', region: account.region ?? '', postal_code: account.postal_code ?? '',
            latitude: account.latitude === null || account.latitude === undefined ? '' : String(account.latitude), longitude: account.longitude === null || account.longitude === undefined ? '' : String(account.longitude), id_type: account.id_type ?? '',
            status: account.status,
        });
    };
    const onFileChange = (field: MediaField, file: File | undefined) => {
        if (!file) {
            setEditFiles((current) => ({ ...current, [field]: null }));
            setEditPreviews((current) => ({ ...current, [field]: '' }));
            setFileInputKeys((current) => ({ ...current, [field]: current[field] + 1 }));
            return;
        }
        if (!file.type.startsWith('image/') || file.size > 1024 * 1024) { notify.error('Please choose an image no larger than 1 MB.'); return; }
        setEditFiles((current) => ({ ...current, [field]: file }));
        setEditPreviews((current) => ({ ...current, [field]: URL.createObjectURL(file) }));
    };
    const closePassword = () => {
        setPasswordAccount(null);
        setPassword('');
        setPasswordConfirmation('');
    };
    const deleteAccount = (account: Account) => {
        if (window.confirm(`Delete ${account.name}'s account? This will be a soft delete.`)) {
            router.delete(`/merchant-management/accounts/${account.id}`, { preserveScroll: true });
        }
    };
    const legacyColumns: DataTableColumn<Account>[] = [
        { key: 'name', label: 'Name', sortable: true, value: (account) => account.name, render: (account) => <div className="flex items-center gap-3"><Avatar><AvatarImage src={account.profile_image ?? undefined} alt="" /><AvatarFallback>{account.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="font-medium">{account.name}</span></div> },
        { key: 'email', label: 'Email', sortable: true, value: (account) => account.email, render: (account) => <span className="text-muted-foreground">{account.email}</span> },
        { key: 'phone_number', label: 'Phone Number', value: (account) => account.phone_number ?? '—' },
        { key: 'registered_at', label: 'Registered Date', sortable: true, value: (account) => account.registered_at ?? '', render: (account) => account.registered_at ? new Date(account.registered_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
        { key: 'status', label: 'Status', sortable: true, value: (account) => account.status, render: (account) => <StatusBadge status={account.status} /> },
    ];
    const columns: DataTableColumn<Account>[] = [
        { key: 'name', label: 'Name', sortable: true, value: (account) => account.name, render: (account) => <div className="flex items-center gap-3"><Avatar><AvatarImage src={account.profile_image ?? undefined} alt="" /><AvatarFallback>{account.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="font-medium">{account.name}</span></div> },
        { key: 'email', label: 'Email', sortable: true, value: (account) => account.email, render: (account) => <span className="text-muted-foreground">{account.email}</span> },
        { key: 'phone_number', label: 'Phone Number', sortable: true, value: (account) => account.phone_number ?? '-' },
        { key: 'date_of_birth', label: 'Birthdate', sortable: true, value: (account) => account.date_of_birth ?? '-', render: (account) => account.date_of_birth ?? '-' },
        { key: 'gender', label: 'Gender', sortable: true, value: (account) => account.gender ?? '-', render: (account) => account.gender ? statusLabel(account.gender) : '-' },
        { key: 'nationality', label: 'Nationality', sortable: true, value: (account) => account.nationality ?? '-' },
        { key: 'registered_at', label: 'Registered At', sortable: true, value: (account) => account.registered_at ?? '', render: (account) => account.registered_at ? <div><div>{new Date(account.registered_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div><div className="text-muted-foreground text-xs">{new Date(account.registered_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div></div> : '-' },
        { key: 'status', label: 'Status', sortable: true, value: (account) => account.status, render: (account) => <StatusBadge status={account.status} /> },
    ];

    return (
        <>
            <Head title="Merchant Accounts" />
            <main className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Merchant Accounts</h1>
                    <p className="text-muted-foreground">Manage merchant accounts and their access status.</p>
                </div>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <StatusTabs tabs={tabs} value={status} collapsible onChange={(value) => { setStatus(value); setPage(1); }} />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search merchant accounts..." />
                    <Pagination page={page} pageSize={pageSize} total={filteredAccounts.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
                </div>
                <DataTable
                    rows={pageAccounts}
                    columns={columns}
                    getRowId={(account) => account.id}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onRowClick={setViewingAccount}
                    actions={(account) => <><DropdownMenuItem onSelect={() => openEdit(account)}><Pencil className="size-4" />Edit</DropdownMenuItem><DropdownMenuItem onSelect={() => setPasswordAccount(account)}><KeyRound className="size-4" />Change password</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => setDeletingAccount(account)}><Trash2 className="size-4" />Delete</DropdownMenuItem></>}
                    emptyMessage="No merchant accounts match your filters."
                />
            </main>
            <Dialog open={viewingAccount !== null} onOpenChange={(open) => !open && setViewingAccount(null)}>
                <DialogContent className="w-[min(96vw,1100px)] !max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Merchant account</DialogTitle>
                        <DialogDescription>View all merchant onboarding information.</DialogDescription>
                    </DialogHeader>
                    {viewingAccount && <AccountDetails account={viewingAccount} editing={false} form={editForm} setForm={setEditForm} previews={{ profile_image: '', id_front_image: '', id_back_image: '', selfie_image: '' }} fileInputKeys={fileInputKeys} onFileChange={onFileChange} onImageClick={(src, label) => setZoomedImage({ src, label })} />}
                    {/* legacy compact view markup removed */}
                    {/*
                    {false && viewingAccount && <div className="grid gap-5">
                        <div className="flex items-center gap-3">
                            <Avatar className="size-12"><AvatarImage src={viewingAccount?.profile_image ?? undefined} alt="" /><AvatarFallback>{viewingAccount?.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            <div><p className="font-medium">{viewingAccount?.name}</p><p className="text-muted-foreground text-sm">{viewingAccount?.email}</p></div>
                        </div>
                        <div className="grid gap-4 text-sm sm:grid-cols-2">
                            <div><p className="text-muted-foreground">Phone number</p><p>{viewingAccount.phone_number || '—'}</p></div>
                            <div><p className="text-muted-foreground">Registered date</p><p>{viewingAccount.registered_at ? new Date(viewingAccount.registered_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p></div>
                            <div><p className="text-muted-foreground">Status</p><StatusBadge status={viewingAccount.status} /></div>
                        </div>
                    </div>*/}
                    {viewingAccount && <DialogFooter><Button type="button" onClick={() => { openEdit(viewingAccount); setViewingAccount(null); }}>Edit</Button></DialogFooter>}
                </DialogContent>
            </Dialog>
            <Dialog open={editingAccount !== null} onOpenChange={(open) => !open && setEditingAccount(null)}>
                <DialogContent className="w-[min(96vw,1100px)] !max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Edit merchant account</DialogTitle>
                        <DialogDescription>Update the merchant’s account details and status.</DialogDescription>
                    </DialogHeader>
                    {editingAccount && <AccountDetails account={editingAccount} editing form={editForm} setForm={setEditForm} previews={editPreviews} fileInputKeys={fileInputKeys} onFileChange={onFileChange} onImageClick={(src, label) => setZoomedImage({ src, label })} />}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { if (editingAccount) setViewingAccount(editingAccount); setEditingAccount(null); }}>Cancel</Button>
                        <Button type="button" onClick={() => editingAccount && router.patch(`/merchant-management/accounts/${editingAccount.id}`, { ...editForm, profile_image: editFiles.profile_image, id_front_image: editFiles.id_front_image, id_back_image: editFiles.id_back_image, selfie_image: editFiles.selfie_image }, { preserveScroll: true, forceFormData: true, onSuccess: () => setEditingAccount(null) })}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={zoomedImage !== null} onOpenChange={(open) => !open && setZoomedImage(null)}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader><DialogTitle>{zoomedImage?.label}</DialogTitle></DialogHeader>
                    {zoomedImage && <img src={zoomedImage.src} alt={zoomedImage.label} className="max-h-[75vh] w-full object-contain" />}
                </DialogContent>
            </Dialog>
            <Dialog open={deletingAccount !== null} onOpenChange={(open) => !open && setDeletingAccount(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete merchant account?</DialogTitle>
                        <DialogDescription>This will remove access for {deletingAccount?.name}. This action cannot be undone from this screen.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeletingAccount(null)}>Cancel</Button>
                        <Button type="button" variant="destructive" onClick={() => { if (deletingAccount) router.delete(`/merchant-management/accounts/${deletingAccount.id}`, { preserveScroll: true, onSuccess: () => setDeletingAccount(null) }); }}>Delete account</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={passwordAccount !== null} onOpenChange={(open) => !open && closePassword()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change merchant password</DialogTitle>
                        <DialogDescription>Set a new password for {passwordAccount?.name}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2"><Label htmlFor="merchant-new-password">New password</Label><Input id="merchant-new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
                        <div className="grid gap-2"><Label htmlFor="merchant-confirm-password">Confirm password</Label><Input id="merchant-confirm-password" type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} /></div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closePassword}>Cancel</Button>
                        <Button type="button" onClick={() => passwordAccount && router.patch(`/merchant-management/accounts/${passwordAccount.id}/password`, { password, password_confirmation: passwordConfirmation }, { preserveScroll: true, onSuccess: closePassword })}>Update password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

MerchantAccounts.layout = {
    breadcrumbs: [{ title: 'Merchant Accounts', href: '/merchant-management/accounts' }],
};
