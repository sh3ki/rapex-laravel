import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText, MapPin } from 'lucide-react';
import { LocationMap } from '@/components/location-map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StorePreview, type Draft } from '@/pages/merchant/stores';

type DocumentRecord = { id: number; type: string; name: string; mime_type: string; url: string };
type StoreRecord = Draft & {
    id: number; name: string; tagline: string; description: string; status: string;
    category_name?: string | null; type_name?: string | null; valid_id_type?: string | null;
    profile_image?: string | null; banner_image?: string | null;
    documents: DocumentRecord[];
};

const structures: Record<string, string> = { 'sole-proprietorship': 'Sole Proprietorship', opc: 'One Person Corporation (OPC)', partnership: 'Partnership', corporation: 'Corporation', cooperative: 'Cooperative' };
const registrations: Record<string, string> = { 'unregistered-microseller': 'Unregistered / Microseller', 'non-vat-registration': 'Non-VAT Registration', 'vat-registration': 'VAT Registration' };

function value(input: unknown) { return input === null || input === undefined || String(input).trim() === '' ? 'Not provided' : String(input); }
function Field({ label, input }: { label: string; input: unknown }) { return <div><p className="font-medium text-muted-foreground">{label}</p><p className="whitespace-pre-wrap break-words">{value(input)}</p></div>; }
function title(input: string) { return input.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default function Page({ store, googleMapsApiKey }: { store: StoreRecord; googleMapsApiKey?: string }) {
    const draft = store as Draft;
    const files = { profile_image: store.profile_image ?? null, banner_image: store.banner_image ?? null };
    const address = [store.house_unit_building, store.street, store.barangay, store.city_municipality, store.province, store.region, store.zip_code].filter(Boolean).join(', ');

    return <>
        <Head title={`${store.name} - Store details`} />
        <main className="space-y-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div><Button asChild variant="ghost" className="mb-2 -ml-3"><Link href="/store-management/stores"><ArrowLeft />Back to stores</Link></Button><h1 className="text-2xl font-semibold">{store.name}</h1><p className="text-muted-foreground">Review the complete store submission and customer-facing preview.</p></div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium capitalize text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">{store.status}</span>
            </div>
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-6">
                    <Card><CardHeader><CardTitle>Store classification</CardTitle><CardDescription>The category and type customers will see.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Field label="Store category" input={store.category_name} /><Field label="Store type" input={store.type_name} /></CardContent></Card>
                    <Card><CardHeader><CardTitle>Store profile</CardTitle><CardDescription>Store identity, description, and public images.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Store name" input={store.name} /><Field label="Tagline" input={store.tagline} /><div className="sm:col-span-2"><Field label="Description" input={store.description} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-2 font-medium text-muted-foreground">Profile image</p>{store.profile_image && <img src={store.profile_image} alt="Store profile" className="mx-auto aspect-square w-40 rounded-full border object-cover" />}</div><div><p className="mb-2 font-medium text-muted-foreground">Banner image</p>{store.banner_image && <img src={store.banner_image} alt="Store banner" className="aspect-[2/1] w-full rounded-md border object-contain" />}</div></div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Store information</CardTitle><CardDescription>Business, contact, and uploaded verification details.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Business structure" input={structures[String(store.business_structure)]} /><Field label="Business registration" input={registrations[String(store.business_registration)]} /><Field label="Valid ID type" input={store.valid_id_type} /><Field label="Contact email" input={store.contact_email} /><Field label="Mobile number" input={store.contact_mobile_phone} /><Field label="Telephone number" input={store.contact_telephone} /></div><div><h3 className="mb-3 font-semibold">Submitted documents</h3><div className="grid gap-3 sm:grid-cols-2">{store.documents.map((document) => <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border p-3 text-sm hover:border-primary"><FileText className="size-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block font-medium">{title(document.type)}</span><span className="block truncate text-muted-foreground">{document.name}</span></span></a>)}{store.documents.length === 0 && <p className="text-sm text-muted-foreground">No documents provided.</p>}</div></div></CardContent></Card>
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-5" />Store location</CardTitle><CardDescription>Registered address and exact map location.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="House / Unit / Building" input={store.house_unit_building} /><Field label="Street" input={store.street} /><Field label="Barangay" input={store.barangay} /><Field label="City / Municipality" input={store.city_municipality} /><Field label="Province" input={store.province} /><Field label="Region" input={store.region} /><Field label="ZIP code" input={store.zip_code} /><Field label="Latitude" input={store.latitude} /><Field label="Longitude" input={store.longitude} /></div><p className="text-sm text-muted-foreground">{address}</p><LocationMap latitude={Number(store.latitude)} longitude={Number(store.longitude)} googleMapsApiKey={googleMapsApiKey} /></CardContent></Card>
                </div>
                <StorePreview draft={draft} files={files} googleMapsApiKey={googleMapsApiKey} categoryName={store.category_name ?? undefined} typeName={store.type_name ?? undefined} />
            </div>
        </main>
    </>;
}

Page.layout = { breadcrumbs: [{ title: 'Store Management', href: '/store-management/stores' }, { title: 'Stores', href: '/store-management/stores' }, { title: 'Details', href: '#' }] };
