import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowLeft, Check, ChevronLeft, ChevronRight, Clipboard, ClipboardCheck, FileText, Info, LocateFixed, MapPin, Store as StoreIcon, Tag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LocationMap } from '@/components/location-map';
import { AddressZipCodeField, SearchableAddressFields } from '@/components/searchable-address-fields';
import { StoreInformationStep, type StoreCreateFiles } from '@/components/store-information-step';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import { StorePreview, type Draft, type Files } from '@/pages/merchant/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notify } from '@/lib/toast';

type Category = { id: number; name: string; description?: string | null; image_url?: string | null };
type StoreType = { id: number; name: string; store_category_id: number; image_url?: string | null };
type MerchantAddress = { house_unit_building?: string | null; street?: string | null; barangay?: string | null; city_municipality?: string | null; province?: string | null; region?: string | null; zip_code?: string | null; latitude?: number | null; longitude?: number | null };
type Props = { merchantId?: number; categories?: Category[]; types?: StoreType[]; merchantEmail?: string | null; merchantPhone?: string | null; merchantAddress?: MerchantAddress | null; storeNames?: string[]; googleMapsApiKey?: string };
const steps = ['Store Classification', 'Store Profile', 'Store Information', 'Store Location', 'Review'];
const stepIcons = [Tag, StoreIcon, Info, MapPin, ClipboardCheck];
const structures = [['sole-proprietorship', 'Sole Proprietorship'], ['opc', 'One Person Corporation (OPC)'], ['partnership', 'Partnership'], ['corporation', 'Corporation'], ['cooperative', 'Cooperative']] as const;
const registrations = [['unregistered-microseller', 'Unregistered / Microseller'], ['non-vat-registration', 'Non-VAT Registration'], ['vat-registration', 'VAT Registration']] as const;
const initial: Draft = { store_category_id: '', store_type_id: '', name: '', tagline: '', description: '', business_structure: '', business_registration: '', valid_id_type: '', contact_email: '', contact_mobile_phone: '', contact_telephone: '', house_unit_building: '', street: '', barangay: '', city_municipality: '', province: '', region: '', zip_code: '', latitude: null, longitude: null };
const emptyFiles: StoreCreateFiles = { profile_image: null, banner_image: null, valid_id_front: null, valid_id_back: null, selfie: null, store_capture: null, documents: {}, other_documents: [null] };
const storeDraftDb = 'rapex-merchant-store-create';
const storeDraftPrefix = 'rapex:merchant-store-create:';
const storeDraftKey = (merchantId?: number) => `rapex:merchant-store-create:${merchantId ?? 'unknown'}:draft`;

function openStoreDraftDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(storeDraftDb, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('images');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveStoreImage(key: string, file: File | null) {
    const db = await openStoreDraftDb();
    const store = db.transaction('images', 'readwrite').objectStore('images');
    if (file) store.put(file, key);
    else store.delete(key);
}

async function loadStoreImage(key: string): Promise<File | null> {
    try {
        const db = await openStoreDraftDb();
        return await new Promise((resolve) => {
            const request = db.transaction('images').objectStore('images').get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

async function clearStoreDraftImages() {
    try {
        const db = await openStoreDraftDb();
        db.transaction('images', 'readwrite').objectStore('images').clear();
    } catch {
        // Ignore unavailable IndexedDB during cleanup.
    }
}

function clearStoreDraftState() {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key?.startsWith(storeDraftPrefix)) localStorage.removeItem(key);
    }
    return clearStoreDraftImages();
}

function ErrorText({ message }: { message?: string }) { return message ? <p className="text-sm text-destructive">{message}</p> : null; }

function ReviewField({ label, value }: { label: string; value: unknown }) {
    const text = value === null || value === undefined || String(value).trim() === '' ? 'Not provided' : String(value);
    return <div><p className="font-medium text-muted-foreground">{label}</p><p className="whitespace-pre-wrap break-words">{text}</p></div>;
}

function ReviewImage({ file, label, className = 'aspect-[4/3] w-full', shape = 'rectangle' }: { file: File | null; label: string; className?: string; shape?: 'circle' | 'rectangle' }) {
    const [src, setSrc] = useState('');
    useEffect(() => {
        if (!file) { setSrc(''); return; }
        const objectUrl = URL.createObjectURL(file);
        setSrc(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);
    if (!file || !src) return null;
    return <div className="space-y-2"><p className="font-medium text-muted-foreground">{label}</p><img src={src} alt={`${label} preview`} className={`${className} ${shape === 'circle' ? 'rounded-full object-cover' : 'rounded-md object-contain'} border`} /></div>;
}

function ReviewFile({ file, label }: { file: File | null; label: string }) {
    const [src, setSrc] = useState('');
    useEffect(() => {
        if (!file) { setSrc(''); return; }
        const objectUrl = URL.createObjectURL(file);
        setSrc(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);
    if (!file) return null;
    return <div className="space-y-2"><p className="font-medium text-muted-foreground">{label}</p><a href={src} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border p-3 text-sm hover:border-primary"><FileText className="size-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{file.name}</span><span className="shrink-0 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span></a></div>;
}

export default function Page({ merchantId, categories = [], types = [], merchantEmail, merchantPhone, merchantAddress, storeNames = [], googleMapsApiKey }: Props) {
    const cacheKey = storeDraftKey(merchantId);
    const [step, setStep] = useState(1); const [draft, setDraft] = useState<Draft>(initial); const [files, setFiles] = useState<StoreCreateFiles>(emptyFiles);
    const [cacheReady, setCacheReady] = useState(false); const cacheLoaded = useRef(false); const submitted = useRef(false);
    const [errors, setErrors] = useState<Record<string, string>>({}); const [locating, setLocating] = useState(false); const [confirmOpen, setConfirmOpen] = useState(false); const [termsOpen, setTermsOpen] = useState(false); const [privacyOpen, setPrivacyOpen] = useState(false); const [agreed, setAgreed] = useState(false); const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        let hasCachedDraft = false;
        try {
            const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null') as { draft?: Draft; step?: number } | Draft | null;
            const cachedDraft = cached && 'draft' in cached ? cached.draft : cached;
            const cachedName = String(cachedDraft && typeof cachedDraft === 'object' ? cachedDraft.name ?? '' : '').trim().toLocaleLowerCase();
            const belongsToSubmittedStore = cachedName !== '' && storeNames.some((name) => name.trim().toLocaleLowerCase() === cachedName);
            if (belongsToSubmittedStore) {
                localStorage.removeItem(cacheKey);
            } else if (cached && 'draft' in cached && cached.draft) {
                hasCachedDraft = true;
                setDraft({ ...initial, ...(cached.draft as Draft) });
                setStep(typeof cached.step === 'number' ? Math.min(Math.max(cached.step, 1), 5) : 1);
            } else if (cached) {
                hasCachedDraft = true;
                setDraft({ ...initial, ...(cached as Draft) });
            }
        } catch {
            localStorage.removeItem(cacheKey);
        }
        if (!hasCachedDraft) {
            void clearStoreDraftImages().finally(() => { cacheLoaded.current = true; setCacheReady(true); });
            return;
        }
        void Promise.all((['profile_image', 'banner_image', 'valid_id_front', 'valid_id_back', 'selfie', 'store_capture'] as const).map(async (key) => {
            const file = await loadStoreImage(`${merchantId ?? 'unknown'}:${key}`);
            if (file) setFiles((current) => ({ ...current, [key]: file }));
        })).then(async () => {
            const keys = ['barangay_permit', 'business_certificate', 'proof_of_business_address', 'bir_certificate', 'mayors_business_permit'];
            const documentFiles = await Promise.all(keys.map(async (key) => [key, await loadStoreImage(`${merchantId ?? 'unknown'}:documents.${key}`)] as const));
            const otherFiles = await Promise.all([0, 1, 2].map(async (index) => loadStoreImage(`${merchantId ?? 'unknown'}:other_documents.${index}`)));
            const lastOtherIndex = otherFiles.reduce((last, file, index) => file ? index : last, -1);
            setFiles((current) => ({ ...current, documents: Object.fromEntries(documentFiles.filter(([, file]) => file)) as Record<string, File | null>, other_documents: otherFiles.slice(0, Math.max(1, lastOtherIndex + 1)) }));
        }).finally(() => { cacheLoaded.current = true; setCacheReady(true); });
    }, [cacheKey, merchantId, storeNames]);
    useEffect(() => {
        if (!cacheReady || !cacheLoaded.current || submitted.current) return;
        localStorage.setItem(cacheKey, JSON.stringify({ draft, step }));
    }, [cacheKey, cacheReady, draft, step]);
    const update = (key: string, value: string | number | null) => setDraft((current) => ({ ...current, [key]: value })); const error = (key: string) => <ErrorText message={errors[key] ?? (key === 'name' && storeNameTaken ? 'Store name already exists. Please choose another name.' : undefined)} />;
const selectedCategory = categories.find((category) => category.id === Number(draft.store_category_id)); const selectedType = types.find((type) => type.id === Number(draft.store_type_id));
    const hasValue = (key: string) => draft[key] !== null && draft[key] !== undefined && String(draft[key]).trim() !== '';
    const storeNameTaken = storeNames.some((name) => name.trim().toLocaleLowerCase() === String(draft.name ?? '').trim().toLocaleLowerCase());
    const hasMerchantAddress = Boolean(merchantAddress && Object.values(merchantAddress).some((value) => value !== null && value !== undefined && String(value).trim() !== ''));
    const useSavedAddress = () => { if (!merchantAddress) return; (['house_unit_building', 'street', 'barangay', 'city_municipality', 'province', 'region', 'zip_code', 'latitude', 'longitude'] as const).forEach((key) => update(key, merchantAddress[key] ?? null)); };
    const validMobile = /^9\d{9}$/.test(String(draft.contact_mobile_phone ?? ''));
    const requiredDocuments = String(draft.business_registration ?? '') === 'unregistered-microseller' ? ['proof_of_business_address'] : ['barangay_permit', 'business_certificate', 'proof_of_business_address', ...(String(draft.business_registration ?? '') === 'vat-registration' ? ['bir_certificate', 'mayors_business_permit'] : [])];
    const hasRequiredDocuments = requiredDocuments.every((key) => Boolean(files.documents[key]));
    const canContinue = step === 1
        ? hasValue('store_category_id') && hasValue('store_type_id')
        : step === 2
            ? hasValue('name') && hasValue('tagline') && hasValue('description') && Boolean(files.profile_image) && Boolean(files.banner_image)
            : step === 3
                ? hasValue('business_structure') && hasValue('business_registration') && hasValue('valid_id_type') && hasValue('contact_email') && validMobile && Boolean(files.valid_id_front) && Boolean(files.valid_id_back) && Boolean(files.selfie) && Boolean(files.store_capture) && hasRequiredDocuments
                : step === 4
                    ? ['house_unit_building', 'street', 'barangay', 'city_municipality', 'province', 'region', 'zip_code'].every(hasValue) && draft.latitude !== null && draft.longitude !== null
                    : true;
    const locate = () => { if (!navigator.geolocation) { notify.error('Location access is not available in this browser.'); return; } setLocating(true); navigator.geolocation.getCurrentPosition((position) => { update('latitude', position.coords.latitude); update('longitude', position.coords.longitude); setLocating(false); }, () => { setLocating(false); notify.error('Location access is required. Please allow access and try again.'); }, { enableHighAccuracy: true, timeout: 10000 }); };
    useEffect(() => { locate(); }, []);
    const validate = (keys: string[]) => { const next: Record<string, string> = {}; keys.forEach((key) => { if (!draft[key]) next[key] = 'This field is required.'; }); setErrors(next); if (Object.keys(next).length) notify.error('Please complete the required fields before continuing.'); return !Object.keys(next).length; };
    const next = () => { if (step === 1 && validate(['store_category_id', 'store_type_id'])) setStep(2); else if (step === 2) { const valid = validate(['name', 'tagline', 'description']); if (storeNameTaken) { setErrors((current) => ({ ...current, name: 'This store name is already in use. Please choose another name.' })); notify.error('Store name must be unique.'); return; } if (valid && files.profile_image && files.banner_image) setStep(3); } else if (step === 3 && canContinue) setStep(4); else if (step === 4 && validate(['house_unit_building', 'street', 'barangay', 'city_municipality', 'province', 'region', 'zip_code', 'latitude', 'longitude'])) setStep(5); };
    const submit = () => { const data = new FormData(); Object.entries(draft).forEach(([key, value]) => data.append(key, key === 'contact_mobile_phone' ? `+63${String(value ?? '')}` : String(value ?? ''))); data.append('profile_image', files.profile_image!); data.append('banner_image', files.banner_image!); data.append('valid_id_front', files.valid_id_front!); data.append('valid_id_back', files.valid_id_back!); data.append('selfie', files.selfie!); data.append('store_capture', files.store_capture!); Object.entries(files.documents).forEach(([key, file]) => { if (file) data.append(`documents[${key}]`, file); }); files.other_documents.forEach((file) => { if (file) data.append('other_documents[]', file); }); data.append('terms_accepted', '1'); router.post('/store-management/stores', data, { forceFormData: true, onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false), onError: (formErrors) => setErrors(formErrors as Record<string, string>), onSuccess: () => { submitted.current = true; setCacheReady(false); setConfirmOpen(false); localStorage.removeItem(cacheKey); setDraft({ ...initial }); setStep(1); setFiles({ ...emptyFiles, documents: {}, other_documents: [null] }); setErrors({}); void clearStoreDraftState(); } }); };
    const saveFile = (key: keyof StoreCreateFiles | string, file: File | null) => { if (key.startsWith('documents.')) { const documentKey = key.slice('documents.'.length); setFiles((current) => ({ ...current, documents: { ...current.documents, [documentKey]: file } })); } else if (key.startsWith('other_documents.')) { const index = Number(key.slice('other_documents.'.length)); setFiles((current) => ({ ...current, other_documents: file === null && index > 0 ? current.other_documents.filter((_, currentIndex) => currentIndex !== index) : current.other_documents.map((item, currentIndex) => currentIndex === index ? file : item) })); } else { setFiles((current) => ({ ...current, [key]: file })); } void saveStoreImage(`${merchantId ?? 'unknown'}:${key}`, file); };
    const addOtherDocument = () => setFiles((current) => current.other_documents.length < 3 ? ({ ...current, other_documents: [...current.other_documents, null] }) : current);
    const field = (key: string, label: string, type = 'text', disabled = false) => { const required = label.endsWith(' *'); const text = required ? label.slice(0, -2) : label; return <div className="space-y-2"><Label htmlFor={key}>{text}{required ? ' *' : <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>}</Label><Input id={key} type={type} value={String(draft[key] ?? '')} disabled={disabled} onChange={(event) => update(key, type === 'number' ? (event.target.value === '' ? null : Number(event.target.value)) : event.target.value)} />{error(key)}</div>; };

    return <><Head title="Create Store" /><main className="space-y-6 p-6"><div><Button asChild variant="ghost" className="mb-2 -ml-3"><Link href="/store-management/stores"><ArrowLeft />Back to stores</Link></Button><h1 className="text-2xl font-semibold">Create Store</h1><p className="text-muted-foreground">Complete the steps below to submit your store for approval.</p></div><div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="min-w-0 space-y-6"><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{steps.map((label, index) => { const Icon = stepIcons[index]; const active = step === index + 1; const completed = index + 1 < step; return <button key={label} type="button" onClick={() => completed && setStep(index + 1)} className={active ? 'flex items-center justify-center gap-2 rounded-md border border-primary bg-primary/10 p-3 text-center text-sm font-medium text-foreground transition-colors' : completed ? 'flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/5 p-3 text-center text-sm text-primary transition-colors' : 'flex items-center justify-center gap-2 rounded-md border p-3 text-center text-sm text-muted-foreground transition-colors'}><Icon className="size-4 shrink-0" aria-hidden="true" /><span>{index + 1} {label}</span></button>; })}</div><Card><CardContent className="space-y-6">
        {step === 1 && <section className="space-y-5"><div className="space-y-2"><CardTitle>Store Classification</CardTitle><CardDescription>Choose a category, then choose a store type.</CardDescription></div><div className="grid gap-6 lg:grid-cols-2"><div className="flex min-h-0 flex-col space-y-3 lg:h-[626px]"><Label>Store category *</Label><div className="min-h-0 flex-1 overflow-y-auto rounded-lg border p-3"><div className="space-y-3">{categories.map((category) => { const selected = Number(draft.store_category_id) === category.id; return <button key={category.id} type="button" onClick={() => { update('store_category_id', category.id); update('store_type_id', ''); }} aria-pressed={selected} className={`relative flex min-h-24 w-full overflow-hidden rounded-lg border text-left transition ${selected ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/60'}`}><div className="flex min-w-0 flex-1 flex-col justify-center p-2.5 pr-10"><p className="text-sm font-medium">{category.name}</p>{category.description && <p className="mt-1 text-xs text-muted-foreground">{category.description}</p>}</div><div className="w-24 shrink-0 self-stretch bg-transparent sm:w-28">{category.image_url ? <img src={category.image_url} alt={category.name} className="size-full object-contain" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><StoreIcon className="size-7" /></div>}</div>{selected && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Selected"><Check className="size-4" /></span>}</button>; })}</div></div>{error('store_category_id')}</div><div className="flex min-h-0 flex-col space-y-3 lg:h-[626px]"><Label>Store type *</Label><div className="min-h-0 flex-1 overflow-y-auto rounded-lg border p-3">{selectedCategory ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{types.filter((type) => type.store_category_id === selectedCategory.id).map((type) => { const selected = Number(draft.store_type_id) === type.id; return <button key={type.id} type="button" onClick={() => update('store_type_id', type.id)} aria-pressed={selected} className={`relative flex min-h-10 w-full items-center rounded-md border px-3 py-2 pr-10 text-left transition ${selected ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'hover:border-primary/60'}`}><span className="font-medium">{type.name}</span>{selected && <span className="absolute right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Selected"><Check className="size-3.5" /></span>}</button>; })}{!types.some((type) => type.store_category_id === selectedCategory.id) && <p className="text-sm text-muted-foreground">No store types are available for this category.</p>}</div> : <p className="text-sm text-muted-foreground">Select a category to see store types.</p>}</div>{error('store_type_id')}</div></div></section>}
        {step === 2 && <section className="space-y-5"><div className="space-y-2"><CardTitle>Store Profile</CardTitle><CardDescription>Tell customers about your store.</CardDescription></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">Store name *</Label><div className="relative"><Input id="name" maxLength={30} value={String(draft.name ?? '')} onChange={(event) => update('name', event.target.value)} className="pr-16" /><span className="pointer-events-none absolute right-3 bottom-2 text-xs text-muted-foreground">{String(draft.name ?? '').length}/30</span></div>{error('name')}</div><div className="space-y-2"><Label htmlFor="tagline">Store tagline *</Label><div className="relative"><Input id="tagline" maxLength={80} value={String(draft.tagline ?? '')} onChange={(event) => update('tagline', event.target.value)} className="pr-16" /><span className="pointer-events-none absolute right-3 bottom-2 text-xs text-muted-foreground">{String(draft.tagline ?? '').length}/80</span></div>{error('tagline')}</div></div><div className="space-y-2"><Label htmlFor="description">Store description *</Label><div className="relative"><textarea id="description" maxLength={500} rows={5} value={String(draft.description)} onChange={(event) => update('description', event.target.value)} className="border-input bg-background w-full rounded-md border px-3 py-2 pb-7 text-sm" /><span className="pointer-events-none absolute right-3 bottom-2 text-xs text-muted-foreground">{String(draft.description ?? '').length}/500</span></div>{error('description')}</div><div className="grid items-start gap-6 sm:grid-cols-2"><div className="space-y-2"><Label>Profile image *</Label><ProfileImageUpload align="start" value={files.profile_image} onChange={(file) => saveFile('profile_image', file)} /><ErrorText message={errors.profile_image} /></div><div className="space-y-2"><Label>Banner image *</Label><ProfileImageUpload align="start" aspectRatio={2} shape="rectangle" value={files.banner_image} onChange={(file) => saveFile('banner_image', file)} /><ErrorText message={errors.banner_image} /></div></div></section>}
        {step === 3 && <StoreInformationStep draft={draft} files={files} structures={structures} registrations={registrations} merchantEmail={merchantEmail} merchantPhone={merchantPhone} update={update} saveFile={saveFile} addOtherDocument={addOtherDocument} error={error} />}
        {step === 4 && <section className="space-y-5"><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><MapPin className="size-5" />Store Location</CardTitle><CardDescription>Use your current position or click the map to choose the store location.</CardDescription></div>{hasMerchantAddress && <Button type="button" size="icon" variant="outline" title="Use saved address" aria-label="Use saved address" onClick={useSavedAddress}><span className="relative inline-flex"><Clipboard /><ArrowDown className="absolute -bottom-1 -right-1 size-3 bg-background stroke-[2.5]" /></span></Button>}</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><SearchableAddressFields draft={draft} update={update} error={error} />{field('street', 'Street *')}{field('house_unit_building', 'House/Unit/Bldg/Floor *')}<AddressZipCodeField draft={draft} error={error} /><div>{field('latitude', 'Latitude *', 'number', true)}</div><div>{field('longitude', 'Longitude *', 'number', true)}</div></div><div className="flex flex-wrap items-center justify-start gap-3"><Button type="button" variant="outline" onClick={locate} disabled={locating}><LocateFixed className="size-4" />{locating ? 'Detecting...' : 'Use my current location'}</Button></div>{error('latitude')}{error('longitude')}<LocationMap latitude={typeof draft.latitude === 'number' ? draft.latitude : null} longitude={typeof draft.longitude === 'number' ? draft.longitude : null} onLocationChange={({ latitude, longitude }) => { update('latitude', Number(latitude.toFixed(7))); update('longitude', Number(longitude.toFixed(7))); }} googleMapsApiKey={googleMapsApiKey} /></section>}
        {step === 5 && <section className="space-y-8"><div className="space-y-2"><CardTitle>Review and Submit</CardTitle><CardDescription>Carefully review every detail from steps 1–4 before submitting your store for approval.</CardDescription></div>
            <section className="space-y-4"><div><h3 className="text-base font-semibold">Step 1 — Store classification</h3><p className="text-muted-foreground">The category and store type customers will see.</p></div><div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><ReviewField label="Store category" value={selectedCategory?.name} /><ReviewField label="Store type" value={selectedType?.name} /></div>{selectedType?.image_url && <div className="rounded-lg border p-4"><div className="space-y-2"><p className="font-medium text-muted-foreground">Store type image</p><img src={selectedType.image_url} alt={`${selectedType.name} preview`} className="h-32 w-full rounded-md border object-contain" /></div></div>}</section>
            <section className="space-y-4"><div><h3 className="text-base font-semibold">Step 2 — Store profile</h3><p className="text-muted-foreground">Your store identity, description, and public images.</p></div><div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><ReviewField label="Store name" value={draft.name} /><ReviewField label="Tagline" value={draft.tagline} /><div className="sm:col-span-2"><ReviewField label="Description" value={draft.description} /></div></div><div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><ReviewImage file={files.profile_image} label="Profile image" className="mx-auto aspect-square w-40" shape="circle" /><ReviewImage file={files.banner_image} label="Banner image" className="aspect-[2/1] w-full" /></div></section>
            <section className="space-y-4"><div><h3 className="text-base font-semibold">Step 3 — Store information</h3><p className="text-muted-foreground">Business details, contact information, owner verification, and uploaded documents.</p></div><div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><ReviewField label="Business structure" value={structures.find(([value]) => value === draft.business_structure)?.[1]} /><ReviewField label="Business registration" value={registrations.find(([value]) => value === draft.business_registration)?.[1]} /><ReviewField label="ID type" value={draft.valid_id_type} /><ReviewField label="Contact email" value={draft.contact_email} /><ReviewField label="Mobile number" value={draft.contact_mobile_phone ? `+63${draft.contact_mobile_phone}` : null} /><ReviewField label="Telephone number" value={draft.contact_telephone} /></div><div className="space-y-3 rounded-lg border p-4"><h4 className="font-semibold">Owner verification</h4><div className="grid gap-4 sm:grid-cols-2"><ReviewImage file={files.valid_id_front} label="Valid ID front" /><ReviewImage file={files.valid_id_back} label="Valid ID back" /><ReviewImage file={files.selfie} label="Selfie" /><ReviewImage file={files.store_capture} label="Store image" /></div></div><div className="space-y-3 rounded-lg border p-4"><h4 className="font-semibold">Business documents</h4><div className="grid gap-4 sm:grid-cols-2">{Object.entries(files.documents).map(([key, file]) => file && <ReviewFile key={key} file={file} label={key.replaceAll('_', ' ')} />)}{files.other_documents.map((file, index) => file && <ReviewFile key={`other-${index}`} file={file} label={`Other supporting document ${index + 1}`} />)}</div>{!Object.values(files.documents).some(Boolean) && !files.other_documents.some(Boolean) && <p className="text-sm text-muted-foreground">No documents provided.</p>}</div></section>
            <section className="space-y-4"><div><h3 className="text-base font-semibold">Step 4 — Store location</h3><p className="text-muted-foreground">Registered address and exact map location.</p></div><div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3"><ReviewField label="House / Unit / Building" value={draft.house_unit_building} /><ReviewField label="Street" value={draft.street} /><ReviewField label="Barangay" value={draft.barangay} /><ReviewField label="City / Municipality" value={draft.city_municipality} /><ReviewField label="Province" value={draft.province} /><ReviewField label="Region" value={draft.region} /><ReviewField label="ZIP code" value={draft.zip_code} /><ReviewField label="Latitude" value={draft.latitude} /><ReviewField label="Longitude" value={draft.longitude} /></div><LocationMap latitude={typeof draft.latitude === 'number' ? draft.latitude : null} longitude={typeof draft.longitude === 'number' ? draft.longitude : null} googleMapsApiKey={googleMapsApiKey} /></section>
        </section>}
        <div className="flex justify-between"><Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((current) => current - 1)}><ChevronLeft />Back</Button>{step < 5 ? <Button type="button" onClick={next} disabled={locating || !canContinue}>{step === 4 ? 'Review application' : 'Continue'}<ChevronRight /></Button> : <Button type="button" onClick={() => setConfirmOpen(true)} disabled={submitting}>Submit Store for Approval<ChevronRight /></Button>}</div>
    </CardContent></Card></div><StorePreview draft={draft} files={files} googleMapsApiKey={googleMapsApiKey} categoryName={selectedCategory?.name} typeName={selectedType?.name} /></div></main>
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent><DialogHeader><DialogTitle>Submit store for approval?</DialogTitle><DialogDescription>Please confirm that the classification, information, location, and images are accurate.</DialogDescription></DialogHeader><div className="flex items-start gap-3 rounded-md border p-3"><Checkbox id="store-policies" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} /><label htmlFor="store-policies" className="text-sm">I agree to the store{' '}<button type="button" className="text-primary underline" onClick={() => setTermsOpen(true)}>Terms and Conditions</button>{' '}and acknowledge the{' '}<button type="button" className="text-primary underline" onClick={() => setPrivacyOpen(true)}>Privacy Policy</button>.</label></div><DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)}>Review again</Button><Button disabled={!agreed || submitting} onClick={submit}>Confirm and submit</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={termsOpen} onOpenChange={setTermsOpen}><DialogContent><DialogHeader><DialogTitle>Store Terms and Conditions</DialogTitle><DialogDescription>By submitting a store, you confirm that the information, images, location, and documents provided are accurate, current, and authorized for Rapex review. You agree not to submit fraudulent, misleading, or unauthorized information.</DialogDescription></DialogHeader><DialogFooter><Button type="button" onClick={() => setTermsOpen(false)}>Close</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}><DialogContent><DialogHeader><DialogTitle>Store Privacy Policy</DialogTitle><DialogDescription>Rapex collects the store information, location, images, identity documents, and supporting files provided in this application to review store eligibility. Information is stored privately, accessed only by authorized reviewers, and retained according to Rapex records and legal requirements.</DialogDescription></DialogHeader><DialogFooter><Button type="button" onClick={() => setPrivacyOpen(false)}>Close</Button></DialogFooter></DialogContent></Dialog>
    </>;
}

Page.layout = { breadcrumbs: [{ title: 'Store Management', href: '/store-management/stores' }, { title: 'Stores', href: '/store-management/stores' }, { title: 'Create', href: '/store-management/stores/create' }] };
