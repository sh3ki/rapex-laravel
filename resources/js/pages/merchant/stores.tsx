import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Mail, MapPin, Phone, Smartphone, Store as StoreIcon, Upload } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import { LocationMap } from '@/components/location-map';
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
type Props = { categories?: Category[]; types?: StoreType[]; googleMapsApiKey?: string };
export type Draft = Record<string, string | number | null>;
export type Files = { profile_image: File | null; banner_image: File | null };
type PreviewFiles = { profile_image: File | string | null; banner_image: File | string | null };

const steps = ['Store Classification', 'Store Profile', 'Store Information', 'Store Location', 'Review'];
const structures = [['sole-proprietorship', 'Sole Proprietorship'], ['opc', 'One Person Corporation (OPC)'], ['partnership', 'Partnership'], ['corporation', 'Corporation'], ['cooperative', 'Cooperative']];
const registrations = [['unregistered-microseller', 'Unregistered / Microseller'], ['non-vat-registration', 'Non-VAT Registration'], ['vat-registration', 'VAT Registration']];
const emptyDraft: Draft = { store_category_id: '', store_type_id: '', name: '', tagline: '', description: '', business_structure: '', business_registration: '', contact_email: '', contact_mobile_phone: '', contact_telephone: '', house_unit_building: '', street: '', barangay: '', city_municipality: '', province: '', region: '', zip_code: '', latitude: null, longitude: null };

function FieldError({ message }: { message?: string }) { return message ? <p className="text-sm text-destructive">{message}</p> : null; }

export function StorePreview({ draft, files, googleMapsApiKey, categoryName, typeName }: { draft: Draft; files: PreviewFiles; googleMapsApiKey?: string; categoryName?: string; typeName?: string }) {
    const profileUrl = typeof files.profile_image === 'string' ? files.profile_image : files.profile_image ? URL.createObjectURL(files.profile_image) : null;
    const bannerUrl = typeof files.banner_image === 'string' ? files.banner_image : files.banner_image ? URL.createObjectURL(files.banner_image) : null;
    const value = (key: string) => String(draft[key] || 'Not provided');
    const address = [draft.house_unit_building, draft.street, draft.barangay, draft.city_municipality, draft.province, draft.region, draft.zip_code].filter(Boolean).join(', ');
    const hasLocation = typeof draft.latitude === 'number' && typeof draft.longitude === 'number';

    return <aside className="flex justify-center lg:sticky lg:top-6 lg:self-start">
        <div className="relative w-full max-w-[360px] rounded-[2.5rem] border-2 border-violet-300/70 bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-700/80 dark:border-violet-200/50 dark:bg-slate-700 dark:ring-slate-400/60">
            <div className="absolute top-20 -left-1.5 flex flex-col gap-2" aria-hidden="true"><span className="h-7 w-1 rounded-l-full bg-slate-800 dark:bg-slate-500" /><span className="h-12 w-1 rounded-l-full bg-slate-800 dark:bg-slate-500" /><span className="h-12 w-1 rounded-l-full bg-slate-800 dark:bg-slate-500" /></div>
            <div className="absolute top-28 -right-1.5 h-16 w-1 rounded-r-full bg-slate-800 dark:bg-slate-500" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border-4 border-slate-950 bg-background text-foreground dark:border-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="absolute top-2 left-1/2 z-20 flex h-4 w-14 -translate-x-1/2 items-center justify-end rounded-full bg-slate-950 px-1 shadow-sm" aria-hidden="true"><span className="size-1.5 rounded-full bg-slate-700 ring-1 ring-slate-500/60" /></div>
                <div className="relative aspect-[2/1] bg-gradient-to-br from-primary/70 via-primary/40 to-muted">
                    {bannerUrl && <img src={bannerUrl} alt="Store banner preview" className="size-full object-contain" />}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="relative px-4 pb-5">
                    <div className="-mt-9 flex items-end justify-between">
                        <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-slate-200 text-primary shadow-sm dark:bg-slate-700">
                            {profileUrl ? <img src={profileUrl} alt="Store profile preview" className="size-full object-cover" /> : <StoreIcon className="size-7" />}
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground dark:bg-slate-700 dark:text-slate-200">Preview</span>
                    </div>
                    <div className="mt-3">
                        <h2 className="truncate text-lg font-semibold">{value('name') === 'Not provided' ? 'Your store name' : value('name')}</h2>
                        <p className="truncate text-xs text-muted-foreground dark:text-slate-300">{value('tagline') === 'Not provided' ? 'Your store tagline' : value('tagline')}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Store classification">
                        <span className="rounded-full border border-primary/40 bg-primary/20 px-2 py-1 text-[10px] font-medium text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-slate-100">{categoryName || 'Store category'}</span>
                        <span className="rounded-full border border-slate-300 bg-slate-300/70 px-2 py-1 text-[10px] font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">{typeName || 'Store type'}</span>
                    </div>
                    <div className="mt-5 grid grid-cols-3 border-b text-center text-xs font-medium">
                        <span className="border-b-2 border-transparent px-2 py-2 text-muted-foreground dark:text-slate-300">Shop</span>
                        <span className="border-b-2 border-transparent px-2 py-2 text-muted-foreground dark:text-slate-300">Products</span>
                        <span className="border-primary text-primary border-b-2 px-2 py-2">About</span>
                    </div>
                    <div className="space-y-4 pt-5 text-xs">
                        <section><h3 className="mb-1 font-semibold">About the shop</h3><p className="text-muted-foreground">{value('description') === 'Not provided' ? 'Your shop description will appear here.' : value('description')}</p></section>
                        <section><h3 className="mb-1 font-semibold">Contact information</h3><div className="space-y-1 text-muted-foreground"><p className="flex items-center gap-1.5"><Mail className="size-3.5 shrink-0" aria-hidden="true" />{value('contact_email')}</p><p className="flex items-center gap-1.5"><Smartphone className="size-3.5 shrink-0" aria-hidden="true" />{value('contact_mobile_phone')}</p><p className="flex items-center gap-1.5"><Phone className="size-3.5 shrink-0" aria-hidden="true" />{value('contact_telephone')}</p></div></section>
                        <section><h3 className="mb-1 font-semibold">Address</h3><p className="flex items-start gap-1.5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{address || 'Your store address will appear here.'}</p></section>
                        <section><div className="mx-auto h-24 w-full overflow-hidden rounded-md">{hasLocation ? <LocationMap key={`${draft.latitude}-${draft.longitude}`} latitude={draft.latitude as number} longitude={draft.longitude as number} compact googleMapsApiKey={googleMapsApiKey} /> : <div className="bg-muted text-muted-foreground flex h-24 items-center justify-center">Location preview</div>}</div></section>
                    </div>
                </div>
            </div>
        </div>
    </aside>;
}

