import { Check, Filter, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import MultiSelect, { type MultiSelectOption } from '@/components/multi-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export type FilterOption = MultiSelectOption;

export default function FilterModal({
    value,
    options,
    onApply,
    label = 'Filter',
}: {
    value: string[];
    options: FilterOption[];
    onApply: (value: string[]) => void;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const [draftValue, setDraftValue] = useState(value);

    useEffect(() => {
        if (open) setDraftValue(value);
    }, [open, value]);

    const apply = () => {
        onApply(draftValue);
        setOpen(false);
    };

    const clear = () => {
        setDraftValue([]);
        onApply([]);
        setOpen(false);
    };

    return <>
        <Button type="button" variant="outline" size="icon" onClick={() => setOpen(true)} aria-label={label} title={label} className={`relative overflow-visible ${value.length > 0 ? 'border-primary text-primary' : ''}`}>
            <Filter className="size-4" />
            {value.length > 0 && <span className="bg-destructive absolute -top-1 -right-1 size-2.5 rounded-full" aria-label="Active filter" />}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{label}</DialogTitle>
                    <DialogDescription>Refine the store types shown in the table.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                    <Label htmlFor="store-type-filter-category">Category</Label>
                    <MultiSelect value={draftValue} options={options} onChange={setDraftValue} placeholder="All categories" />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={clear}><RotateCcw className="size-4" />Reset filter</Button>
                    <Button type="button" onClick={apply}><Check className="size-4" />Apply filters</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>;
}
