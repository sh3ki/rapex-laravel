import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Level = 'region' | 'province' | 'locality' | 'barangay';
type Option = { id: number; name: string; kind?: 'city' | 'municipality'; zip_code?: string | null };
type Draft = Record<string, string | number | null>;

type Props = {
    draft: Draft;
    update: (key: string, value: string | number | null) => void;
    error?: (key: string) => ReactNode;
};

const levels: Array<{ level: Level; label: string; key: string }> = [
    { level: 'region', label: 'Region', key: 'region' },
    { level: 'province', label: 'Province', key: 'province' },
    { level: 'locality', label: 'City / Municipality', key: 'city_municipality' },
    { level: 'barangay', label: 'Barangay', key: 'barangay' },
];

export function SearchableAddressFields({ draft, update, error }: Props) {
    const [selected, setSelected] = useState<Record<Level, Option | null>>({ region: null, province: null, locality: null, barangay: null });
    const [queries, setQueries] = useState<Record<Level, string>>({ region: '', province: '', locality: '', barangay: '' });
    const [options, setOptions] = useState<Record<Level, Option[]>>({ region: [], province: [], locality: [], barangay: [] });
    const [open, setOpen] = useState<Level | null>(null);
    const [loading, setLoading] = useState<Level | null>(null);
    const requestRef = useRef<Record<Level, AbortController | null>>({ region: null, province: null, locality: null, barangay: null });

    const parents = useMemo(() => ({
        region: { parentId: undefined, parentType: undefined },
        province: { parentId: selected.region?.id, parentType: undefined },
        locality: { parentId: selected.province?.id, parentType: undefined },
        barangay: { parentId: selected.locality?.id, parentType: selected.locality?.kind },
    }), [selected]);

    useEffect(() => {
        const level = open;
        if (!level) return;
        const parent = parents[level];
        if (level !== 'region' && !parent.parentId) {
            setOptions((current) => ({ ...current, [level]: [] }));
            return;
        }
        const timer = window.setTimeout(async () => {
            requestRef.current[level]?.abort();
            const controller = new AbortController();
            requestRef.current[level] = controller;
            setLoading(level);
            const params = new URLSearchParams({ level, q: queries[level], limit: '30' });
            if (parent.parentId) params.set('parent_id', String(parent.parentId));
            if (parent.parentType) params.set('parent_type', parent.parentType);
            try {
                const response = await fetch(`/address-options?${params.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
                if (!response.ok) throw new Error('Address search failed.');
                const payload = await response.json() as { data: Option[] };
                setOptions((current) => ({ ...current, [level]: payload.data }));
            } catch (requestError) {
                if ((requestError as Error).name !== 'AbortError') setOptions((current) => ({ ...current, [level]: [] }));
            } finally {
                if (!controller.signal.aborted) setLoading(null);
            }
        }, 250);
        return () => window.clearTimeout(timer);
    }, [open, queries, parents]);

    const resetBelow = (level: Level) => {
        const index = levels.findIndex((item) => item.level === level);
        for (const item of levels.slice(index + 1)) {
            update(item.key, '');
            setQueries((current) => ({ ...current, [item.level]: '' }));
            setSelected((current) => ({ ...current, [item.level]: null }));
            setOptions((current) => ({ ...current, [item.level]: [] }));
        }
        if (level !== 'barangay') update('zip_code', '');
    };

    const choose = (level: Level, option: Option) => {
        const item = levels.find((entry) => entry.level === level)!;
        setSelected((current) => ({ ...current, [level]: option }));
        setQueries((current) => ({ ...current, [level]: option.name }));
        update(item.key, option.name);
        if (level === 'barangay') update('zip_code', option.zip_code ?? '');
        resetBelow(level);
        setOpen(null);
    };

    const type = (level: Level, value: string) => {
        const item = levels.find((entry) => entry.level === level)!;
        setQueries((current) => ({ ...current, [level]: value }));
        setSelected((current) => ({ ...current, [level]: null }));
        update(item.key, value);
        resetBelow(level);
        setOpen(level);
    };

    const clear = (level: Level) => {
        const item = levels.find((entry) => entry.level === level)!;
        setSelected((current) => ({ ...current, [level]: null }));
        setQueries((current) => ({ ...current, [level]: '' }));
        setOptions((current) => ({ ...current, [level]: [] }));
        update(item.key, '');
        if (level === 'barangay') update('zip_code', '');
        resetBelow(level);
        setOpen(level);
    };

    return <>
        {levels.map(({ level, label, key }) => {
            const previousKey = levels[levels.findIndex((item) => item.level === level) - 1]?.key;
            const parentReady = level === 'region' || Boolean(parents[level].parentId || (previousKey && draft[previousKey]));
            const selectedOption = selected[level];
            const isOpen = open === level;
            return <div key={level} className={`relative space-y-2 ${isOpen ? 'z-[2000]' : 'z-0'}`}>
                <Label htmlFor={`address-${level}`}>{label} *</Label>
                <Input
                    id={`address-${level}`}
                    value={selectedOption?.name ?? (queries[level] || String(draft[key] ?? ''))}
                    readOnly={Boolean(selectedOption)}
                    className={selectedOption ? 'cursor-text' : undefined}
                    disabled={!parentReady}
                    placeholder={parentReady ? `Search ${label.toLowerCase()}...` : `Select ${levels[levels.findIndex((item) => item.level === level) - 1]?.label.toLowerCase()} first`}
                    autoComplete="off"
                    onFocus={(event) => {
                        setOpen(level);
                        if (selectedOption) {
                            const position = event.currentTarget.value.length;
                            event.currentTarget.setSelectionRange(position, position);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (!selectedOption) return;
                        if (event.key === 'Backspace' || event.key === 'Delete') {
                            event.preventDefault();
                            clear(level);
                        } else {
                            event.preventDefault();
                        }
                    }}
                    onChange={(event) => type(level, event.target.value)}
                    onBlur={() => window.setTimeout(() => setOpen((current) => current === level ? null : current), 150)}
                    aria-expanded={isOpen}
                />
                {isOpen && parentReady && <div className="absolute z-[2000] mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    {loading === level && <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>}
                    {!loading && options[level].length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No matches found.</p>}
                    {!loading && options[level].map((option) => <button key={`${option.kind ?? level}-${option.id}`} type="button" className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(level, option)}><span>{option.name}{option.kind ? ` (${option.kind})` : ''}</span>{option.zip_code && <span className="text-xs text-muted-foreground">{option.zip_code}</span>}</button>)}
                </div>}
                {error?.(key)}
            </div>;
        })}
    </>;
}

export function AddressZipCodeField({ draft, error }: { draft: Draft; error?: (key: string) => ReactNode }) {
    return <div className="space-y-2"><Label htmlFor="address-zip-code">ZIP code *</Label><Input id="address-zip-code" value={String(draft.zip_code ?? '')} readOnly placeholder="Select a barangay" />{error?.('zip_code')}</div>;
}