export default function Page({ categories = [], types = [], googleMapsApiKey }: Props) {
    const [step, setStep] = useState(1);
    const [draft, setDraft] = useState<Draft>(emptyDraft);
    const [files, setFiles] = useState<Files>({ profile_image: null, banner_image: null });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [locating, setLocating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const update = (key: string, value: string | number | null) => setDraft((current) => ({ ...current, [key]: value }));
    const error = (key: string) => <FieldError message={errors[key]} />;

    const locate = () => {
        if (!navigator.geolocation) { notify.error('Location access is not available in this browser.'); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition((position) => { update('latitude', position.coords.latitude); update('longitude', position.coords.longitude); setLocating(false); }, () => { setLocating(false); notify.error('Location access is required. Please allow access and try again.'); }, { enableHighAccuracy: true, timeout: 10000 });
    };
    useEffect(() => { locate(); }, []);

    const validate = (keys: string[], fileKeys: (keyof Files)[] = []) => {
        const next: Record<string, string> = {};
        keys.forEach((key) => { if (!draft[key]) next[key] = 'This field is required.'; });
        fileKeys.forEach((key) => { if (!files[key]) next[key] = 'This image is required.'; });
        setErrors(next);
        if (Object.keys(next).length) notify.error('Please complete the required fields before continuing.');
        return Object.keys(next).length === 0;
    };
    const nextStep = () => {
        if (step === 1 && validate(['store_category_id', 'store_type_id'])) setStep(2);
        else if (step === 2 && validate(['name', 'tagline', 'description'], ['profile_image', 'banner_image'])) setStep(3);
        else if (step === 3 && validate(['business_structure', 'business_registration'])) setStep(4);
        else if (step === 4 && validate(['house_unit_building', 'street', 'barangay', 'city_municipality', 'province', 'region', 'zip_code', 'latitude', 'longitude'])) setStep(5);
    };
    const submit = () => {
        const data = new FormData();
        Object.entries(draft).forEach(([key, value]) => data.append(key, String(value ?? '')));
        data.append('profile_image', files.profile_image!); data.append('banner_image', files.banner_image!); data.append('terms_accepted', '1');
        router.post('/store-management/stores', data, { forceFormData: true, onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false), onError: (formErrors) => setErrors(formErrors as Record<string, string>), onSuccess: () => setConfirmOpen(false) });
    };
    const fileChange = (key: keyof Files) => (event: ChangeEvent<HTMLInputElement>) => setFiles((current) => ({ ...current, [key]: event.target.files?.[0] ?? null }));

    return <>
        <Head title="Create Store" />
        <main className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold">Create Store</h1>
                <p className="text-muted-foreground">
                    Complete the steps below to submit your store for approval.
                </p>
            </div>
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"><Card><CardHeader><div className="flex flex-wrap gap-2">{steps.map((label, index) => <button key={label} type="button" onClick={() => index + 1 < step && setStep(index + 1)} className={`rounded-full px-3 py-1 text-sm ${step === index + 1 ? 'bg-primary text-primary-foreground' : index + 1 < step ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{index + 1}. {label}</button>)}</div></CardHeader><CardContent className="space-y-6">
                {step === 1 && <section className="space-y-5"><div><CardTitle>Store Profile</CardTitle><CardDescription>Tell customers about your store.</CardDescription></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">Store name *</Label><Input id="name" maxLength={30} value={String(draft.name)} onChange={(event) => update('name', event.target.value)} />{error('name')}</div><div className="space-y-2"><Label htmlFor="tagline">Store tagline *</Label><Input id="tagline" maxLength={80} value={String(draft.tagline)} onChange={(event) => update('tagline', event.target.value)} />{error('tagline')}</div></div><div className="space-y-2"><Label htmlFor="description">Store description *</Label><textarea id="description" maxLength={500} rows={5} value={String(draft.description)} onChange={(event) => update('description', event.target.value)} className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" />{error('description')}</div><div className="grid gap-4 sm:grid-cols-2">{(['profile_image', 'banner_image'] as const).map((key) => <div key={key} className="space-y-2"><Label htmlFor={key}>{key === 'profile_image' ? 'Profile image' : 'Banner image'} *</Label><Input id={key} type="file" accept="image/*" onChange={fileChange(key)} />{files[key] && <img src={URL.createObjectURL(files[key]!)} alt="Preview" className="h-32 w-full rounded-md border object-cover" />}{error(key)}</div>)}</div></section>}
                {step === 2 && <section className="space-y-5"><div><CardTitle>Store Information</CardTitle><CardDescription>Provide your business and contact details.</CardDescription></div><div className="grid gap-4 sm:grid-cols-2">{([['business_structure', 'Business structure', structures], ['business_registration', 'Business registration', registrations]] as const).map(([key, label, options]) => <div key={key} className="space-y-2"><Label htmlFor={key}>{label} *</Label><Select value={String(draft[key])} onValueChange={(value) => update(key, value)}><SelectTrigger id={key} className="w-full"><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent></Select>{error(key)}</div>)}</div><div className="grid gap-4 sm:grid-cols-3">{[['contact_email', 'Contact email', 'email'], ['contact_mobile_phone', 'Mobile number', 'tel'], ['contact_telephone', 'Telephone number', 'tel']].map(([key, label, type]) => <div key={key} className="space-y-2"><Label htmlFor={key}>{label}</Label><Input id={key} type={type} value={String(draft[key])} onChange={(event) => update(key, event.target.value)} />{error(key)}</div>)}</div></section>}
                {step === 3 && <section className="space-y-5"><div><CardTitle className="flex items-center gap-2"><MapPin className="size-5" />Store Location</CardTitle><CardDescription>Allow location access so we can save your store coordinates.</CardDescription></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[['house_unit_building', 'House / Unit / Building'], ['street', 'Street'], ['barangay', 'Barangay'], ['city_municipality', 'City / Municipality'], ['province', 'Province'], ['region', 'Region'], ['zip_code', 'ZIP code']].map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={key}>{label} *</Label><Input id={key} value={String(draft[key])} onChange={(event) => update(key, event.target.value)} />{error(key)}</div>)}</div><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{draft.latitude && draft.longitude ? `Location detected: ${draft.latitude}, ${draft.longitude}` : 'Location access is required.'}</p><Button type="button" variant="outline" onClick={locate} disabled={locating}>{locating ? 'Detecting...' : 'Use my current location'}</Button></div>{error('latitude')}{error('longitude')}<LocationMap latitude={typeof draft.latitude === 'number' ? draft.latitude : null} longitude={typeof draft.longitude === 'number' ? draft.longitude : null} googleMapsApiKey={googleMapsApiKey} /></section>}
                {step === 4 && <section className="space-y-6"><div><CardTitle>Review and Submit</CardTitle><CardDescription>Review all information before submitting your store for approval.</CardDescription></div><div className="grid gap-4 sm:grid-cols-2">{[['Store name', draft.name], ['Tagline', draft.tagline], ['Description', draft.description], ['Business structure', structures.find(([value]) => value === draft.business_structure)?.[1]], ['Business registration', registrations.find(([value]) => value === draft.business_registration)?.[1]], ['Contact email', draft.contact_email], ['Mobile number', draft.contact_mobile_phone], ['Telephone number', draft.contact_telephone], ['House / Unit / Building', draft.house_unit_building], ['Street', draft.street], ['Barangay', draft.barangay], ['City / Municipality', draft.city_municipality], ['Province', draft.province], ['Region', draft.region], ['ZIP code', draft.zip_code], ['Latitude', draft.latitude], ['Longitude', draft.longitude]].map(([label, value]) => <div key={String(label)} className="rounded-md border p-3"><p className="text-muted-foreground text-sm">{label}</p><p className="font-medium">{String(value || 'Not provided')}</p></div>)}</div><div className="grid gap-4 sm:grid-cols-2">{(['profile_image', 'banner_image'] as const).map((key) => <div key={key}>{files[key] && <img src={URL.createObjectURL(files[key]!)} alt="Preview" className="h-40 w-full rounded-md border object-cover" />}<p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Upload className="size-4" />{files[key]?.name}</p></div>)}</div><Button type="button" className="w-full" disabled={submitting} onClick={() => setConfirmOpen(true)}>{submitting ? 'Submitting...' : 'Submit Store for Approval'}</Button></section>}
                <div className="flex justify-between"><Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((current) => current - 1)}><ChevronLeft />Back</Button>{step < 4 && <Button type="button" onClick={nextStep} disabled={locating}>Continue<ChevronRight /></Button>}</div>
            </CardContent></Card><StorePreview draft={draft} files={files} googleMapsApiKey={googleMapsApiKey} /></div>
        </main>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent><DialogHeader><DialogTitle>Submit store for approval?</DialogTitle><DialogDescription>Please confirm that all store information and uploaded images are accurate.</DialogDescription></DialogHeader><div className="flex items-start gap-3 rounded-md border p-3"><Checkbox id="store-policies" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} /><label htmlFor="store-policies" className="text-sm leading-5">I agree to the store <button type="button" className="text-primary underline" onClick={() => setTermsOpen(true)}>Terms and Conditions</button> and acknowledge the <button type="button" className="text-primary underline" onClick={() => setPrivacyOpen(true)}>Privacy Policy</button>.</label></div><DialogFooter><Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Review again</Button><Button type="button" disabled={!agreed || submitting} onClick={submit}>Confirm and submit</Button></DialogFooter></DialogContent></Dialog>
        <Dialog open={termsOpen} onOpenChange={setTermsOpen}><DialogContent><DialogHeader><DialogTitle>Store Terms and Conditions</DialogTitle><DialogDescription>You confirm that your store information is accurate and that you are authorized to operate the submitted business.</DialogDescription></DialogHeader><DialogFooter><Button onClick={() => setTermsOpen(false)}>Close</Button></DialogFooter></DialogContent></Dialog>
        <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}><DialogContent><DialogHeader><DialogTitle>Store Privacy Policy</DialogTitle><DialogDescription>Rapex uses your submitted store information and location to review and manage your store application.</DialogDescription></DialogHeader><DialogFooter><Button onClick={() => setPrivacyOpen(false)}>Close</Button></DialogFooter></DialogContent></Dialog>
    </>;
}

Page.layout = { breadcrumbs: [{ title: 'Store Management', href: '/store-management/stores' }, { title: 'Stores', href: '/store-management/stores' }, { title: 'Create', href: '/store-management/stores/create' }] };
