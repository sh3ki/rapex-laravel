import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type MultiSelectOption = { value: string; label: string };

export default function MultiSelect({
    value,
    options,
    onChange,
    placeholder = 'Select options',
}: {
    value: string[];
    options: MultiSelectOption[];
    onChange: (value: string[]) => void;
    placeholder?: string;
}) {
    const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);
    const displayValue = selectedLabels.length === 0
        ? placeholder
        : selectedLabels.length === 1
            ? selectedLabels[0]
            : `${selectedLabels.length} selected`;

    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className={cn('border-input data-[placeholder]:text-muted-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md bg-transparent px-3 py-2 text-sm font-normal whitespace-nowrap shadow-xs', value.length === 0 && 'text-muted-foreground')}>
                <span className="truncate">{displayValue}</span>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[12rem]">
            {options.length === 0 ? <div className="text-muted-foreground px-2 py-1.5 text-sm">No options available</div> : options.map((option) => <DropdownMenuCheckboxItem key={option.value} checked={value.includes(option.value)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => onChange(checked ? [...value, option.value] : value.filter((item) => item !== option.value))}>
                {option.label}
            </DropdownMenuCheckboxItem>)}
        </DropdownMenuContent>
    </DropdownMenu>;
}
