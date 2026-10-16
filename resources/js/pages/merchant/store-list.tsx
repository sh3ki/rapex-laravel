import { Head, Link } from '@inertiajs/react';
import { LockKeyhole, Plus, Store as StoreIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import SearchBar from '@/components/search-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type StoreRecord = { id: number; slot: number; name: string; status: string; profile_image?: string | null; banner_image?: string | null };

export default function Page({ stores = [] }: { stores?: StoreRecord[] }) {
    const [search, setSearch] = useState('');
    const slots = useMemo(() => Array.from({ length: 10 }, (_, index) => index + 1), []);
    const filteredSlots = slots.filter((slot) => {
        const store = stores.find((item) => item.slot === slot);
        return !search.trim() || `store ${slot} ${store?.name ?? ''}`.toLowerCase().includes(search.trim().toLowerCase());
    });
    const canCreate = stores.length < 2;

    return <>
        <Head title="Stores" />
        <main className="space-y-6 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div><h1 className="text-2xl font-semibold">Stores</h1><p className="text-muted-foreground">Manage your stores from one place.</p></div>
                <Button asChild disabled={!canCreate}><Link href="/store-management/stores/create"><Plus />Create Store</Link></Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><SearchBar value={search} onChange={setSearch} placeholder="Search stores..." /><p className="text-sm text-muted-foreground">{stores.length} of 2 unlocked stores used</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredSlots.map((slot) => {
                    const store = stores.find((item) => item.slot === slot);
                    const unlocked = slot <= 2;
                    const card = <Card className={!unlocked ? 'bg-muted/30' : undefined}>
                        <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2">{unlocked ? <StoreIcon className="size-5 text-primary" /> : <LockKeyhole className="text-muted-foreground size-5" />}Store {slot}</CardTitle><span className="text-xs text-muted-foreground">{unlocked ? 'Unlocked' : 'Locked'}</span></div><CardDescription>{store?.name ?? (unlocked ? 'Available for setup' : 'Unlocks as your store limit expands')}</CardDescription></CardHeader>
                        <CardContent>{store ? <span className="text-sm font-medium capitalize text-amber-600 dark:text-amber-400">{store.status}</span> : unlocked ? <span className="flex items-center gap-2 text-sm font-medium text-primary"><Plus className="size-4" />Create a store</span> : <span className="text-sm text-muted-foreground">Not available yet</span>}</CardContent>
                    </Card>;

                    if (store) return <Link key={slot} href={`/store-management/stores/${store.id}`} className="block rounded-xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring">{card}</Link>;
                    return unlocked ? <Link key={slot} href="/store-management/stores/create" className="block rounded-xl outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring">{card}</Link> : <div key={slot}>{card}</div>;
                })}
            </div>
            {filteredSlots.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No store slots match your search.</p>}
        </main>
    </>;
}

Page.layout = { breadcrumbs: [{ title: 'Store Management', href: '/store-management/stores' }, { title: 'Stores', href: '/store-management/stores' }] };
